from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    operation_type = serializers.SerializerMethodField()

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
            "operation_type",
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
    
    def get_operation_type(self, obj):
        # Import here to avoid circular import issues
        from .models import UserProfile
        try:
            profile = obj.profile
            return profile.operation_type
        except UserProfile.DoesNotExist:
            # Default to SHOP for existing users without profile
            return "SHOP"


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating users, including operation_type"""
    operation_type = serializers.ChoiceField(
        choices=["SHOP", "SALON", "STUDIO", "BOTH"],
        required=False,
        write_only=True
    )
    password = serializers.CharField(
        write_only=True,
        required=False,
        min_length=8,
        allow_blank=True,
        error_messages={
            "min_length": "A senha deve ter pelo menos 8 caracteres",
        }
    )

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "is_active",
            "operation_type",
        ]

    def update(self, instance, validated_data):
        # Import here to avoid circular import issues
        from .models import UserProfile
        
        operation_type = validated_data.pop("operation_type", None)
        password = validated_data.pop("password", None)
        
        user = super().update(instance, validated_data)
        
        # Update password if provided
        if password:
            user.set_password(password)
            user.save()
        
        # Update operation_type if provided
        if operation_type is not None:
            UserProfile.objects.update_or_create(
                user=user,
                defaults={"operation_type": operation_type}
            )
        
        return user


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        min_length=8,
        error_messages={
            "required": "A senha é obrigatória",
            "min_length": "A senha deve ter pelo menos 8 caracteres",
        }
    )
    role = serializers.ChoiceField(
        choices=["admin", "manager", "staff"], 
        write_only=True, 
        required=True,
        error_messages={
            "required": "A função é obrigatória",
            "invalid_choice": "Função inválida. Escolha entre: admin, manager ou staff",
        }
    )
    operation_type = serializers.ChoiceField(
        choices=["SHOP", "SALON", "STUDIO", "BOTH"],
        write_only=True,
        required=True,
        error_messages={
            "required": "O tipo de operação é obrigatório",
            "invalid_choice": "Tipo de operação inválido. Escolha entre: SHOP, SALON, STUDIO ou BOTH",
        },
        help_text="SHOP for shop users, SALON for salon users, STUDIO for studio users, BOTH for admin"
    )
    username = serializers.CharField(
        required=True,
        error_messages={
            "required": "O nome de usuário é obrigatório",
            "blank": "O nome de usuário não pode estar vazio",
        }
    )
    email = serializers.EmailField(
        required=True,
        error_messages={
            "required": "O e-mail é obrigatório",
            "invalid": "E-mail inválido. Verifique o formato do e-mail",
            "blank": "O e-mail não pode estar vazio",
        }
    )

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "role",
            "operation_type",
            "is_active",
        ]

    def validate_username(self, value):
        """Validate username uniqueness"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Este nome de usuário já está em uso. Escolha outro.")
        return value

    def validate_email(self, value):
        """Validate email uniqueness"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este e-mail já está em uso. Escolha outro.")
        return value

    def create(self, validated_data):
        role = validated_data.pop("role")
        operation_type = validated_data.pop("operation_type")
        password = validated_data.pop("password")
        user = User.objects.create(**validated_data)
        user.set_password(password)

        if role == "admin":
            user.is_superuser = True
            user.is_staff = True
            # Admin can access both by default
            if operation_type == "BOTH":
                operation_type = "BOTH"
        elif role == "manager":
            user.is_staff = True
            user.is_superuser = False
        else:  # staff
            user.is_staff = False
            user.is_superuser = False

        user.save()
        
        # Create or update user profile
        # Import here to avoid circular import issues
        from .models import UserProfile
        UserProfile.objects.update_or_create(
            user=user,
            defaults={"operation_type": operation_type}
        )
        
        return user

