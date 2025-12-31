"""
Django management command to create test users for all roles.
Usage: python manage.py create_test_users
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from shop.models import UserProfile

User = get_user_model()


class Command(BaseCommand):
    help = "Creates test users for admin, manager, and staff roles"

    def handle(self, *args, **options):
        # Default password for all test users
        default_password = "test1234"

        # Create Admin user
        admin_user, created = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@sunshine.com",
                "first_name": "Admin",
                "last_name": "User",
                "is_superuser": True,
                "is_staff": True,
                "is_active": True,
            },
        )
        if created:
            admin_user.set_password(default_password)
            admin_user.save()
            # Create profile with BOTH operation type for admin
            UserProfile.objects.get_or_create(
                user=admin_user,
                defaults={"operation_type": "BOTH"}
            )
            self.stdout.write(
                self.style.SUCCESS(f"✓ Created admin user: {admin_user.username} / {default_password}")
            )
        else:
            admin_user.set_password(default_password)
            admin_user.save()
            # Update profile
            UserProfile.objects.get_or_create(
                user=admin_user,
                defaults={"operation_type": "BOTH"}
            )
            UserProfile.objects.filter(user=admin_user).update(operation_type="BOTH")
            self.stdout.write(
                self.style.WARNING(f"→ Updated admin user: {admin_user.username} / {default_password}")
            )

        # Create Manager user
        manager_user, created = User.objects.get_or_create(
            username="manager",
            defaults={
                "email": "manager@sunshine.com",
                "first_name": "Manager",
                "last_name": "User",
                "is_superuser": False,
                "is_staff": True,
                "is_active": True,
            },
        )
        if created:
            manager_user.set_password(default_password)
            manager_user.save()
            # Create profile with SHOP operation type for manager
            UserProfile.objects.get_or_create(
                user=manager_user,
                defaults={"operation_type": "SHOP"}
            )
            self.stdout.write(
                self.style.SUCCESS(f"✓ Created manager user: {manager_user.username} / {default_password}")
            )
        else:
            manager_user.set_password(default_password)
            manager_user.save()
            # Update profile
            UserProfile.objects.get_or_create(
                user=manager_user,
                defaults={"operation_type": "SHOP"}
            )
            UserProfile.objects.filter(user=manager_user).update(operation_type="SHOP")
            self.stdout.write(
                self.style.WARNING(f"→ Updated manager user: {manager_user.username} / {default_password}")
            )

        # Create Staff user
        staff_user, created = User.objects.get_or_create(
            username="staff",
            defaults={
                "email": "staff@sunshine.com",
                "first_name": "Staff",
                "last_name": "User",
                "is_superuser": False,
                "is_staff": False,
                "is_active": True,
            },
        )
        if created:
            staff_user.set_password(default_password)
            staff_user.save()
            # Create profile with SHOP operation type for staff
            UserProfile.objects.get_or_create(
                user=staff_user,
                defaults={"operation_type": "SHOP"}
            )
            self.stdout.write(
                self.style.SUCCESS(f"✓ Created staff user: {staff_user.username} / {default_password}")
            )
        else:
            staff_user.set_password(default_password)
            staff_user.save()
            # Update profile
            UserProfile.objects.get_or_create(
                user=staff_user,
                defaults={"operation_type": "SHOP"}
            )
            UserProfile.objects.filter(user=staff_user).update(operation_type="SHOP")
            self.stdout.write(
                self.style.WARNING(f"→ Updated staff user: {staff_user.username} / {default_password}")
            )

        self.stdout.write(self.style.SUCCESS("\n" + "=" * 50))
        self.stdout.write(self.style.SUCCESS("Test Users Created Successfully!"))
        self.stdout.write(self.style.SUCCESS("=" * 50))
        self.stdout.write(self.style.SUCCESS(f"\nAdmin:  admin / {default_password}"))
        self.stdout.write(self.style.SUCCESS(f"Manager: manager / {default_password}"))
        self.stdout.write(self.style.SUCCESS(f"Staff:   staff / {default_password}"))
        self.stdout.write(self.style.SUCCESS("\n" + "=" * 50))

