from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Q
from .user_serializers import UserSerializer, UserCreateSerializer, UserUpdateSerializer

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    """
    User management - only accessible by admin/superuser
    """
    queryset = User.objects.all().order_by("-date_joined")
    permission_classes = [IsAdminUser]

    def get_serializer_class(self):
        if self.action in ["create"]:
            return UserCreateSerializer
        elif self.action in ["update", "partial_update"]:
            return UserUpdateSerializer
        return UserSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        role = self.request.query_params.get("role", None)
        search = self.request.query_params.get("search", None)

        if role:
            if role == "admin":
                queryset = queryset.filter(is_superuser=True)
            elif role == "manager":
                queryset = queryset.filter(is_staff=True, is_superuser=False)
            elif role == "staff":
                queryset = queryset.filter(is_staff=False, is_superuser=False)

        if search:
            queryset = queryset.filter(
                Q(username__icontains=search)
                | Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
            )

        return queryset

    def perform_create(self, serializer):
        # The UserCreateSerializer.create() method already handles password and user creation
        # So we just need to call save() which will call the serializer's create() method
        serializer.save()

    def perform_update(self, serializer):
        # The UserUpdateSerializer.update() method already handles password and operation_type
        # So we just need to call save() which will call the serializer's update() method
        serializer.save()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_stats(request):
    """Get user statistics for dashboard"""
    total_users = User.objects.count()
    total_staff = User.objects.filter(is_staff=True, is_superuser=False).count()
    total_managers = User.objects.filter(is_staff=True, is_superuser=False).count()
    total_admins = User.objects.filter(is_superuser=True).count()
    active_staff = User.objects.filter(is_staff=True, is_active=True).count()

    return Response({
        "total_users": total_users,
        "total_staff": total_staff,
        "total_managers": total_managers,
        "total_admins": total_admins,
        "active_staff": active_staff,
    })

