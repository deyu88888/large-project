from django.contrib import admin
from django.http import HttpResponse
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from api.views import get_current_user

def welcome_view(request):
    return HttpResponse("Welcome to the API!")

urlpatterns = [
    path("", welcome_view, name="welcome"),
    path("admin", admin.site.urls),
    path("api/user/me", get_current_user, name="get_current_user"),
    path("api-auth", include("rest_framework.urls")),
    
    # Remove direct registration/login path here:
    # path("api/user/register", RegisterView.as_view(), name="register"),
    # path("api/user/login", TokenObtainPairView.as_view(), name="get_token"),
    # path("api/token/refresh", TokenRefreshView.as_view(), name="refresh"),

    


    # This is basically importing all urls from api/urls.py with /api
    # attached to front of it
    # This includes all URLs from api/urls.py with '/api' prefix
    path("api/", include("api.urls")),
]