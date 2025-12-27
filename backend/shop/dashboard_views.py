from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
from .models import Product, Sale, Inventory, StockMove


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Get dashboard statistics"""
    today = timezone.now().date()
    this_month_start = today.replace(day=1)
    last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)
    last_month_end = this_month_start - timedelta(days=1)

    # Sales stats
    today_sales = Sale.objects.filter(created_at__date=today, status=Sale.Status.PAID)
    month_sales = Sale.objects.filter(created_at__date__gte=this_month_start, status=Sale.Status.PAID)
    last_month_sales = Sale.objects.filter(
        created_at__date__gte=last_month_start,
        created_at__date__lte=last_month_end,
        status=Sale.Status.PAID
    )

    today_revenue = today_sales.aggregate(total=Sum("total"))["total"] or 0
    month_revenue = month_sales.aggregate(total=Sum("total"))["total"] or 0
    last_month_revenue = last_month_sales.aggregate(total=Sum("total"))["total"] or 0

    today_count = today_sales.count()
    month_count = month_sales.count()

    # Product stats
    total_products = Product.objects.count()
    active_products = Product.objects.filter(active=True).count()
    low_stock = Inventory.objects.filter(qty_on_hand__lte=10).count()

    # Recent sales
    recent_sales = Sale.objects.filter(status=Sale.Status.PAID).order_by("-created_at")[:10]

    return Response({
        "sales": {
            "today_revenue": float(today_revenue),
            "today_count": today_count,
            "month_revenue": float(month_revenue),
            "month_count": month_count,
            "last_month_revenue": float(last_month_revenue),
            "revenue_growth": float(month_revenue - last_month_revenue) if last_month_revenue > 0 else 0,
        },
        "products": {
            "total": total_products,
            "active": active_products,
            "low_stock": low_stock,
        },
        "recent_sales": [
            {
                "id": sale.id,
                "number": sale.number,
                "total": float(sale.total),
                "cashier": sale.cashier.get_full_name() or sale.cashier.username,
                "created_at": sale.created_at.isoformat(),
            }
            for sale in recent_sales
        ],
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def sales_chart_data(request):
    """Get sales data for charts (last 30 days)"""
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=30)

    sales = Sale.objects.filter(
        created_at__date__gte=start_date,
        created_at__date__lte=end_date,
        status=Sale.Status.PAID
    ).values("created_at__date").annotate(
        revenue=Sum("total"),
        count=Count("id")
    ).order_by("created_at__date")

    return Response({
        "labels": [item["created_at__date"].strftime("%Y-%m-%d") for item in sales],
        "revenue": [float(item["revenue"]) for item in sales],
        "count": [item["count"] for item in sales],
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def top_products(request):
    """Get top selling products"""
    from .models import SaleItem

    top_items = (
        SaleItem.objects.filter(sale__status=Sale.Status.PAID)
        .values("product__name", "product__id")
        .annotate(total_sold=Sum("qty"), revenue=Sum("line_total"))
        .order_by("-total_sold")[:10]
    )

    return Response([
        {
            "product_id": item["product__id"],
            "product_name": item["product__name"],
            "total_sold": item["total_sold"],
            "revenue": float(item["revenue"]),
        }
        for item in top_items
    ])

