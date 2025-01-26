from django.urls import path
from . import views
from .views import *
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


urlpatterns = [
    path("user/token/refresh", TokenRefreshView.as_view(), name="refresh"),
    path("user/register", RegisterView.as_view(), name="register"),
    path("user/login", TokenObtainPairView.as_view(), name="get_token"),
    path("user/current", CurrentUserView.as_view(), name="current_user"),
    path('notifications/', StudentNotificationsView.as_view(), name='student_notifications'),
    path('notifications/<int:pk>/', StudentNotificationsView.as_view(), name='mark_notification_read'),
    path("start-society/", StartSocietyRequestView.as_view(), name="start_society"),
    path('manage-society/<int:society_id>/', ManageMySocietyView.as_view(), name='manage_my_society'),
    path('society/<int:society_id>/create-event/', CreateSocietyEventView.as_view(), name='create_society_event'),
    path("user/admin", AdminView.as_view(), name="admin"),
    # path('user/admin/', AdminView.as_view(), name='create_admin'),
    path("user/student", StudentView.as_view(), name="student"),
    path("admin-panel/society", SocietyView.as_view(), name="admin"),
    path("society/event", EventView.as_view(), name="event"),
    path("admin-panel/rejected-society", RejectedSocietyRequestView.as_view(), name="rejected_society"),
    path("society/request/pending", SocietyRequestView.as_view(), name="request_society"),
    path("society/request/pending/<int:society_id>", SocietyRequestView.as_view(), name="request_society"),

    #     REJECTEDSOCIETY: "api/admin-panel/rejected-society",
]
