from rest_framework import serializers
from .models import Product, Inventory, Sale, SaleItem, Payment, StockMove


class InventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inventory
        fields = ["qty_on_hand", "updated_at"]


class ProductSerializer(serializers.ModelSerializer):
    inventory = InventorySerializer(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "barcode",
            "sku",
            "price",
            "cost",
            "tax_rate",
            "active",
            "inventory",
            "created_at",
            "updated_at",
        ]


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    initial_stock = serializers.IntegerField(write_only=True, required=False, default=0, min_value=0)
    
    class Meta:
        model = Product
        fields = ["name", "barcode", "sku", "price", "cost", "tax_rate", "active", "initial_stock"]
    
    def validate_barcode(self, value):
        """Validate and normalize barcode"""
        if not value:
            raise serializers.ValidationError("Código de barras é obrigatório")
        
        # Clean barcode
        value = str(value).strip()
        
        if not value:
            raise serializers.ValidationError("Código de barras não pode estar vazio")
        
        # If barcode is too long, try to extract valid barcode
        if len(value) > 20:
            # Try to find repeating pattern
            for length in [8, 12, 13, 14]:
                pattern = value[:length]
                if len(pattern) == length and pattern.isdigit():
                    repetitions = len(value) // length
                    if pattern * repetitions == value[:length * repetitions]:
                        return pattern
                # Check end pattern
                end_pattern = value[-length:]
                if len(end_pattern) == length and end_pattern.isdigit() and value.startswith(end_pattern):
                    return end_pattern
        
        # Limit barcode length
        if len(value) > 64:
            raise serializers.ValidationError("Código de barras muito longo (máximo 64 caracteres)")
        
        return value
    
    def validate_price(self, value):
        """Validate price"""
        if value is None or value <= 0:
            raise serializers.ValidationError("Preço deve ser maior que zero")
        return value


class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_barcode = serializers.CharField(source="product.barcode", read_only=True)

    class Meta:
        model = SaleItem
        fields = ["id", "product", "product_name", "product_barcode", "qty", "unit_price", "line_total"]


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["id", "method", "amount", "reference", "created_at"]


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    cashier_name = serializers.CharField(source="cashier.get_full_name", read_only=True)
    cashier_username = serializers.CharField(source="cashier.username", read_only=True)

    class Meta:
        model = Sale
        fields = [
            "id",
            "number",
            "cashier",
            "cashier_name",
            "cashier_username",
            "operation_type",
            "status",
            "subtotal",
            "tax",
            "total",
            "items",
            "payments",
            "created_at",
        ]


class StockMoveSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = StockMove
        fields = [
            "id",
            "product",
            "product_name",
            "qty_change",
            "reason",
            "sale",
            "notes",
            "created_at",
        ]

