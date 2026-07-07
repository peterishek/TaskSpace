
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    # Auth
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),  # custom login (returns JWT pair)
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),  # SimpleJWT default alternative
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('password-reset/', views.password_reset_request, name='password_reset_request'),
    path('password-reset/confirm/', views.password_reset_confirm, name='password_reset_confirm'),

    # Tasks
    path('tasks/', views.task_list, name='task-list'),
    path('tasks/<int:pk>/', views.task_detail, name='task-detail'),
]