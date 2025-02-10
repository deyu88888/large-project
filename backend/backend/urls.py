from django.contrib import admin
from django.http import HttpResponse
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from api.views import (
    get_current_user,
    JoinSocietyView,
    MySocietiesView,
    RSVPEventView,
    EventHistoryView,
)

def welcome_view(request):
    return HttpResponse("Welcome to the API!")

urlpatterns = [
    path("", welcome_view, name="welcome"),
    path("admin/", admin.site.urls),
    # Updated the endpoint to match '/api/user/current/'
    path("api/user/current/", get_current_user, name="get_current_user"),
    path("api-auth/", include("rest_framework.urls")),
    
    # Society endpoints
    # path('my-societies/', MySocietiesView.as_view(), name='my_societies'),
    path("join-society/<int:society_id>/", JoinSocietyView.as_view(), name="join_society"),
    path("leave-society/<int:society_id>/", MySocietiesView.as_view(), name="leave_society"),
    
    # Event endpoints
    path("events/rsvp/", RSVPEventView.as_view(), name="rsvp_event"),
    path("events/history/", EventHistoryView.as_view(), name="event_history"),
    
    # Removed direct registration/login paths:
    # path("api/user/register", RegisterView.as_view(), name="register"),
    # path("api/user/login", TokenObtainPairView.as_view(), name="get_token"),
    # path("api/token/refresh", TokenRefreshView.as_view(), name="refresh"),
    
    # Include additional URLs from api/urls.py with the '/api/' prefix
    path("api/", include("api.urls")),
]
