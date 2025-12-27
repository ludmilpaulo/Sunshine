"""
Password reset views for the API
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
import secrets

User = get_user_model()


@api_view(["POST"])
@permission_classes([AllowAny])
def request_password_reset(request):
    """
    Request password reset - sends reset token to user's email
    Body: { "email": "user@example.com" }
    """
    email = request.data.get("email")
    
    if not email:
        return Response(
            {"detail": "Email é obrigatório"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(email=email, is_active=True)
    except User.DoesNotExist:
        # Don't reveal if email exists for security
        return Response(
            {"detail": "Se o e-mail existir, um link de redefinição foi enviado."},
            status=status.HTTP_200_OK
        )

    # Generate reset token
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    
    # In production, send email. For now, return token in response (for testing)
    reset_url = f"{request.scheme}://{request.get_host()}/reset-password?uid={uid}&token={token}"
    
    # For development: return token in response
    # In production, you would send an email instead
    if settings.DEBUG:
        return Response({
            "detail": "Link de redefinição gerado (modo desenvolvimento)",
            "reset_url": reset_url,
            "uid": uid,
            "token": token,
        }, status=status.HTTP_200_OK)
    else:
        # In production, send email
        try:
            send_mail(
                subject="Redefinição de Senha - Sunshine POS",
                message=f"Use este link para redefinir sua senha: {reset_url}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
            return Response(
                {"detail": "Se o e-mail existir, um link de redefinição foi enviado."},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"detail": "Erro ao enviar e-mail de redefinição"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(["POST"])
@permission_classes([AllowAny])
def confirm_password_reset(request):
    """
    Confirm password reset with token
    Body: { "uid": "...", "token": "...", "new_password": "..." }
    """
    uid = request.data.get("uid")
    token = request.data.get("token")
    new_password = request.data.get("new_password")

    if not all([uid, token, new_password]):
        return Response(
            {"detail": "UID, token e nova senha são obrigatórios"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(new_password) < 8:
        return Response(
            {"detail": "A senha deve ter pelo menos 8 caracteres"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id, is_active=True)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response(
            {"detail": "Link de redefinição inválido ou expirado"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Verify token
    if not default_token_generator.check_token(user, token):
        return Response(
            {"detail": "Link de redefinição inválido ou expirado"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Set new password
    user.set_password(new_password)
    user.save()

    return Response(
        {"detail": "Senha redefinida com sucesso"},
        status=status.HTTP_200_OK
    )

