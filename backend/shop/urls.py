from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, SaleViewSet, checkout, adjust_stock
from .user_views import UserViewSet, user_stats
from .dashboard_views import dashboard_stats, sales_chart_data, top_products
from .analytics_views import sales_by_user, sales_trend_by_user, top_sellers, sales_by_payment_method, sales_by_user_with_tax

router = DefaultRouter()
router.register(r"products", ProductViewSet, basename="product")
router.register(r"sales", SaleViewSet, basename="sale")
router.register(r"users", UserViewSet, basename="user")

urlpatterns = [
    # Put specific endpoints BEFORE router to avoid conflicts
    path("sales/checkout/", checkout, name="checkout"),
    path("stock/adjust/", adjust_stock, name="adjust-stock"),
    path("users/stats/", user_stats, name="user-stats"),
    path("dashboard/stats/", dashboard_stats, name="dashboard-stats"),
    path("dashboard/sales-chart/", sales_chart_data, name="sales-chart"),
    path("dashboard/top-products/", top_products, name="top-products"),
    # Analytics endpoints
    path("analytics/sales-by-user/", sales_by_user, name="sales-by-user"),
    path("analytics/sales-by-user-with-tax/", sales_by_user_with_tax, name="sales-by-user-with-tax"),
    path("analytics/sales-trend-by-user/", sales_trend_by_user, name="sales-trend-by-user"),
    path("analytics/top-sellers/", top_sellers, name="top-sellers"),
    path("analytics/sales-by-payment-method/", sales_by_payment_method, name="sales-by-payment-method"),
    # Router URLs come last
    path("", include(router.urls)),
]

