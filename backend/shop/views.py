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
        """Normalize barcode by extracting valid pattern from potentially duplicated code"""
        if not barcode_str:
            return None
        
        barcode = str(barcode_str).strip()
        
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
        normalized_search = self.normalize_barcode_for_search(barcode)
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
        # This is the most expensive but handles edge cases
        try:
            all_products = Product.objects.select_related("inventory").all()
            for product in all_products:
                normalized_stored = self.normalize_barcode_for_search(product.barcode)
                if normalized_stored == normalized_search:
                    logger.info(f"Found product via stored barcode normalization: {product.name} (stored: {product.barcode} -> normalized: {normalized_stored})")
                    return Response(ProductSerializer(product).data)
        except Exception as e:
            logger.error(f"Error in stored barcode normalization search: {e}")
        
        logger.warning(f"Product not found for barcode: '{barcode}' (normalized: '{normalized_search}')")
        return Response({"detail": "NOT_FOUND"}, status=status.HTTP_404_NOT_FOUND)

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
        barcodes = [str(i["barcode"]) for i in items]
        products = list(Product.objects.filter(barcode__in=barcodes).select_related("inventory"))
        product_map = {p.barcode: p for p in products}

        if len(products) != len(barcodes):
            missing = set(barcodes) - set(product_map.keys())
            return Response(
                {"detail": f"PRODUCT_NOT_FOUND:{','.join(missing)}"}, status=status.HTTP_404_NOT_FOUND
            )

        subtotal = Decimal("0.00")
        tax_total = Decimal("0.00")

        # Lock inventories for update
        inventories = (
            Inventory.objects.select_for_update()
            .filter(product__barcode__in=barcodes)
            .select_related("product")
        )
        inv_map = {inv.product.barcode: inv for inv in inventories}

        # Validate quantities and compute totals
        for it in items:
            barcode = str(it["barcode"])
            qty = int(it["qty"])
            unit_price = Decimal(str(it["unit_price"]))

            if qty <= 0:
                return Response({"detail": "INVALID_QTY"}, status=status.HTTP_400_BAD_REQUEST)

            product = product_map.get(barcode)
            inv = inv_map.get(barcode)
            if product is None or inv is None:
                return Response(
                    {"detail": f"PRODUCT_NOT_FOUND:{barcode}"}, status=status.HTTP_404_NOT_FOUND
                )

            if inv.qty_on_hand < qty:
                return Response(
                    {"detail": f"OUT_OF_STOCK:{barcode}:{inv.qty_on_hand}"}, status=status.HTTP_409_CONFLICT
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
            barcode = str(it["barcode"])
            qty = int(it["qty"])
            unit_price = Decimal(str(it["unit_price"]))
            product = product_map[barcode]
            inv = inv_map[barcode]

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

