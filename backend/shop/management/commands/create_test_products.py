"""
Django management command to create test products.
Usage: python manage.py create_test_products
"""
from django.core.management.base import BaseCommand
from shop.models import Product, Inventory


class Command(BaseCommand):
    help = "Creates test products for testing barcode scanning"

    def handle(self, *args, **options):
        # Test product with the provided barcode
        product, created = Product.objects.get_or_create(
            barcode="7898553445613",
            defaults={
                "name": "Produto de Teste - Refrigerante",
                "sku": "TEST-001",
                "price": "150.00",
                "cost": "100.00",
                "tax_rate": "14.00",
                "active": True,
            },
        )
        
        if created:
            Inventory.objects.create(product=product, qty_on_hand=50)
            self.stdout.write(
                self.style.SUCCESS(f"✓ Created test product: {product.name} (Barcode: {product.barcode})")
            )
        else:
            # Update existing product
            product.name = "Produto de Teste - Refrigerante"
            product.price = "150.00"
            product.cost = "100.00"
            product.active = True
            product.save()
            
            inventory, _ = Inventory.objects.get_or_create(product=product, defaults={"qty_on_hand": 50})
            if not _:
                inventory.qty_on_hand = 50
                inventory.save()
            
            self.stdout.write(
                self.style.WARNING(f"→ Updated test product: {product.name} (Barcode: {product.barcode})")
            )

        # Create a few more test products
        test_products = [
            {
                "barcode": "7891234567890",
                "name": "Água Mineral 500ml",
                "sku": "TEST-002",
                "price": "50.00",
                "cost": "30.00",
                "tax_rate": "0.00",
            },
            {
                "barcode": "7899876543210",
                "name": "Chocolate ao Leite",
                "sku": "TEST-003",
                "price": "200.00",
                "cost": "120.00",
                "tax_rate": "14.00",
            },
            {
                "barcode": "7891112223334",
                "name": "Pão de Açúcar",
                "sku": "TEST-004",
                "price": "75.00",
                "cost": "45.00",
                "tax_rate": "0.00",
            },
        ]

        for prod_data in test_products:
            prod, created = Product.objects.get_or_create(
                barcode=prod_data["barcode"],
                defaults={
                    **prod_data,
                    "active": True,
                },
            )
            
            if created:
                Inventory.objects.create(product=prod, qty_on_hand=100)
                self.stdout.write(
                    self.style.SUCCESS(f"✓ Created: {prod.name} (Barcode: {prod.barcode})")
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f"→ Already exists: {prod.name} (Barcode: {prod.barcode})")
                )

        self.stdout.write(self.style.SUCCESS("\n" + "=" * 50))
        self.stdout.write(self.style.SUCCESS("Test Products Created Successfully!"))
        self.stdout.write(self.style.SUCCESS("=" * 50))
        self.stdout.write(self.style.SUCCESS(f"\nMain test product: 7898553445613 - Produto de Teste - Refrigerante"))
        self.stdout.write(self.style.SUCCESS(f"Price: 150.00 AOA | Stock: 50 units"))
        self.stdout.write(self.style.SUCCESS("\n" + "=" * 50))

