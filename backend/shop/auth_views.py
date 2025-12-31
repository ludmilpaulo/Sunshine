from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model

User = get_user_model()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    """Get current user information"""
    from .models import UserProfile
    
    user = request.user
    
    # Determine role
    if user.is_superuser:
        role = "admin"
    elif user.is_staff:
        role = "manager"
    else:
        role = "staff"
    
    # Get operation type from profile
    operation_type = "SALON"  # Default
    try:
        profile = user.profile
        operation_type = profile.operation_type
    except UserProfile.DoesNotExist:
        # Create default profile for existing users
        UserProfile.objects.create(user=user, operation_type="SALON")
        operation_type = "SALON"
    
    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "full_name": user.get_full_name() or user.username,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
        "is_active": user.is_active,
        "role": role,
        "operation_type": operation_type,
        "date_joined": user.date_joined.isoformat() if user.date_joined else None,
        "last_login": user.last_login.isoformat() if user.last_login else None,
    })

