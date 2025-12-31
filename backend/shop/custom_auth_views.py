"""
Custom authentication views with detailed error messages
"""
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import status
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom login view that provides detailed error messages:
    - If user doesn't exist: "Usuário não encontrado"
    - If user exists but password is wrong: "Senha incorreta"
    - If user is inactive: "Conta inativa"
    """
    
    def post(self, request, *args, **kwargs):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')
        
        if not username or not password:
            return Response(
                {"detail": "Por favor, forneça usuário e senha."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Try to find user by username or email
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            # Try to find by email
            try:
                user = User.objects.get(email=username)
            except User.DoesNotExist:
                return Response(
                    {"detail": "Usuário não encontrado. Verifique o nome de usuário ou email."},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        
        # Check if user is active
        if not user.is_active:
            return Response(
                {"detail": "Conta inativa. Entre em contato com o administrador."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check password directly first (more secure - doesn't reveal if user exists)
        if not user.check_password(password):
            # Password is wrong
            return Response(
                {"detail": "Senha incorreta. Verifique sua senha e tente novamente."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # If we get here, password is correct
        # Use the parent class to generate tokens
        # We need to temporarily modify request.data to use username
        original_username = request.data.get('username')
        request.data['username'] = user.username
        try:
            response = super().post(request, *args, **kwargs)
            return response
        finally:
            # Restore original username in case it's needed elsewhere
            request.data['username'] = original_username

