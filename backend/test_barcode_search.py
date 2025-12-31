"""
Test script to verify barcode search functionality for 745760805778
Run this locally to test the search strategies before deploying to production.
Usage: python manage.py shell < test_barcode_search.py
Or: python manage.py shell
>>> exec(open('test_barcode_search.py').read())
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from shop.models import Product
from shop.views import normalize_barcode_for_search

# Test barcodes
test_barcodes = [
    "745760805778",  # 12 digits - correct
    "74576080578",   # 11 digits - what scanner might read
]

print("=" * 60)
print("Testing Barcode Search for Azzur Agua de Mesa")
print("=" * 60)

# Check if product exists
for barcode in test_barcodes:
    print(f"\n📦 Checking barcode: {barcode} (length: {len(barcode)})")
    
    # Normalize
    normalized = normalize_barcode_for_search(barcode)
    print(f"   Normalized: {normalized}")
    
    # Try exact match
    product = Product.objects.filter(barcode=barcode).first()
    if product:
        print(f"   ✅ Found via exact match: {product.name}")
    else:
        print(f"   ❌ Not found via exact match")
        
        # Try normalized match
        product = Product.objects.filter(barcode=normalized).first()
        if product:
            print(f"   ✅ Found via normalized match: {product.name}")
        else:
            print(f"   ❌ Not found via normalized match")
            
            # Try contains
            product = Product.objects.filter(barcode__contains=barcode).first()
            if product:
                print(f"   ✅ Found via contains: {product.name} (stored: {product.barcode})")
            else:
                print(f"   ❌ Not found via contains")
                
                # Try startswith
                product = Product.objects.filter(barcode__startswith=barcode).first()
                if product:
                    print(f"   ✅ Found via startswith: {product.name} (stored: {product.barcode})")
                else:
                    print(f"   ❌ Not found via startswith")
                    
                    # Try reverse (stored in scanned)
                    all_products = Product.objects.filter(barcode__startswith="7457608057")
                    for prod in all_products:
                        normalized_stored = normalize_barcode_for_search(prod.barcode)
                        if normalized_stored and (barcode in normalized_stored or normalized_stored in barcode):
                            print(f"   ✅ Found via reverse match: {prod.name} (stored: {prod.barcode})")
                            break
                    else:
                        print(f"   ❌ Not found via any strategy")

print("\n" + "=" * 60)
print("All products with similar barcodes:")
print("=" * 60)
similar_products = Product.objects.filter(barcode__startswith="7457608057")
if similar_products.exists():
    for prod in similar_products:
        print(f"  - {prod.barcode}: {prod.name} (Active: {prod.active})")
else:
    print("  ⚠️  No products found with barcode starting with '7457608057'")
    print("  💡 Run: python manage.py create_azzur_product")

print("\n" + "=" * 60)
