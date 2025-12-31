#!/usr/bin/env python
"""
Script to create the sunshine superuser with UserProfile
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from shop.models import UserProfile

User = get_user_model()

username = "sunshine"
password = "Maitland@2025"

# Check if user exists
user, created = User.objects.get_or_create(
    username=username,
    defaults={
        'email': 'sunshine@sunshinebar.com',
        'is_superuser': True,
        'is_staff': True,
        'is_active': True,
    }
)

if created:
    user.set_password(password)
    user.save()
    print(f"✓ Created user: {username}")
else:
    # Update existing user
    user.set_password(password)
    user.is_superuser = True
    user.is_staff = True
    user.is_active = True
    user.save()
    print(f"→ Updated user: {username}")

# Create or update UserProfile
profile, profile_created = UserProfile.objects.get_or_create(
    user=user,
    defaults={'operation_type': UserProfile.OperationType.BOTH}
)

if profile_created:
    print(f"✓ Created UserProfile for {username} with operation_type: BOTH")
else:
    profile.operation_type = UserProfile.OperationType.BOTH
    profile.save()
    print(f"→ Updated UserProfile for {username} with operation_type: BOTH")

print(f"\n✓ User '{username}' is ready to use!")
print(f"  Password: {password}")
print(f"  Is Superuser: {user.is_superuser}")
print(f"  Is Active: {user.is_active}")
print(f"  Operation Type: {profile.operation_type}")

