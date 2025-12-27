from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "is_staff",
            "is_superuser",
            "is_active",
            "role",
            "date_joined",
            "last_login",
        ]
        read_only_fields = ["date_joined", "last_login"]

    def get_role(self, obj):
        if obj.is_superuser:
            return "admin"
        elif obj.is_staff:
            return "manager"
        else:
            return "staff"

    def get_full_name(self, obj):
        if obj.first_name or obj.last_name:
            return f"{obj.first_name} {obj.last_name}".strip()
        return obj.username


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    role = serializers.ChoiceField(choices=["admin", "manager", "staff"], write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "role",
            "is_active",
        ]

    def create(self, validated_data):
        role = validated_data.pop("role")
        password = validated_data.pop("password")
        user = User.objects.create(**validated_data)
        user.set_password(password)

        if role == "admin":
            user.is_superuser = True
            user.is_staff = True
        elif role == "manager":
            user.is_staff = True
            user.is_superuser = False
        else:  # staff
            user.is_staff = False
            user.is_superuser = False

        user.save()
        return user

