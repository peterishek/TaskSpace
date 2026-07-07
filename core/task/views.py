from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Task
from .serializers import (
    TaskSerializer,
    RegisterSerializer,
    LoginSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register(request):
    """POST /api/register/ -> create a new user account"""
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login(request):
    """
    POST /api/login/ -> validate credentials, return JWT pair.
    Optional custom alternative to SimpleJWT's TokenObtainPairView
    (e.g. if you want extra fields in the response, like username).
    """
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data['user']

    refresh = RefreshToken.for_user(user)
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'username': user.username,
    })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_request(request):
    """
    POST /api/password-reset/ -> { "email": "..." }
    Emails the user a hash + secret to confirm the reset with.
    Always returns 200 regardless of whether the email exists, to avoid
    leaking which emails are registered.
    """
    serializer = PasswordResetRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data['email']

    from django.contrib.auth import get_user_model
    from django.contrib.auth.tokens import default_token_generator
    from django.utils.http import urlsafe_base64_encode
    from django.utils.encoding import force_bytes
    from django.core.mail import send_mail

    User = get_user_model()
    user = User.objects.filter(email=email).first()

    if user:
        uid_hash = urlsafe_base64_encode(force_bytes(user.pk))
        secret = default_token_generator.make_token(user)

        # Wire this into your actual frontend reset-confirmation URL.
        reset_link = f"http://localhost:5173/reset-password?hash={uid_hash}&secret={secret}"

        send_mail(
            subject="Reset your password",
            message=f"Use this link to reset your password: {reset_link}",
            from_email=None,  # uses DEFAULT_FROM_EMAIL from settings
            recipient_list=[email],
            fail_silently=True,
        )

    return Response({"detail": "If that email exists, a reset link has been sent."})


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_confirm(request):
    """POST /api/password-reset/confirm/ -> { "hash", "secret", "password" }"""
    serializer = PasswordResetConfirmSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response({"detail": "Password has been reset successfully."})


def _get_owned_task_or_404(pk, user):
    """Fetch a task by pk, but only if it belongs to the requesting user."""
    return get_object_or_404(Task, pk=pk, user=user)


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def task_list(request):
    """
    GET  /api/tasks/  -> list current user's tasks
    POST /api/tasks/  -> create a task
    """
    if request.method == 'GET':
        tasks = Task.objects.filter(user=request.user).select_related('user').order_by('-created_at')

        # optional simple filtering via query params, e.g. ?status=todo&priority=high
        status_param = request.query_params.get('status')
        priority_param = request.query_params.get('priority')
        if status_param:
            tasks = tasks.filter(status=status_param)
        if priority_param:
            tasks = tasks.filter(priority=priority_param)

        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)

    # POST
    serializer = TaskSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def task_detail(request, pk):
    """
    GET    /api/tasks/{id}/  -> retrieve one task
    PUT    /api/tasks/{id}/  -> full update
    PATCH  /api/tasks/{id}/  -> partial update
    DELETE /api/tasks/{id}/  -> delete
    """
    task = _get_owned_task_or_404(pk, request.user)

    if request.method == 'GET':
        serializer = TaskSerializer(task)
        return Response(serializer.data)

    if request.method in ('PUT', 'PATCH'):
        partial = request.method == 'PATCH'
        serializer = TaskSerializer(task, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # DELETE
    task.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)