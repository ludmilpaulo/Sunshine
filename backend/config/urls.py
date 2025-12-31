"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from shop.auth_views import me, change_password
from shop.password_reset_views import request_password_reset, confirm_password_reset
from shop.custom_auth_views import CustomTokenObtainPairView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/me/", me, name="auth_me"),
    path("api/auth/change-password/", change_password, name="change_password"),
    path("api/auth/password-reset/request/", request_password_reset, name="password_reset_request"),
    path("api/auth/password-reset/confirm/", confirm_password_reset, name="password_reset_confirm"),
    path("api/", include("shop.urls")),
]

