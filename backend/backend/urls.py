from django.contrib import admin
from django.http import HttpResponse
from django.urls import path, include
from api.views import root_view, RegisterView, get_current_user
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


def welcome_view(request):
    """
    Root view for a simple welcome message.
    """
    return HttpResponse("Welcome to the API!")


urlpatterns = [
    # Welcome View
    path("", root_view, name="root"),

    # Admin Panel
    path("admin/", admin.site.urls),

    # API Endpoints
    path("api/user/register", RegisterView.as_view(), name="register"),
    path("api/user/login", TokenObtainPairView.as_view(), name="get_token"),
    path("api/token/refresh", TokenRefreshView.as_view(), name="refresh"),
    path("api/user/me", get_current_user, name="get_current_user"),  # For authenticated user data

    # Delegating all `/api` paths to `api/urls.py`
    path("api/", include("api.urls")),

    # Django Rest Framework Auth
    path("api-auth/", include("rest_framework.urls")),
]