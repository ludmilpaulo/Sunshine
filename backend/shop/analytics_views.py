from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count, Q, Avg
from django.utils import timezone
from django.contrib.auth import get_user_model
from datetime import timedelta, datetime
from .models import Sale, Payment, UserProfile

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
                start_date = timezone.make_aware(naive_date, timezone.get_current_timezone())
            else:
                start_date = naive_date
        except ValueError:
            pass

    if date_to:
        try:
            naive_date = datetime.strptime(date_to, "%Y-%m-%d")
            if timezone.is_naive(naive_date):
                end_date = timezone.make_aware(naive_date, timezone.get_current_timezone())
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
                start_date = timezone.make_aware(naive_date, timezone.get_current_timezone())
            else:
                start_date = naive_date
        except ValueError:
            pass

    if date_to:
        try:
            naive_date = datetime.strptime(date_to, "%Y-%m-%d")
            if timezone.is_naive(naive_date):
                end_date = timezone.make_aware(naive_date, timezone.get_current_timezone())
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

