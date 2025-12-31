"""
Django management command to create the Azzur Agua de Mesa product.
Usage: python manage.py create_azzur_product
"""
from django.core.management.base import BaseCommand
from shop.models import Product, Inventory


class Command(BaseCommand):
    help = "Creates the Azzur Agua de Mesa product with barcode 745760805778 (12 digits) and fallback 74576080578 (11 digits)"

    def handle(self, *args, **options):
        # Primary barcode: 745760805778 (12 digits - the correct one from the product)
        primary_barcode = "745760805778"
        
        # Create/update product with primary barcode
        product, created = Product.objects.get_or_create(
            barcode=primary_barcode,
            defaults={
                "name": "Azzur Agua de Mesa",
                "sku": "AZZUR-001",
                "price": "100.00",
                "cost": "60.00",
                "tax_rate": "0.00",
                "active": True,
            },
        )
        
        if created:
            Inventory.objects.create(product=product, qty_on_hand=100)
            self.stdout.write(
                self.style.SUCCESS(
                    f"✓ Created product: {product.name} (Barcode: {product.barcode})"
                )
            )
        else:
            # Update existing product
            product.name = "Azzur Agua de Mesa"
            product.price = "100.00"
            product.cost = "60.00"
            product.active = True
            product.save()
            
            inventory, _ = Inventory.objects.get_or_create(
                product=product, defaults={"qty_on_hand": 100}
            )
            if not _:
                inventory.qty_on_hand = 100
                inventory.save()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f"✓ Updated product: {product.name} (Barcode: {product.barcode})"
                )
            )
        
        # Also create a product with the 11-digit barcode (74576080578) if scanner is reading it incorrectly
        # This ensures the product is found regardless of which code is scanned
        scanned_barcode_11 = "74576080578"
        if not Product.objects.filter(barcode=scanned_barcode_11).exists():
            product_11, created_11 = Product.objects.get_or_create(
                barcode=scanned_barcode_11,
                defaults={
                    "name": "Azzur Agua de Mesa",
                    "sku": "AZZUR-001",
                    "price": "100.00",
                    "cost": "60.00",
                    "tax_rate": "0.00",
                    "active": True,
                },
            )
            
            if created_11:
                Inventory.objects.create(product=product_11, qty_on_hand=100)
                self.stdout.write(
                    self.style.SUCCESS(
                        f"✓ Created product with 11-digit barcode (fallback): {product_11.name} (Barcode: {product_11.barcode})"
                    )
                )
        
        self.stdout.write(self.style.SUCCESS("\n" + "=" * 50))
        self.stdout.write(self.style.SUCCESS("Azzur Agua de Mesa Product Ready!"))
        self.stdout.write(self.style.SUCCESS("=" * 50))
        
        # List all products with similar barcodes
        all_products = Product.objects.filter(
            barcode__startswith="7457608057"
        ).values_list("barcode", "name", named=True)
        
        if all_products:
            self.stdout.write(self.style.SUCCESS("\nProducts with similar barcodes:"))
            for prod in all_products:
                self.stdout.write(f"  - {prod.barcode}: {prod.name}")

