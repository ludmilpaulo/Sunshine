#!/usr/bin/env python
"""
Test script to check barcode search functionality
Usage: python manage.py shell < test_barcode_search.py
Or: python -c "import django; django.setup(); exec(open('test_barcode_search.py').read())"
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from shop.models import Product
from shop.views import normalize_barcode_for_search

# Test barcode
test_barcode = "777744445557"
print(f"\n{'='*60}")
print(f"Testing barcode search for: '{test_barcode}'")
print(f"{'='*60}\n")

# Normalize the barcode
normalized = normalize_barcode_for_search(test_barcode)
print(f"Original barcode: '{test_barcode}'")
print(f"Normalized barcode: '{normalized}'")
print(f"Length: {len(test_barcode)} -> {len(normalized) if normalized else 0}\n")

# Check if product exists with exact match
exact_match = Product.objects.filter(barcode=test_barcode).first()
print(f"Exact match (original): {'✓ Found' if exact_match else '✗ Not found'}")
if exact_match:
    print(f"  Product: {exact_match.name} (ID: {exact_match.id})")

# Check if product exists with normalized match
if normalized:
    normalized_match = Product.objects.filter(barcode=normalized).first()
    print(f"Exact match (normalized): {'✓ Found' if normalized_match else '✗ Not found'}")
    if normalized_match:
        print(f"  Product: {normalized_match.name} (ID: {normalized_match.id})")

# Check case-insensitive match
case_insensitive = Product.objects.filter(barcode__iexact=test_barcode).first()
print(f"Case-insensitive match: {'✓ Found' if case_insensitive else '✗ Not found'}")
if case_insensitive:
    print(f"  Product: {case_insensitive.name} (ID: {case_insensitive.id})")

# Check contains match
contains_match = Product.objects.filter(barcode__contains=test_barcode).first()
print(f"Contains match: {'✓ Found' if contains_match else '✗ Not found'}")
if contains_match:
    print(f"  Product: {contains_match.name} (ID: {contains_match.id})")
    print(f"  Stored barcode: '{contains_match.barcode}'")

# Check all products and normalize their barcodes
print(f"\n{'='*60}")
print("Checking all products with normalized barcodes:")
print(f"{'='*60}\n")
all_products = Product.objects.all()[:20]  # Limit to first 20
found_match = False
for product in all_products:
    normalized_stored = normalize_barcode_for_search(product.barcode)
    if normalized_stored and normalized_stored == normalized:
        print(f"✓ Match found via normalization:")
        print(f"  Product: {product.name} (ID: {product.id})")
        print(f"  Stored barcode: '{product.barcode}'")
        print(f"  Normalized stored: '{normalized_stored}'")
        print(f"  Normalized search: '{normalized}'")
        found_match = True
        break

if not found_match:
    print("✗ No match found via normalization")

# Show all products with similar barcodes
print(f"\n{'='*60}")
print("Products with similar barcodes (containing '777' or '444'):")
print(f"{'='*60}\n")
similar = Product.objects.filter(barcode__icontains='777') | Product.objects.filter(barcode__icontains='444')
for product in similar[:10]:
    print(f"  - {product.name}: '{product.barcode}' (ID: {product.id})")

print(f"\n{'='*60}")
print("Summary:")
print(f"{'='*60}")
print(f"Total products in database: {Product.objects.count()}")
print(f"Products with similar barcodes: {similar.count()}")
print(f"Test barcode: '{test_barcode}'")
print(f"Normalized: '{normalized}'")
print(f"Match found: {'✓ YES' if (exact_match or normalized_match or case_insensitive or contains_match or found_match) else '✗ NO'}")

