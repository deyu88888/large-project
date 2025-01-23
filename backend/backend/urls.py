from django.contrib import admin
from django.http import HttpResponse
from django.urls import path, include
from api.views import root_view


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
    path("api/", include("api.urls")),  # Delegates all `/api` paths to `api/urls.py`

    # Django Rest Framework Auth
    path("api-auth/", include("rest_framework.urls")),
]
