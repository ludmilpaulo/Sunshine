"""
Django management command to create the Azzur Agua de Mesa product.
Usage: python manage.py create_azzur_product
"""
from django.core.management.base import BaseCommand
from shop.models import Product, Inventory


class Command(BaseCommand):
    help = "Creates the Azzur Agua de Mesa product with barcode 745760805778"

    def handle(self, *args, **options):
        # Try both barcodes - the one mentioned (12 digits) and the one being scanned (11 digits)
        barcodes_to_try = ["745760805778", "74576080578"]
        
        for barcode in barcodes_to_try:
            product, created = Product.objects.get_or_create(
                barcode=barcode,
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
        
        # Also create a product with the scanned barcode if it doesn't exist
        scanned_barcode = "74576080578"
        if not Product.objects.filter(barcode=scanned_barcode).exists():
            product, created = Product.objects.get_or_create(
                barcode=scanned_barcode,
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
                        f"✓ Created product with scanned barcode: {product.name} (Barcode: {product.barcode})"
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

