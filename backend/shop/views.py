from decimal import Decimal
from django.db import transaction
from django.db.models import Q
from django.utils.timezone import now
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from .models import Product, Inventory, Sale, SaleItem, Payment, StockMove
from .serializers import (
    ProductSerializer,
    ProductCreateUpdateSerializer,
    SaleSerializer,
    StockMoveSerializer,
)
import re


def normalize_barcode_for_search(barcode_str):
    """Normalize barcode by extracting valid pattern from potentially duplicated code"""
    if not barcode_str:
        return None
    
    # Convert to string and strip whitespace
    barcode = str(barcode_str).strip()
    
    # Remove all whitespace characters (spaces, tabs, newlines)
    barcode = ''.join(barcode.split())
    
    # Remove common non-printable characters
    barcode = re.sub(r'[\x00-\x1F\x7F-\x9F]', '', barcode)
    
    # If barcode is too long, try to extract valid barcode (handle duplication)
    if len(barcode) > 20:
        # Try to find a repeating pattern
        for length in [8, 12, 13, 14]:
            pattern = barcode[:length]
            if len(pattern) == length and pattern.isdigit():
                # Check if the code is just this pattern repeated
                repetitions = len(barcode) // length
                if pattern * repetitions == barcode[:length * repetitions]:
                    return pattern
            # Also check if code ends with a valid barcode
            end_pattern = barcode[-length:]
            if len(end_pattern) == length and end_pattern.isdigit():
                # Check if this pattern appears at the start too
                if barcode.startswith(end_pattern):
                    return end_pattern
    
    return barcode


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 1000


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related("inventory").all()
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        Admin only for create/update/delete, authenticated for read.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return ProductCreateUpdateSerializer
        return ProductSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get("search", None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(barcode__icontains=search)
                | Q(sku__icontains=search)
            )
        return queryset

    def normalize_barcode_for_search(self, barcode_str):
        """Normalize barcode - delegates to module-level function"""
        return normalize_barcode_for_search(barcode_str)

    @action(detail=False, methods=["get"], url_path="by-barcode/(?P<barcode>[^/.]+)")
    def by_barcode(self, request, barcode=None):
        """Lookup product by barcode - used for scanning in POS and Admin"""
        import logging
        logger = logging.getLogger(__name__)
        
        if not barcode:
            return Response({"detail": "BARCODE_REQUIRED"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Log the received barcode for debugging
        logger.info(f"Barcode search requested: '{barcode}' (length: {len(barcode)})")
        
        # Normalize the searched barcode
        normalized_search = normalize_barcode_for_search(barcode)
        if not normalized_search:
            logger.warning(f"Invalid barcode after normalization: '{barcode}'")
            return Response({"detail": "INVALID_BARCODE"}, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info(f"Normalized barcode: '{normalized_search}' (original: '{barcode}')")
        
        # Strategy 1: Try exact match with normalized code (most common case)
        try:
            product = Product.objects.select_related("inventory").filter(barcode=normalized_search).first()
            if product:
                logger.info(f"Found product via exact match: {product.name}")
                return Response(ProductSerializer(product).data)
        except Exception as e:
            logger.error(f"Error in exact match search: {e}")
        
        # Strategy 2: Try exact match with original code (in case normalization changed it incorrectly)
        if barcode != normalized_search:
            try:
                product = Product.objects.select_related("inventory").filter(barcode=barcode).first()
                if product:
                    logger.info(f"Found product via original code match: {product.name}")
                    return Response(ProductSerializer(product).data)
            except Exception as e:
                logger.error(f"Error in original code search: {e}")
        
        # Strategy 3: Try case-insensitive match
        try:
            product = Product.objects.select_related("inventory").filter(barcode__iexact=normalized_search).first()
            if product:
                logger.info(f"Found product via case-insensitive match: {product.name}")
                return Response(ProductSerializer(product).data)
        except Exception as e:
            logger.error(f"Error in case-insensitive search: {e}")
        
        # Strategy 4: Try to find products where barcode contains the normalized code (for duplicated codes in DB)
        if len(normalized_search) >= 8:
            try:
                # Try contains match
                product = Product.objects.select_related("inventory").filter(barcode__contains=normalized_search).first()
                if product:
                    logger.info(f"Found product via contains match: {product.name} (stored barcode: {product.barcode})")
                    return Response(ProductSerializer(product).data)
                
                # Try startswith match
                product = Product.objects.select_related("inventory").filter(barcode__startswith=normalized_search).first()
                if product:
                    logger.info(f"Found product via startswith match: {product.name} (stored barcode: {product.barcode})")
                    return Response(ProductSerializer(product).data)
            except Exception as e:
                logger.error(f"Error in contains/startswith search: {e}")
        
        # Strategy 5: Try to normalize stored barcodes and match (for duplicated codes in DB)
        # This handles cases where stored barcodes have spaces or special characters
        try:
            all_products = Product.objects.select_related("inventory").all()
            for product in all_products:
                # Normalize stored barcode the same way we normalize the search
                normalized_stored = normalize_barcode_for_search(product.barcode)
                if normalized_stored and normalized_stored == normalized_search:
                    logger.info(f"Found product via stored barcode normalization: {product.name} (stored: '{product.barcode}' -> normalized: '{normalized_stored}')")
                    return Response(ProductSerializer(product).data)
        except Exception as e:
            logger.error(f"Error in stored barcode normalization search: {e}")
        
        # Strategy 6: Try removing all non-digit characters and matching (for alphanumeric codes)
        try:
            # Extract only digits from normalized search
            digits_only_search = ''.join(filter(str.isdigit, normalized_search))
            if digits_only_search and len(digits_only_search) >= 8:
                all_products = Product.objects.select_related("inventory").all()
                for product in all_products:
                    # Normalize stored barcode first
                    normalized_stored = normalize_barcode_for_search(product.barcode)
                    # Extract only digits from normalized stored barcode
                    digits_only_stored = ''.join(filter(str.isdigit, normalized_stored)) if normalized_stored else ''
                    if digits_only_stored == digits_only_search:
                        logger.info(f"Found product via digits-only match: {product.name} (stored: '{product.barcode}' -> digits: '{digits_only_stored}', search digits: '{digits_only_search}')")
                        return Response(ProductSerializer(product).data)
        except Exception as e:
            logger.error(f"Error in digits-only search: {e}")
        
        # Strategy 7: Try to find if the scanned code appears within any stored barcode
        # This handles cases where stored barcodes are duplicated or contain the scanned code
        try:
            if len(normalized_search) >= 8:
                all_products = Product.objects.select_related("inventory").all()
                for product in all_products:
                    # Normalize stored barcode
                    normalized_stored = normalize_barcode_for_search(product.barcode)
                    if normalized_stored:
                        # Check if scanned code appears in stored barcode
                        if normalized_search in normalized_stored:
                            # Verify it's a meaningful match (not just a substring by chance)
                            # Check if it's at the start, end, or if stored barcode is duplicated
                            stored_len = len(normalized_stored)
                            search_len = len(normalized_search)
                            
                            # If stored is much longer, it might be duplicated
                            if stored_len >= search_len * 2:
                                # Check if stored barcode contains the search code as a repeating pattern
                                if normalized_stored.startswith(normalized_search) or normalized_stored.endswith(normalized_search):
                                    logger.info(f"Found product via substring match in duplicated barcode: {product.name} (stored: '{product.barcode}' -> normalized: '{normalized_stored}', search: '{normalized_search}')")
                                    return Response(ProductSerializer(product).data)
                            # If stored barcode contains the search code and lengths are similar
                            elif abs(stored_len - search_len) <= 2:
                                logger.info(f"Found product via substring match: {product.name} (stored: '{product.barcode}' -> normalized: '{normalized_stored}', search: '{normalized_search}')")
                                return Response(ProductSerializer(product).data)
        except Exception as e:
            logger.error(f"Error in substring search: {e}")
        
        # Log all attempted searches for debugging
        logger.warning(f"Product not found for barcode: '{barcode}' (normalized: '{normalized_search}')")
        logger.info(f"Search strategies attempted: exact match, original code, case-insensitive, contains, startswith, stored normalization, digits-only, substring")
        
        # Return a more helpful error message
        return Response({
            "detail": "NOT_FOUND",
            "barcode": barcode,
            "normalized": normalized_search,
            "message": f"Produto não encontrado com código de barras '{barcode}'. Verifique se o produto está cadastrado no sistema."
        }, status=status.HTTP_404_NOT_FOUND)

    def perform_create(self, serializer):
        # Get initial stock from validated data
        initial_stock = serializer.validated_data.pop("initial_stock", 0)
        initial_stock = max(0, int(initial_stock)) if initial_stock else 0
        
        product = serializer.save()
        # Create inventory record with initial stock
        inventory, created = Inventory.objects.get_or_create(
            product=product, 
            defaults={"qty_on_hand": initial_stock}
        )
        
        # If inventory already exists and initial_stock was provided, update it
        if not created and initial_stock > 0 and inventory.qty_on_hand == 0:
            inventory.qty_on_hand = initial_stock
            inventory.save()


class SaleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Sale.objects.select_related("cashier").prefetch_related("items__product", "payments").all()
    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = super().get_queryset()
        date_from = self.request.query_params.get("date_from", None)
        date_to = self.request.query_params.get("date_to", None)
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        return queryset


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def checkout(request):
    """
    Atomic checkout endpoint - creates sale, deducts stock, prevents negative inventory
    Body:
    {
      "items": [{"barcode":"123", "qty":2, "unit_price":"10.00"}],
      "payments": [{"method":"CASH","amount":"20.00","reference":""}]
    }
    """
    from django.db import models

    body = request.data
    items = body.get("items", [])
    payments = body.get("payments", [])

    if not items or not payments:
        return Response({"detail": "INVALID_PAYLOAD"}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        # Lock inventory rows to prevent race conditions
        # Normalize barcodes from request
        normalized_barcodes = []
        barcode_to_original = {}  # Map normalized to original for error messages
        normalized_to_product = {}  # Map normalized barcode to product
        
        for item in items:
            original_barcode = str(item["barcode"])
            normalized = normalize_barcode_for_search(original_barcode)
            if normalized:
                normalized_barcodes.append(normalized)
                barcode_to_original[normalized] = original_barcode
        
        # Try to find products with normalized barcodes (exact match first)
        products = list(Product.objects.filter(barcode__in=normalized_barcodes).select_related("inventory"))
        for product in products:
            product_map_key = normalize_barcode_for_search(product.barcode) or product.barcode
            normalized_to_product[product_map_key] = product
        
        # If not all found, try to normalize stored barcodes and match
        if len(normalized_to_product) < len(normalized_barcodes):
            missing_normalized = set(normalized_barcodes) - set(normalized_to_product.keys())
            # Try to find by normalizing stored barcodes
            all_products = Product.objects.select_related("inventory").all()
            for product in all_products:
                normalized_stored = normalize_barcode_for_search(product.barcode)
                if normalized_stored and normalized_stored in missing_normalized:
                    normalized_to_product[normalized_stored] = product
                    products.append(product)
                    missing_normalized.remove(normalized_stored)
            
            # If still missing, return error with original barcodes
            if missing_normalized:
                missing_original = [barcode_to_original.get(n, n) for n in missing_normalized]
                return Response(
                    {"detail": f"PRODUCT_NOT_FOUND:{','.join(missing_original)}"}, status=status.HTTP_404_NOT_FOUND
                )
        
        # Create product_map using normalized barcodes
        product_map = {}
        for normalized_barcode in normalized_barcodes:
            if normalized_barcode in normalized_to_product:
                product_map[normalized_barcode] = normalized_to_product[normalized_barcode]

        subtotal = Decimal("0.00")
        tax_total = Decimal("0.00")

        # Lock inventories for update - use product IDs from found products
        product_ids = [p.id for p in products]
        inventories = (
            Inventory.objects.select_for_update()
            .filter(product_id__in=product_ids)
            .select_related("product")
        )
        # Create inv_map using normalized barcodes
        inv_map = {}
        for inv in inventories:
            normalized_inv_barcode = normalize_barcode_for_search(inv.product.barcode) or inv.product.barcode
            inv_map[normalized_inv_barcode] = inv

        # Validate quantities and compute totals
        for it in items:
            original_barcode = str(it["barcode"])
            normalized_barcode = normalize_barcode_for_search(original_barcode)
            qty = int(it["qty"])
            unit_price = Decimal(str(it["unit_price"]))

            if qty <= 0:
                return Response({"detail": "INVALID_QTY"}, status=status.HTTP_400_BAD_REQUEST)

            product = product_map.get(normalized_barcode)
            inv = inv_map.get(normalized_barcode)
            if product is None or inv is None:
                return Response(
                    {"detail": f"PRODUCT_NOT_FOUND:{original_barcode}"}, status=status.HTTP_404_NOT_FOUND
                )

            if inv.qty_on_hand < qty:
                return Response(
                    {"detail": f"OUT_OF_STOCK:{original_barcode}:{inv.qty_on_hand}"}, status=status.HTTP_409_CONFLICT
                )

            line_total = unit_price * qty
            line_tax = (line_total * (product.tax_rate / Decimal("100.00"))).quantize(Decimal("0.01"))

            subtotal += line_total
            tax_total += line_tax

        total = (subtotal + tax_total).quantize(Decimal("0.01"))

        # Validate payments
        paid = sum(Decimal(str(p["amount"])) for p in payments).quantize(Decimal("0.01"))
        if paid < total:
            return Response({"detail": "INSUFFICIENT_PAYMENT"}, status=status.HTTP_400_BAD_REQUEST)

        # Generate sale number (with microseconds to avoid duplicates)
        import time
        sale_number = now().strftime("S%Y%m%d%H%M%S") + f"{int(time.time() * 1000000) % 1000000:06d}"

        # Get operation type from request or user profile
        operation_type = body.get("operation_type", None)
        if not operation_type:
            # Try to get from user profile
            try:
                from .models import UserProfile
                profile = request.user.profile
                operation_type = profile.operation_type
                # If user has BOTH, require explicit operation_type in request
                if operation_type == "BOTH":
                    return Response(
                        {"detail": "OPERATION_TYPE_REQUIRED"}, status=status.HTTP_400_BAD_REQUEST
                    )
            except:
                # Default to SHOP if no profile
                operation_type = Sale.OperationType.SHOP
        
        # Validate operation type
        if operation_type not in [Sale.OperationType.SHOP, Sale.OperationType.SALON, Sale.OperationType.STUDIO]:
            return Response(
                {"detail": "INVALID_OPERATION_TYPE"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Create sale
        sale = Sale.objects.create(
            number=sale_number,
            cashier=request.user,
            operation_type=operation_type,
            subtotal=subtotal.quantize(Decimal("0.01")),
            tax=tax_total.quantize(Decimal("0.01")),
            total=total,
        )

        # Create sale items and update inventory
        for it in items:
            original_barcode = str(it["barcode"])
            normalized_barcode = normalize_barcode_for_search(original_barcode)
            qty = int(it["qty"])
            unit_price = Decimal(str(it["unit_price"]))
            product = product_map[normalized_barcode]
            inv = inv_map[normalized_barcode]

            line_total = (unit_price * qty).quantize(Decimal("0.01"))

            SaleItem.objects.create(
                sale=sale,
                product=product,
                qty=qty,
                unit_price=unit_price.quantize(Decimal("0.01")),
                line_total=line_total,
            )

            # Deduct stock
            inv.qty_on_hand -= qty
            inv.save(update_fields=["qty_on_hand"])

            # Record stock movement
            StockMove.objects.create(
                product=product, qty_change=-qty, reason=StockMove.Reason.SALE, sale=sale
            )

        # Create payments
        for p in payments:
            Payment.objects.create(
                sale=sale,
                method=str(p["method"]),
                amount=Decimal(str(p["amount"])).quantize(Decimal("0.01")),
                reference=str(p.get("reference", "")),
            )

        # Build receipt payload for printing
        receipt = {
            "shopName": "Sunshine Shop",  # TODO: make this configurable
            "shopPhone": "",
            "shopAddress": "",
            "saleNumber": sale.number,
            "date": sale.created_at.isoformat(),
            "subtotal": str(sale.subtotal),
            "tax": str(sale.tax),
            "total": str(sale.total),
            "items": [
                {
                    "name": si.product.name,
                    "qty": si.qty,
                    "unitPrice": str(si.unit_price),
                    "total": str(si.line_total),
                }
                for si in sale.items.select_related("product").all()
            ],
            "footer": "Thank you for your purchase!",
        }

        return Response({"saleId": sale.id, "saleNumber": sale.number, "receipt": receipt}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def adjust_stock(request):
    """
    Adjust stock for a product (admin function)
    Body: {"product_id": 1, "qty_change": 10, "reason": "ADJUSTMENT", "notes": ""}
    """
    product_id = request.data.get("product_id")
    qty_change = int(request.data.get("qty_change", 0))
    reason = request.data.get("reason", StockMove.Reason.ADJUSTMENT)
    notes = request.data.get("notes", "")

    if not product_id or qty_change == 0:
        return Response({"detail": "INVALID_PAYLOAD"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({"detail": "PRODUCT_NOT_FOUND"}, status=status.HTTP_404_NOT_FOUND)

    with transaction.atomic():
        inventory, _ = Inventory.objects.get_or_create(product=product, defaults={"qty_on_hand": 0})
        inventory.qty_on_hand += qty_change
        if inventory.qty_on_hand < 0:
            return Response({"detail": "NEGATIVE_STOCK_NOT_ALLOWED"}, status=status.HTTP_400_BAD_REQUEST)
        inventory.save(update_fields=["qty_on_hand"])

        StockMove.objects.create(
            product=product, qty_change=qty_change, reason=reason, notes=notes
        )

    return Response({"success": True, "new_qty": inventory.qty_on_hand}, status=status.HTTP_200_OK)

