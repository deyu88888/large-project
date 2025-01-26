from django.contrib import admin
from django.http import HttpResponse
from django.urls import path, include
from api.views import EventHistoryView, RSVPEventView, RegisterView, get_current_user, MySocietiesView, JoinSocietyView
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
    


    path('my-societies/', MySocietiesView.as_view(), name='my_societies'),
    path('join-society/<int:society_id>/', JoinSocietyView.as_view(), name='join_society'),
    path('leave-society/<int:society_id>/', MySocietiesView.as_view(), name='leave_society'),
    path('events/rsvp/', RSVPEventView.as_view(), name='rsvp_event'),
    path('events/history/', EventHistoryView.as_view(), name='event_history'),



    # This is basically importing all urls from api/urls.py with /api
    # attached to front of it
    path("api/", include("api.urls")),
]
