from django.contrib import admin
from .models import Product, Inventory, Sale, SaleItem, Payment, StockMove


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["name", "barcode", "sku", "price", "tax_rate", "active", "created_at"]
    search_fields = ["name", "barcode", "sku"]
    list_filter = ["active", "created_at"]


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ["product", "qty_on_hand", "updated_at"]
    search_fields = ["product__name", "product__barcode"]


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ["number", "cashier", "total", "status", "created_at"]
    search_fields = ["number", "cashier__username"]
    list_filter = ["status", "created_at"]
    readonly_fields = ["number", "created_at"]


@admin.register(SaleItem)
class SaleItemAdmin(admin.ModelAdmin):
    list_display = ["sale", "product", "qty", "unit_price", "line_total"]
    search_fields = ["sale__number", "product__name"]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ["sale", "method", "amount", "created_at"]
    list_filter = ["method", "created_at"]


@admin.register(StockMove)
class StockMoveAdmin(admin.ModelAdmin):
    list_display = ["product", "qty_change", "reason", "sale", "created_at"]
    list_filter = ["reason", "created_at"]
    search_fields = ["product__name", "product__barcode"]

