from django.contrib import admin
from django.urls import path, include
from api.views import CreateUserView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [

    path("", root_view, name="root"),
    # Admin Panel
    path("admin/", admin.site.urls),

    # User Management
    path("api/user/register", CreateUserView.as_view(), name="register"),
    path("api/user/login", TokenObtainPairView.as_view(), name="get_token"),
    path("api/token/refresh", TokenRefreshView.as_view(), name="refresh"),

    # Django Rest Framework Auth
    path("api-auth/", include("rest_framework.urls")),

    # API Endpoints from `api` app
    path("api/", include("api.urls")),
]
