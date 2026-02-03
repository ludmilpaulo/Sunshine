from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count, Q, Avg
from django.utils import timezone
from django.contrib.auth import get_user_model
from datetime import timedelta, datetime
from .models import Sale, SaleItem, StockMove, Inventory, Product, UserProfile

User = get_user_model()


def apply_operation_type_filter(sales_query, request, operation_type_param=None):
    """Apply operation type filter to sales query based on user profile or explicit parameter"""
    operation_type = operation_type_param or request.query_params.get("operation_type")
    
    if operation_type:
        # Explicit filter from query param
        sales_query = sales_query.filter(operation_type=operation_type)
    else:
        # Auto-filter based on user profile (unless admin with BOTH access)
        try:
            profile = request.user.profile
            if profile.operation_type != "BOTH":
                sales_query = sales_query.filter(operation_type=profile.operation_type)
        except UserProfile.DoesNotExist:
            # Default to SHOP if no profile
            pass
    
    return sales_query


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def sales_by_user(request):
    """
    Get sales analytics by user with filters
    Query params:
    - period: 'day', 'week', 'month' (default: 'month')
    - date_from: YYYY-MM-DD (optional)
    - date_to: YYYY-MM-DD (optional)
    - user_id: filter by specific user (optional)
    """
    period = request.query_params.get("period", "month")
    date_from = request.query_params.get("date_from")
    date_to = request.query_params.get("date_to")
    user_id = request.query_params.get("user_id")

    # Calculate date range based on period
    now = timezone.now()
    if period == "day":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    elif period == "week":
        # Start of week (Monday)
        days_since_monday = now.weekday()
        start_date = (now - timedelta(days=days_since_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    elif period == "month":
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    else:
        start_date = None
        end_date = None

    # Override with explicit dates if provided
    if date_from:
        try:
            naive_date = datetime.strptime(date_from, "%Y-%m-%d")
            if timezone.is_naive(naive_date):
                # Use the current timezone from Django settings
                start_date = timezone.make_aware(naive_date, timezone.now().tzinfo)
            else:
                start_date = naive_date
        except ValueError:
            pass

    if date_to:
        try:
            naive_date = datetime.strptime(date_to, "%Y-%m-%d")
            if timezone.is_naive(naive_date):
                # Use the current timezone from Django settings
                end_date = timezone.make_aware(naive_date, timezone.now().tzinfo)
            else:
                end_date = naive_date
            # Set to end of day
            end_date = end_date.replace(hour=23, minute=59, second=59)
        except ValueError:
            pass

    # Build query
    sales_query = Sale.objects.filter(status=Sale.Status.PAID)
    
    if start_date:
        sales_query = sales_query.filter(created_at__gte=start_date)
    if end_date:
        sales_query = sales_query.filter(created_at__lte=end_date)
    if user_id:
        sales_query = sales_query.filter(cashier_id=user_id)

    # Group by user
    user_sales = (
        sales_query.values("cashier_id", "cashier__username", "cashier__first_name", "cashier__last_name")
        .annotate(
            total_revenue=Sum("total"),
            total_sales=Count("id"),
            avg_sale=Avg("total"),
        )
        .order_by("-total_revenue")
    )

    # Format response
    result = []
    for item in user_sales:
        full_name = f"{item['cashier__first_name']} {item['cashier__last_name']}".strip()
        if not full_name:
            full_name = item["cashier__username"]
        
        result.append({
            "user_id": item["cashier_id"],
            "username": item["cashier__username"],
            "full_name": full_name,
            "total_revenue": float(item["total_revenue"]),
            "total_sales": item["total_sales"],
            "avg_sale": float(item["avg_sale"]),
        })

    return Response({
        "period": period,
        "date_from": start_date.isoformat() if start_date else None,
        "date_to": end_date.isoformat() if end_date else None,
        "users": result,
        "summary": {
            "total_revenue": sum(u["total_revenue"] for u in result),
            "total_sales": sum(u["total_sales"] for u in result),
            "user_count": len(result),
        },
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def sales_trend_by_user(request):
    """
    Get sales trend over time by user
    Query params:
    - period: 'day', 'week', 'month' (default: 'month')
    - days: number of days to look back (default: 30)
    - user_id: filter by specific user (optional)
    """
    period = request.query_params.get("period", "month")
    days = int(request.query_params.get("days", 30))
    user_id = request.query_params.get("user_id")

    end_date = timezone.now()
    start_date = end_date - timedelta(days=days)

    # Build query
    sales_query = Sale.objects.filter(
        status=Sale.Status.PAID,
        created_at__gte=start_date,
        created_at__lte=end_date,
    )
    
    # Apply operation type filter
    sales_query = apply_operation_type_filter(sales_query, request)
    
    if user_id:
        sales_query = sales_query.filter(cashier_id=user_id)

    # Group by date and user
    if period == "day":
        date_format = "%Y-%m-%d"
        sales_data = (
            sales_query.extra(select={"date": "DATE(created_at)"})
            .values("date", "cashier_id", "cashier__username")
            .annotate(revenue=Sum("total"), count=Count("id"))
            .order_by("date", "cashier_id")
        )
    elif period == "week":
        # Group by week
        sales_data = (
            sales_query.extra(
                select={
                    "year": "EXTRACT(YEAR FROM created_at)",
                    "week": "EXTRACT(WEEK FROM created_at)",
                }
            )
            .values("year", "week", "cashier_id", "cashier__username")
            .annotate(revenue=Sum("total"), count=Count("id"))
            .order_by("year", "week", "cashier_id")
        )
    else:  # month
        sales_data = (
            sales_query.extra(
                select={
                    "year": "EXTRACT(YEAR FROM created_at)",
                    "month": "EXTRACT(MONTH FROM created_at)",
                }
            )
            .values("year", "month", "cashier_id", "cashier__username")
            .annotate(revenue=Sum("total"), count=Count("id"))
            .order_by("year", "month", "cashier_id")
        )

    # Format response
    result = {}
    for item in sales_data:
        if period == "day":
            key = item["date"].strftime(date_format) if hasattr(item["date"], "strftime") else str(item["date"])
        elif period == "week":
            key = f"{int(item['year'])}-W{int(item['week']):02d}"
        else:
            key = f"{int(item['year'])}-{int(item['month']):02d}"
        
        user_key = item["cashier__username"]
        
        if key not in result:
            result[key] = {}
        
        result[key][user_key] = {
            "revenue": float(item["revenue"]),
            "count": item["count"],
        }

    return Response({
        "period": period,
        "data": result,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def top_sellers(request):
    """
    Get top sellers ranking
    Query params:
    - period: 'day', 'week', 'month' (default: 'month')
    - limit: number of top sellers to return (default: 10)
    """
    period = request.query_params.get("period", "month")
    limit = int(request.query_params.get("limit", 10))

    # Calculate date range
    now = timezone.now()
    if period == "day":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        days_since_monday = now.weekday()
        start_date = (now - timedelta(days=days_since_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
    else:  # month
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Build query
    sales_query = Sale.objects.filter(
        status=Sale.Status.PAID,
        created_at__gte=start_date,
    )
    
    # Apply operation type filter
    sales_query = apply_operation_type_filter(sales_query, request)
    
    # Get top sellers
    top_sellers = (
        sales_query
        .values("cashier_id", "cashier__username", "cashier__first_name", "cashier__last_name")
        .annotate(
            total_revenue=Sum("total"),
            total_sales=Count("id"),
        )
        .order_by("-total_revenue")[:limit]
    )

    result = []
    for idx, seller in enumerate(top_sellers, 1):
        full_name = f"{seller['cashier__first_name']} {seller['cashier__last_name']}".strip()
        if not full_name:
            full_name = seller["cashier__username"]
        
        result.append({
            "rank": idx,
            "user_id": seller["cashier_id"],
            "username": seller["cashier__username"],
            "full_name": full_name,
            "total_revenue": float(seller["total_revenue"]),
            "total_sales": seller["total_sales"],
        })

    return Response({
        "period": period,
        "top_sellers": result,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def sales_by_payment_method(request):
    """
    Get sales analytics by payment method (Cash, Card, EFT)
    Query params:
    - period: 'day', 'week', 'month' (default: 'month')
    - date_from: YYYY-MM-DD (optional)
    - date_to: YYYY-MM-DD (optional)
    """
    period = request.query_params.get("period", "month")
    date_from = request.query_params.get("date_from")
    date_to = request.query_params.get("date_to")

    # Calculate date range based on period
    now = timezone.now()
    if period == "day":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    elif period == "week":
        days_since_monday = now.weekday()
        start_date = (now - timedelta(days=days_since_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    elif period == "month":
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    else:
        start_date = None
        end_date = None

    # Override with explicit dates if provided
    if date_from:
        try:
            naive_date = datetime.strptime(date_from, "%Y-%m-%d")
            if timezone.is_naive(naive_date):
                # Use the current timezone from Django settings
                start_date = timezone.make_aware(naive_date, timezone.now().tzinfo)
            else:
                start_date = naive_date
        except ValueError:
            pass

    if date_to:
        try:
            naive_date = datetime.strptime(date_to, "%Y-%m-%d")
            if timezone.is_naive(naive_date):
                # Use the current timezone from Django settings
                end_date = timezone.make_aware(naive_date, timezone.now().tzinfo)
            else:
                end_date = naive_date
            end_date = end_date.replace(hour=23, minute=59, second=59)
        except ValueError:
            pass

    # Build query for sales
    sales_query = Sale.objects.filter(status=Sale.Status.PAID)
    
    # Apply operation type filter
    sales_query = apply_operation_type_filter(sales_query, request)
    
    # Staff users (non-admin, non-manager) can only see their own sales
    if not request.user.is_superuser and not request.user.is_staff:
        sales_query = sales_query.filter(cashier_id=request.user.id)
    
    if start_date:
        sales_query = sales_query.filter(created_at__gte=start_date)
    if end_date:
        sales_query = sales_query.filter(created_at__lte=end_date)

    # Get sales IDs
    sale_ids = list(sales_query.values_list("id", flat=True))

    # Group payments by method
    payment_methods = (
        Payment.objects.filter(sale_id__in=sale_ids)
        .values("method")
        .annotate(
            total_amount=Sum("amount"),
            count=Count("id"),
        )
        .order_by("-total_amount")
    )

    # Calculate totals including tax
    total_revenue = sales_query.aggregate(total=Sum("total"))["total"] or 0
    total_subtotal = sales_query.aggregate(total=Sum("subtotal"))["total"] or 0
    total_tax = sales_query.aggregate(total=Sum("tax"))["total"] or 0

    # Format response
    methods_data = []
    for method in payment_methods:
        methods_data.append({
            "method": method["method"],
            "method_display": dict(Payment.Method.choices).get(method["method"], method["method"]),
            "total_amount": float(method["total_amount"]),
            "count": method["count"],
            "percentage": float((method["total_amount"] / total_revenue * 100)) if total_revenue > 0 else 0,
        })

    return Response({
        "period": period,
        "date_from": start_date.isoformat() if start_date else None,
        "date_to": end_date.isoformat() if end_date else None,
        "payment_methods": methods_data,
        "summary": {
            "total_revenue": float(total_revenue),
            "total_subtotal": float(total_subtotal),
            "total_tax": float(total_tax),
            "tax_percentage": float((total_tax / total_subtotal * 100)) if total_subtotal > 0 else 0,
        },
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def sales_by_user_with_tax(request):
    """
    Get sales analytics by user with tax breakdown
    Query params:
    - period: 'day', 'week', 'month' (default: 'month')
    - date_from: YYYY-MM-DD (optional)
    - date_to: YYYY-MM-DD (optional)
    - user_id: filter by specific user (optional)
    """
    period = request.query_params.get("period", "month")
    date_from = request.query_params.get("date_from")
    date_to = request.query_params.get("date_to")
    user_id = request.query_params.get("user_id")

    # Calculate date range based on period
    now = timezone.now()
    if period == "day":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    elif period == "week":
        days_since_monday = now.weekday()
        start_date = (now - timedelta(days=days_since_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    elif period == "month":
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    else:
        start_date = None
        end_date = None

    # Override with explicit dates if provided
    if date_from:
        try:
            naive_date = datetime.strptime(date_from, "%Y-%m-%d")
            if timezone.is_naive(naive_date):
                # Use the current timezone from Django settings
                start_date = timezone.make_aware(naive_date, timezone.now().tzinfo)
            else:
                start_date = naive_date
        except ValueError:
            pass

    if date_to:
        try:
            naive_date = datetime.strptime(date_to, "%Y-%m-%d")
            if timezone.is_naive(naive_date):
                # Use the current timezone from Django settings
                end_date = timezone.make_aware(naive_date, timezone.now().tzinfo)
            else:
                end_date = naive_date
            end_date = end_date.replace(hour=23, minute=59, second=59)
        except ValueError:
            pass

    # Build query
    sales_query = Sale.objects.filter(status=Sale.Status.PAID)
    
    # Apply operation type filter
    sales_query = apply_operation_type_filter(sales_query, request)
    
    # Staff users (non-admin, non-manager) can only see their own sales
    if not request.user.is_superuser and not request.user.is_staff:
        user_id = str(request.user.id)  # Force filter to current user
    
    if start_date:
        sales_query = sales_query.filter(created_at__gte=start_date)
    if end_date:
        sales_query = sales_query.filter(created_at__lte=end_date)
    if user_id:
        sales_query = sales_query.filter(cashier_id=user_id)

    # Group by user with tax breakdown
    user_sales = (
        sales_query.values("cashier_id", "cashier__username", "cashier__first_name", "cashier__last_name")
        .annotate(
            total_revenue=Sum("total"),
            total_subtotal=Sum("subtotal"),
            total_tax=Sum("tax"),
            total_sales=Count("id"),
            avg_sale=Avg("total"),
        )
        .order_by("-total_revenue")
    )

    # Calculate overall totals
    overall_totals = sales_query.aggregate(
        total_revenue=Sum("total"),
        total_subtotal=Sum("subtotal"),
        total_tax=Sum("tax"),
        total_sales=Count("id"),
    )

    # Format response
    result = []
    for item in user_sales:
        full_name = f"{item['cashier__first_name']} {item['cashier__last_name']}".strip()
        if not full_name:
            full_name = item["cashier__username"]
        
        result.append({
            "user_id": item["cashier_id"],
            "username": item["cashier__username"],
            "full_name": full_name,
            "total_revenue": float(item["total_revenue"]),
            "total_subtotal": float(item["total_subtotal"]),
            "total_tax": float(item["total_tax"]),
            "total_sales": item["total_sales"],
            "avg_sale": float(item["avg_sale"]),
            "tax_percentage": float((item["total_tax"] / item["total_subtotal"] * 100)) if item["total_subtotal"] > 0 else 0,
        })

    return Response({
        "period": period,
        "date_from": start_date.isoformat() if start_date else None,
        "date_to": end_date.isoformat() if end_date else None,
        "users": result,
        "summary": {
            "total_revenue": float(overall_totals["total_revenue"] or 0),
            "total_subtotal": float(overall_totals["total_subtotal"] or 0),
            "total_tax": float(overall_totals["total_tax"] or 0),
            "total_sales": overall_totals["total_sales"] or 0,
            "user_count": len(result),
            "tax_percentage": float((overall_totals["total_tax"] / overall_totals["total_subtotal"] * 100)) if overall_totals["total_subtotal"] and overall_totals["total_subtotal"] > 0 else 0,
        },
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def product_sales_stock_report(request):
    """
    Product sales and stock-out report for admin and manager.
    Returns quantity sold, stock that went out per product, with date filters.
    Query params:
    - period: 'day', 'week', 'month' (default: 'month')
    - date_from: YYYY-MM-DD (optional, for custom range)
    - date_to: YYYY-MM-DD (optional, for custom range)
    - operation_type: SHOP, SALON, STUDIO (optional)
    """
    # Restrict to admin and manager only
    if not (request.user.is_superuser or request.user.is_staff):
        return Response(
            {"detail": "Permission denied. Admin or Manager required."},
            status=403
        )

    period = request.query_params.get("period", "month")
    date_from = request.query_params.get("date_from")
    date_to = request.query_params.get("date_to")

    # Calculate date range
    now = timezone.now()
    if period == "day":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    elif period == "week":
        days_since_monday = now.weekday()
        start_date = (now - timedelta(days=days_since_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    elif period == "month":
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    else:
        start_date = None
        end_date = None

    if date_from:
        try:
            naive_date = datetime.strptime(date_from, "%Y-%m-%d")
            start_date = timezone.make_aware(naive_date, timezone.now().tzinfo) if timezone.is_naive(naive_date) else naive_date
        except ValueError:
            pass

    if date_to:
        try:
            naive_date = datetime.strptime(date_to, "%Y-%m-%d")
            end_date = timezone.make_aware(naive_date, timezone.now().tzinfo) if timezone.is_naive(naive_date) else naive_date
            end_date = end_date.replace(hour=23, minute=59, second=59)
        except ValueError:
            pass

    # Get sales in date range
    sales_query = Sale.objects.filter(
        status=Sale.Status.PAID,
        created_at__gte=start_date,
        created_at__lte=end_date,
    )
    sales_query = apply_operation_type_filter(sales_query, request)
    sale_ids = list(sales_query.values_list("id", flat=True))

    # Aggregate by product from SaleItem
    product_stats = (
        SaleItem.objects.filter(sale_id__in=sale_ids)
        .values("product_id", "product__name", "product__barcode")
        .annotate(
            quantity_sold=Sum("qty"),
            revenue=Sum("line_total"),
        )
        .order_by("-quantity_sold")
    )

    # Stock out from StockMove (SALE reason only - stock that left via sales)
    stock_out_rows = (
        StockMove.objects.filter(
            reason=StockMove.Reason.SALE,
            sale_id__in=sale_ids,
            qty_change__lt=0,
        )
        .values("product_id")
        .annotate(stock_out=Sum("qty_change"))
    )
    stock_out_by_product = {r["product_id"]: r["stock_out"] for r in stock_out_rows}

    products = []
    for item in product_stats:
        product_id = item["product_id"]
        stock_out = stock_out_by_product.get(product_id, 0)
        # stock_out is negative, so we use abs for display
        products.append({
            "product_id": product_id,
            "product_name": item["product__name"],
            "barcode": item["product__barcode"] or "",
            "quantity_sold": item["quantity_sold"],
            "stock_out": abs(int(stock_out)) if stock_out else item["quantity_sold"],
            "revenue": float(item["revenue"]),
        })

    # Summary
    total_qty = sum(p["quantity_sold"] for p in products)
    total_revenue = sum(p["revenue"] for p in products)

    return Response({
        "period": period,
        "date_from": start_date.strftime("%Y-%m-%d") if start_date else None,
        "date_to": end_date.strftime("%Y-%m-%d") if end_date else None,
        "products": products,
        "summary": {
            "total_quantity_sold": total_qty,
            "total_revenue": float(total_revenue),
            "product_count": len(products),
        },
    })


def _parse_date_range(request):
    """Parse period and date_from/date_to into start_date, end_date."""
    period = request.query_params.get("period", "month")
    date_from = request.query_params.get("date_from")
    date_to = request.query_params.get("date_to")

    now = timezone.now()
    if period == "day":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    elif period == "week":
        days_since_monday = now.weekday()
        start_date = (now - timedelta(days=days_since_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    elif period == "month":
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    else:
        start_date = None
        end_date = None

    if date_from:
        try:
            naive_date = datetime.strptime(date_from, "%Y-%m-%d")
            start_date = timezone.make_aware(naive_date, timezone.now().tzinfo) if timezone.is_naive(naive_date) else naive_date
        except ValueError:
            pass

    if date_to:
        try:
            naive_date = datetime.strptime(date_to, "%Y-%m-%d")
            end_date = timezone.make_aware(naive_date, timezone.now().tzinfo) if timezone.is_naive(naive_date) else naive_date
            end_date = end_date.replace(hour=23, minute=59, second=59)
        except ValueError:
            pass

    return period, start_date, end_date


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stock_movement_report(request):
    """
    Stock movement and inventory report for admin and manager.
    Shows: when stock was added, when it went out (sales), stock left per product.
    Query params:
    - period: 'day', 'week', 'month' (default: 'month')
    - date_from: YYYY-MM-DD (optional)
    - date_to: YYYY-MM-DD (optional)
    - operation_type: SHOP, SALON, STUDIO (optional, for sale moves only)
    """
    if not (request.user.is_superuser or request.user.is_staff):
        return Response(
            {"detail": "Permission denied. Admin or Manager required."},
            status=403
        )

    period, start_date, end_date = _parse_date_range(request)

    # Get sale IDs in range for operation_type filter (for SALE moves)
    sales_query = Sale.objects.filter(
        status=Sale.Status.PAID,
        created_at__gte=start_date,
        created_at__lte=end_date,
    )
    sales_query = apply_operation_type_filter(sales_query, request)
    sale_ids = set(sales_query.values_list("id", flat=True))

    # All StockMoves in date range
    moves_qs = StockMove.objects.filter(
        created_at__gte=start_date,
        created_at__lte=end_date,
    ).select_related("product", "sale").order_by("-created_at")

    # Filter: for SALE moves, only include if sale in sale_ids
    moves = []
    for m in moves_qs:
        if m.reason == StockMove.Reason.SALE and m.sale_id:
            if m.sale_id in sale_ids:
                moves.append(m)
        else:
            moves.append(m)

    # Build product aggregates and movement log
    product_added = {}
    product_sold = {}
    movement_log = []

    for m in moves:
        pid = m.product_id
        product_added[pid] = product_added.get(pid, 0) + (m.qty_change if m.qty_change > 0 else 0)
        product_sold[pid] = product_sold.get(pid, 0) + (abs(m.qty_change) if m.qty_change < 0 else 0)

        reason_display = {"SALE": "Venda", "RESTOCK": "Reposição", "ADJUSTMENT": "Ajuste"}.get(m.reason, m.reason)
        movement_log.append({
            "id": m.id,
            "created_at": m.created_at.isoformat(),
            "product_id": pid,
            "product_name": m.product.name,
            "barcode": m.product.barcode or "",
            "reason": m.reason,
            "reason_display": reason_display,
            "qty_change": m.qty_change,
            "sale_number": m.sale.number if m.sale else None,
        })

    # Current stock from Inventory
    product_ids = set(product_added.keys()) | set(product_sold.keys())
    inventory_map = {
        inv["product_id"]: inv["qty_on_hand"]
        for inv in Inventory.objects.filter(product_id__in=product_ids).values("product_id", "qty_on_hand")
    }

    # Per-product summary
    all_pids = set(product_added.keys()) | set(product_sold.keys())
    products = []
    for pid in all_pids:
        try:
            p = Product.objects.get(id=pid)
        except Product.DoesNotExist:
            continue
        added = product_added.get(pid, 0)
        sold = product_sold.get(pid, 0)
        net = added - sold
        current = inventory_map.get(pid, 0)
        products.append({
            "product_id": pid,
            "product_name": p.name,
            "barcode": p.barcode or "",
            "qty_added": added,
            "qty_sold": sold,
            "net_change": net,
            "current_stock": current,
        })

    products.sort(key=lambda x: -x["qty_sold"])

    total_added = sum(product_added.values())
    total_sold = sum(product_sold.values())

    return Response({
        "period": period,
        "date_from": start_date.strftime("%Y-%m-%d") if start_date else None,
        "date_to": end_date.strftime("%Y-%m-%d") if end_date else None,
        "movements": movement_log,
        "products": products,
        "summary": {
            "total_added": total_added,
            "total_sold": total_sold,
            "net_change": total_added - total_sold,
            "product_count": len(products),
            "movement_count": len(movement_log),
        },
    })

