from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView, CurrentUserView,
    StudentNotificationsView, StartSocietyRequestView, ManageMySocietyView,
    CreateSocietyEventView, AdminView, StudentView, SocietyView, EventView,
    RejectedSocietyRequestView, SocietyRequestView, DashboardStatsView,
    RecentActivitiesView, NotificationsView, EventCalendarView,
    StudentSocietiesView, JoinSocietyView, RSVPEventView, EventHistoryView
)
from .views import get_popular_societies

urlpatterns = [
    # Authentication endpoints
    path("user/token/refresh", TokenRefreshView.as_view(), name="refresh"),
    path("user/register", RegisterView.as_view(), name="register"),
    path("user/login", TokenObtainPairView.as_view(), name="get_token"),
    path("user/current", CurrentUserView.as_view(), name="current_user"),

    # Notification endpoints
    path('notifications/', StudentNotificationsView.as_view(), name='student_notifications'),
    path('notifications/<int:pk>/', StudentNotificationsView.as_view(), name='mark_notification_read'),

    # Society creation/management endpoints
    path("start-society/", StartSocietyRequestView.as_view(), name="start_society"),
    path('manage-society/<int:society_id>/', ManageMySocietyView.as_view(), name='manage_my_society'),
    path('society/<int:society_id>/create-event/', CreateSocietyEventView.as_view(), name='create_society_event'),

    # User role endpoints
    path("user/admin", AdminView.as_view(), name="admin"),
    path("user/student", StudentView.as_view(), name="student"),

    # Society membership endpoints (incoming)
    path('join-society/<int:society_id>/', JoinSocietyView.as_view(), name='join_society'),  # for PUT requests
    path('join-society/', JoinSocietyView.as_view(), name='join_society'),                    # for GET requests

    # Event endpoints (incoming)
    path('events/rsvp/', RSVPEventView.as_view(), name='rsvp_event'),
    path('events/history/', EventHistoryView.as_view(), name='event_history'),

    # Admin panel endpoints
    path("admin-panel/society", SocietyView.as_view(), name="admin"),
    path("society/event", EventView.as_view(), name="event"),
    path("admin-panel/rejected-society", RejectedSocietyRequestView.as_view(), name="rejected_society"),
    path("society/request/pending", SocietyRequestView.as_view(), name="request_society"),
    path("society/request/pending/<int:society_id>", SocietyRequestView.as_view(), name="request_society"),

    # Student societies endpoints (incoming)
    path('student-societies/', StudentSocietiesView.as_view(), name='student_societies'),
    path('leave-society/<int:society_id>/', StudentSocietiesView.as_view(), name='leave_society'),

    # Dashboard API endpoints
    path("dashboard/stats/", DashboardStatsView.as_view(), name="dashboard_stats"),
    path("dashboard/activities/", RecentActivitiesView.as_view(), name="recent_activities"),
    path("dashboard/notifications/", NotificationsView.as_view(), name="dashboard_notifications"),
    path("dashboard/events/", EventCalendarView.as_view(), name="dashboard_events"),
    path('popular-societies/', get_popular_societies, name='popular_societies'),
]