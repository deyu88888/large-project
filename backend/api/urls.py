from django.urls import path
from . import views
from .views import *
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # Authentication endpoints
    path("user/token/refresh", TokenRefreshView.as_view(), name="refresh"),
    path("user/register", RegisterView.as_view(), name="register"),
    path("user/login", TokenObtainPairView.as_view(), name="get_token"),
    path("user/current", CurrentUserView.as_view(), name="current_user"),
    
    # User management
    path('users/create/', views.CreateUserView.as_view(), name='create_user'),

    # Dashboard
    path('dashboard/stats/', views.dashboard_stats, name='dashboard_stats'),
]