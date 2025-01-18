from django.contrib import admin
from django.http import HttpResponse
from django.urls import path, include


def welcome_view(request):
    return HttpResponse("Welcome to the API!")

urlpatterns = [
    path("", welcome_view, name="welcome"),
    path("admin", admin.site.urls),
    path("api-auth", include("rest_framework.urls")),

    # This is basically importing all urls from api/urls.py with /api
    # attached to front of it
    path("api/", include("api.urls")),
]
