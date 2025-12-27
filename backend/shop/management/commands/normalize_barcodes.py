"""
Django management command to normalize barcode codes in the database.
Usage: python manage.py normalize_barcodes
"""
from django.core.management.base import BaseCommand
from shop.models import Product


def normalize_barcode(barcode_str):
    """Normalize barcode by extracting valid pattern from potentially duplicated code"""
    if not barcode_str:
        return None
    
    barcode = str(barcode_str).strip()
    
    # If barcode is too long, try to extract valid barcode (handle duplication)
    if len(barcode) > 20:
        # Try to find a repeating pattern
        for length in [8, 12, 13, 14]:
            pattern = barcode[:length]
            if len(pattern) == length and pattern.isdigit():
                # Check if the code is just this pattern repeated
                repetitions = len(barcode) // length
                if pattern * repetitions == barcode[:length * repetitions]:
                    return pattern
            # Also check if code ends with a valid barcode
            end_pattern = barcode[-length:]
            if len(end_pattern) == length and end_pattern.isdigit():
                # Check if this pattern appears at the start too
                if barcode.startswith(end_pattern):
                    return end_pattern
    
    return barcode


class Command(BaseCommand):
    help = "Normalizes barcode codes in the database by removing duplicates"

    def handle(self, *args, **options):
        products = Product.objects.all()
        updated_count = 0
        
        for product in products:
            original_barcode = product.barcode
            normalized = normalize_barcode(original_barcode)
            
            if normalized and normalized != original_barcode:
                # Check if normalized barcode already exists
                existing = Product.objects.filter(barcode=normalized).exclude(id=product.id).first()
                if existing:
                    self.stdout.write(
                        self.style.WARNING(
                            f"⚠ Product {product.id} ({product.name}): "
                            f"Cannot normalize '{original_barcode}' to '{normalized}' - "
                            f"already exists in product {existing.id}"
                        )
                    )
                else:
                    product.barcode = normalized
                    product.save()
                    updated_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"✓ Product {product.id} ({product.name}): "
                            f"'{original_barcode}' → '{normalized}'"
                        )
                    )
        
        self.stdout.write(self.style.SUCCESS(f"\n✅ Normalized {updated_count} product barcodes"))

