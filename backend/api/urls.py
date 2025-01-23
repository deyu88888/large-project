from django.urls import path
from . import views
from .views import RegisterView, CurrentUserView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # Authentication endpoints
    path("user/token/refresh", TokenRefreshView.as_view(), name="refresh"),
    path("user/register", RegisterView.as_view(), name="register"),  # Consolidated endpoint
    path("user/login", TokenObtainPairView.as_view(), name="get_token"),
    path("user/current", CurrentUserView.as_view(), name="current_user"),

    # Dashboard
    path('dashboard/stats/', views.dashboard_stats, name='dashboard_stats'),
]
