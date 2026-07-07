from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import Task

User = get_user_model()


class TaskSerializer(serializers.ModelSerializer):
    # Show the username for convenience, but don't allow it to be set directly —
    # the user is always taken from the authenticated request (see views.py).
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'description',
            'user',
            'priority',
            'status',
            'due_date',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError("Title cannot be empty.")
        return value


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("That username is already taken.")
        return value

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
        )


class LoginSerializer(serializers.Serializer):
    """
    Plain username/password validation. Note: if you're using SimpleJWT's
    TokenObtainPairView for the actual login endpoint, you don't need this —
    it's here in case you want a custom login view instead.
    """
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        from django.contrib.auth import authenticate
        user = authenticate(username=attrs['username'], password=attrs['password'])
        if not user:
            raise serializers.ValidationError("Invalid username or password.")
        if not user.is_active:
            raise serializers.ValidationError("This account is inactive.")
        attrs['user'] = user
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    """Step 1: user submits their email, we email them a hash + secret."""
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            # Don't reveal whether the email exists — fail silently in the view instead.
            pass
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Step 2: user submits the hash + secret (from the emailed link) with a new password.
    - hash:   urlsafe base64-encoded user id
    - secret: Django's PasswordResetTokenGenerator token
    """
    hash = serializers.CharField()
    secret = serializers.CharField()
    password = serializers.CharField(write_only=True, validators=[validate_password])

    def validate(self, attrs):
        from django.utils.http import urlsafe_base64_decode
        from django.contrib.auth.tokens import default_token_generator

        try:
            uid = urlsafe_base64_decode(attrs['hash']).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError("Invalid or expired reset link.")

        if not default_token_generator.check_token(user, attrs['secret']):
            raise serializers.ValidationError("Invalid or expired reset link.")

        attrs['user'] = user
        return attrs

    def save(self):
        user = self.validated_data['user']
        user.set_password(self.validated_data['password'])
        user.save()
        return user