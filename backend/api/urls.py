from django.urls import path
from .views import *
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


urlpatterns = [
    path("user/token/refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("user/register/", RegisterView.as_view(), name="register"),
    path("user/login/", TokenObtainPairView.as_view(), name="get_token"),
    path("user/current/", CurrentUserView.as_view(), name="current_user"),
    path("request-otp/", request_otp, name="request-otp"),
    path("verify-otp/", verify_otp, name="verify-otp"),
]
