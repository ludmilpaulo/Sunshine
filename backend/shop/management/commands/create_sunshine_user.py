"""
Django management command to create/update the sunshine superuser
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from shop.models import UserProfile

User = get_user_model()


class Command(BaseCommand):
    help = "Create or update the sunshine superuser with UserProfile"

    def handle(self, *args, **options):
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
            self.stdout.write(
                self.style.SUCCESS(f"✓ Created user: {username}")
            )
        else:
            # Update existing user
            user.set_password(password)
            user.is_superuser = True
            user.is_staff = True
            user.is_active = True
            user.save()
            self.stdout.write(
                self.style.WARNING(f"→ Updated user: {username}")
            )

        # Create or update UserProfile
        profile, profile_created = UserProfile.objects.get_or_create(
            user=user,
            defaults={'operation_type': UserProfile.OperationType.BOTH}
        )

        if profile_created:
            self.stdout.write(
                self.style.SUCCESS(
                    f"✓ Created UserProfile for {username} with operation_type: BOTH"
                )
            )
        else:
            profile.operation_type = UserProfile.OperationType.BOTH
            profile.save()
            self.stdout.write(
                self.style.WARNING(
                    f"→ Updated UserProfile for {username} with operation_type: BOTH"
                )
            )

        self.stdout.write(
            self.style.SUCCESS(f"\n✓ User '{username}' is ready to use!")
        )
        self.stdout.write(f"  Password: {password}")
        self.stdout.write(f"  Is Superuser: {user.is_superuser}")
        self.stdout.write(f"  Is Active: {user.is_active}")
        self.stdout.write(f"  Operation Type: {profile.operation_type}")

