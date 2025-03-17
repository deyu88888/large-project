from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    AdminReportView, AwardStudentView, AwardView, BroadcastListAPIView, EventListView, EventRequestView, ManageEventDetailsView, NewsView, PendingMembersView, RegisterView,
    CurrentUserView, SocietyMembersListView,
    StudentNotificationsView, StartSocietyRequestView, ManageSocietyDetailsView,
    AdminView, StudentView, EventView,
    SocietyRequestView, DashboardStatsView,
    RecentActivitiesView, NotificationsView, EventCalendarView,
    StudentSocietiesView, JoinSocietyView, RSVPEventView, EventHistoryView,
    get_popular_societies, CreateEventRequestView, custom_media_view, get_sorted_events, StudentSocietyDataView,
    AllEventsView, EventDetailView, DescriptionRequestView, toggle_follow, StudentProfileView,
    like_comment, dislike_comment, EventCommentsView
)
from .utils import request_otp, verify_otp
from .recommendation_views import RecommendedSocietiesView, SocietyRecommendationExplanationView
from .recommendation_feedback_views import RecommendationFeedbackView, RecommendationFeedbackAnalyticsView


urlpatterns = [
    # Authentication endpoints
    path("user/token/refresh", TokenRefreshView.as_view(), name="refresh"),
    path("user/register", RegisterView.as_view(), name="register"),
    path("user/login", TokenObtainPairView.as_view(), name="get_token"),
    path("user/current", CurrentUserView.as_view(), name="current_user"),

    # OTP verification
    path("request-otp", request_otp, name="request_otp"),
    path("verify-otp", verify_otp, name="verify_otp"),

    # Notification endpoints
    # trailing backshlash needed in this case, because of the following line
    path("notifications/", StudentNotificationsView.as_view(), name="student_notifications"), # trailing backshlash needed
    path("notifications/<int:pk>", StudentNotificationsView.as_view(), name="mark_notification_read"),

    # Society creation/management endpoints
    path("start-society", StartSocietyRequestView.as_view(), name="start_society"),
    path("manage-society-details/<int:society_id>/", ManageSocietyDetailsView.as_view(), name="manage_society_details"),
    path("event-requests/<int:society_id>/", CreateEventRequestView.as_view(), name="create-event-request"),
    path("events/", EventListView.as_view(), name="event-list"),

    # User role endpoints
    path("user/admin-panel/", AdminView.as_view(), name="admin"),
    path("user/student", StudentView.as_view(), name="student"),
  
  # Society membership endpoints
    path('join-society/<int:society_id>/', JoinSocietyView.as_view(), name='join_society'),
    path('join-society/', JoinSocietyView.as_view(), name='join_society'),

    # Event endpoints
    path("events/rsvp/", RSVPEventView.as_view(), name="rsvp_event"), # TODO: trailing backshlash needed, do not remove
    path("events/history", EventHistoryView.as_view(), name="event_history"),
    path("events", get_sorted_events, name="sorted_events"),

    # Admin panel endpoints
    # path("admin-panel/society", SocietyView.as_view(), name="admin"),
    path("society/event/<str:event_status>", EventView.as_view(), name="event"),
    path("society/event/request/<int:event_id>", EventRequestView.as_view(), name="request_event"),
    # path("societyrejected-event", EventView.as_view(), name="event"), // not used, remove after
    # path("admin-panel/rejected-society", RejectedSocietyRequestView.as_view(), name="rejected_society"),  # refactored
    path("society/request/<str:society_status>", SocietyRequestView.as_view(), name="request_society"),
    path("society/request/pending/<int:society_id>", SocietyRequestView.as_view(), name="request_society"),

    path("description/request/pending", DescriptionRequestView.as_view(), name="request_description"),

    # Student societies endpoints
    path("student-societies/", StudentSocietiesView.as_view(), name="student_societies"),
    path("leave-society/<int:society_id>/", StudentSocietiesView.as_view(), name="leave_society"),
    path("society-view/<int:society_id>/", StudentSocietyDataView.as_view(), name="society_view"),
    path('media/<path:path>', custom_media_view, name="media"),

    # Dashboard API endpoints
    path("dashboard/stats/", DashboardStatsView.as_view(), name="dashboard_stats"),
    path("dashboard/activities/", RecentActivitiesView.as_view(), name="recent_activities"),
    path("dashboard/notifications", NotificationsView.as_view(), name="dashboard_notifications"),
    path("dashboard/events/", EventCalendarView.as_view(), name="dashboard_events"),
    path("popular-societies", get_popular_societies, name="popular_societies"),
    
    # Awards Endpoints
    path("awards/", AwardView.as_view(), name="awards"),  # List & Create Awards
    path("awards/<int:pk>/", AwardView.as_view(), name="award_detail"),  # Retrieve, Update, Delete Award

    # Award-Student Endpoints
    path("award-students", AwardStudentView.as_view(), name="award_students"),  # List & Assign Awards to Students
    path("award-students/<int:pk>", AwardStudentView.as_view(), name="award_student_detail"),  # Retrieve, Update, Delete Assignment
    
    # President page
    path("society/<int:society_id>/pending-members/", PendingMembersView.as_view(), name="pending-members"),
    path("society/<int:society_id>/pending-members/<int:request_id>/", PendingMembersView.as_view(), name="process-pending-member"),
    path("society/<int:society_id>/members/", SocietyMembersListView.as_view(), name="society-members"),

    # Report to admin
    path("report-to-admin", AdminReportView.as_view(), name="report-to-admin"),

    # Events page
    path("all-events", AllEventsView.as_view(), name="all_events"),
    path("event/<int:event_id>", EventDetailView.as_view(), name="event_detail"),
    path("event/<int:event_id>/comments", EventCommentsView.as_view(), name="event_comments"),
    path("event/<int:event_id>/manage/", ManageEventDetailsView.as_view(), name="manage_event_detail"),
    path("comments/", EventCommentsView.as_view(), name="comment_list_create"),
    path("comments/<int:comment_id>/like", like_comment, name="like_comment"),
    path("comments/<int:comment_id>/dislike", dislike_comment, name="dislike_comment"),

    # Follow
    path("users/<int:user_id>/follow", toggle_follow, name="toggle_follow"),
    path("users/<int:user_id>", StudentProfileView.as_view(), name="user_profile"),
    
    # Society recommendation endpoints
    path("recommended-societies/", RecommendedSocietiesView.as_view(), name="recommended_societies"),
    path("society-recommendation/<int:society_id>/explanation/", SocietyRecommendationExplanationView.as_view(), name="society_recommendation_explanation"),
    
    # Recommendation feedback endpoints
    path("society-recommendation/feedback/", RecommendationFeedbackView.as_view(), name="recommendation_feedback_list"),
    path("society-recommendation/<int:society_id>/feedback/", RecommendationFeedbackView.as_view(), name="recommendation_feedback_detail"),
    path("recommendation-feedback/analytics/", RecommendationFeedbackAnalyticsView.as_view(), name="recommendation_feedback_analytics"),

    # news
    path("news/", NewsView.as_view(), name="news"),
    path("news/<int:pk>", NewsView.as_view(), name="mark_news_read"),   # TODO: implement this later
    path("get-news/", BroadcastListAPIView.as_view(), name="get-news"),
]