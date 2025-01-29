from django.contrib import admin
from django.http import HttpResponse
from django.urls import path, include
from api.views import *
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

def welcome_view(request):
    return HttpResponse("Welcome to the API!")

urlpatterns = [
    path("", welcome_view, name="welcome"),
    path("admin", admin.site.urls),
    path("api/user/register", RegisterView.as_view(), name="register"),
    path("api/user/login", TokenObtainPairView.as_view(), name="get_token"),
    path("api/token/refresh", TokenRefreshView.as_view(), name="refresh"),
    path("api/user/me", get_current_user, name="get_current_user"), #For global callout
    path("api-auth", include("rest_framework.urls")),
    

    


    # This is basically importing all urls from api/urls.py with /api
    # attached to front of it
    path("api/", include("api.urls")),
]
