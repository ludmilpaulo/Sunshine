from django.conf import settings
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class UserProfile(models.Model):
    """Extended user profile for operation type (Shop/Salon/Studio)"""
    class OperationType(models.TextChoices):
        SHOP = "SHOP", "Shop"
        SALON = "SALON", "Salon"
        STUDIO = "STUDIO", "Studio"
        BOTH = "BOTH", "All"  # For admin users who can access all operations
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    operation_type = models.CharField(
        max_length=10,
        choices=OperationType.choices,
        default=OperationType.SHOP
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"
    
    def __str__(self):
        return f"{self.user.username} - {self.get_operation_type_display()}"


class Product(models.Model):
    name = models.CharField(max_length=255)
    barcode = models.CharField(max_length=64, unique=True, db_index=True)
    sku = models.CharField(max_length=64, blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # e.g. 15.00
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.barcode})"


class Inventory(models.Model):
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name="inventory")
    qty_on_hand = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Inventories"

    def __str__(self):
        return f"{self.product.name}: {self.qty_on_hand}"


class Sale(models.Model):
    class Status(models.TextChoices):
        PAID = "PAID", "Paid"
        VOID = "VOID", "Void"
        REFUNDED = "REFUNDED", "Refunded"
    
    class OperationType(models.TextChoices):
        SHOP = "SHOP", "Shop"
        SALON = "SALON", "Salon"
        STUDIO = "STUDIO", "Studio"

    number = models.CharField(max_length=32, unique=True)
    cashier = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    operation_type = models.CharField(
        max_length=10,
        choices=OperationType.choices,
        default=OperationType.SHOP
    )
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PAID)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    tax = models.DecimalField(max_digits=12, decimal_places=2)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.number} - {self.total}"


class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    qty = models.IntegerField()
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    line_total = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.sale.number} - {self.product.name} x{self.qty}"


class Payment(models.Model):
    class Method(models.TextChoices):
        CASH = "CASH", "Cash"
        CARD = "CARD", "Card"
        TRANSFER = "TRANSFER", "Transfer"

    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name="payments")
    method = models.CharField(max_length=16, choices=Method.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reference = models.CharField(max_length=128, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sale.number} - {self.method}: {self.amount}"


class StockMove(models.Model):
    class Reason(models.TextChoices):
        SALE = "SALE", "Sale"
        ADJUSTMENT = "ADJUSTMENT", "Adjustment"
        RESTOCK = "RESTOCK", "Restock"

    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    qty_change = models.IntegerField()  # negative for sale
    reason = models.CharField(max_length=16, choices=Reason.choices)
    sale = models.ForeignKey(Sale, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.product.name}: {self.qty_change:+d} ({self.reason})"

