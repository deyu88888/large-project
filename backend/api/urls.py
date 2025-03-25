from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from api.views import (
    # Authentication & Users
    RegisterView, CurrentUserView, MyProfileView, toggle_follow,

    # Admin
    AdminListView, AdminStudentListView, AdminDeleteView, AdminRestoreView,
    AdminActivityLogView, AdminManageStudentDetailsView, AdminManageSocietyDetailsView,
    AdminManageEventDetailsView, AdminEventRequestView, AdminEventView,
    AdminSocietyRequestView, SocietyDescriptionRequestAdminView, AdminNewsApprovalView,
    AdminRepliesListView, AdminReportsWithRepliesView,

    # Society
    JoinedSocietiesView, RequestJoinSocietyView, StartSocietyRequestView,
    ManageSocietyDetailsView, StudentSocietyDataView, SocietyMembersListView,
    PendingMembersView, SocietyRoleManagementView, get_popular_societies, get_upcoming_events,
    RecommendedSocietiesView, SocietyRecommendationExplanationView,
    RecommendationFeedbackView, RecommendationFeedbackAnalyticsView, PublicSocietiesView,

    # Events
    ManageEventListView, CreateEventRequestView, RSVPEventView, EventHistoryView,
    get_sorted_events, AllEventsView, EventDetailsView, EventCommentsView,
    ManageEventDetailsView, like_comment, dislike_comment, JoinedEventsView,

    # News
    NewsView, BroadcastListAPIView, NewsPublicationRequestView,

    # Notifications & Messages
    StudentNotificationsView, NotificationsView, StudentInboxView,

    # Reports
    ReportToAdminView, ReportReplyView, MyReportsView, MyReportsWithRepliesView,
    ReportThreadView, ReportReplyNotificationsView, PublicReportView,
    
    # Dashboard
    DashboardStatsView, RecentActivitiesView, EventCalendarView,

    # Awards
    AwardView, AwardStudentView,

    # Utilities
    custom_media_view, SearchView, PendingJoinRequestsView,

    #Recommendation System
    RecommendedSocietiesView, SocietyRecommendationExplanationView, RecommendationFeedbackView, RecommendationFeedbackAnalyticsView 
)
from .utils import request_otp, verify_otp

from .news_views import (
    SocietyNewsListView, SocietyNewsDetailView, NewsCommentView,
    NewsCommentDetailView, NewsCommentLikeView, MemberNewsView,
    NewsCommentDislikeView
)

# Authentication & User management
auth_patterns = [
    path("token/refresh", TokenRefreshView.as_view(), name="refresh"),
    path("register", RegisterView.as_view(), name="register"),
    path("login", TokenObtainPairView.as_view(), name="get_token"),
    path("current/", CurrentUserView.as_view(), name="current_user"),
]

# User profile patterns
profile_patterns = [
    path("<int:user_id>/follow", toggle_follow, name="toggle_follow"),
    path("<int:user_id>", MyProfileView.as_view(), name="user_profile"),
]

# Admin management patterns
admin_patterns = [
    path("admin", AdminListView.as_view(), name="admin"),
    path("student", AdminStudentListView.as_view(), name="student"),
    path("society/event/<str:event_status>", AdminEventView.as_view(), name="event"),
    path("society/event/request/<int:event_id>", AdminEventRequestView.as_view(), name="request_event"),
    path("society/request/<str:society_status>", AdminSocietyRequestView.as_view(), name="request_society"),
    path("society/request/pending/<int:society_id>", AdminSocietyRequestView.as_view(), name="request_society"),
    path("description/request/pending", SocietyDescriptionRequestAdminView.as_view(), name="request_description"),
    path("manage-society/<int:society_id>", AdminManageSocietyDetailsView.as_view(), name="manage_society_details_admin"),
    path("manage-student/<int:student_id>", AdminManageStudentDetailsView.as_view(), name="manage_student_details_admin"),
    path("manage-event/<int:event_id>", AdminManageEventDetailsView.as_view(), name="manage_event_details_admin"),
    path("activity-log", AdminActivityLogView.as_view(), name="activity_log"),
    path("delete-activity-log/<int:log_id>", AdminActivityLogView.as_view(), name="delete_activity_log"),
    path('delete/<str:target_type>/<int:target_id>', AdminDeleteView.as_view(), name='delete'),
    path('restore/<int:log_id>', AdminRestoreView.as_view(), name='restore'),
    path('undo-delete/<int:log_id>', AdminDeleteView.as_view(), name='undo-delete'),

    # Student societies endpoints
    path("student-societies/", JoinedSocietiesView.as_view(), name="student_societies"),
    path("leave-society/<int:society_id>/", JoinedSocietiesView.as_view(), name="leave_society"),
    path("society-view/<int:society_id>/", StudentSocietyDataView.as_view(), name="society_view"),
    path('media/<path:path>', custom_media_view, name="media"),
    path('api/pending-requests/', PendingJoinRequestsView.as_view(), name='pending-requests'),

    # Dashboard API endpoints
    path("dashboard/stats/", DashboardStatsView.as_view(), name="dashboard_stats"),
    path("dashboard/activities/", RecentActivitiesView.as_view(), name="recent_activities"),
    path("dashboard/notifications", NotificationsView.as_view(), name="dashboard_notifications"),
    path("dashboard/events/", EventCalendarView.as_view(), name="dashboard_events"),

    # Awards Endpoints
    path("awards/", AwardView.as_view(), name="awards"),  # List & Create Awards
    path("awards/<int:pk>/", AwardView.as_view(), name="award_detail"),  # Retrieve, Update, Delete Award

    # Award-Student Endpoints
    path("award-students/", AwardStudentView.as_view(), name="award_students"),  # List & Assign Awards to Students
    path("award-students/<int:pk>/", AwardStudentView.as_view(), name="award_student_detail"),  # Retrieve, Update, Delete Assignment

    # President page
    path("society/<int:society_id>/pending-members/", PendingMembersView.as_view(), name="pending-members"),
    path("society/<int:society_id>/pending-members/<int:request_id>/", PendingMembersView.as_view(), name="process-pending-member"),
    path("society/<int:society_id>/members/", SocietyMembersListView.as_view(), name="society-members"),
    path("society-roles/<int:society_id>/", SocietyRoleManagementView.as_view(), name="society-members"),

    # Report to admin
    path("report-to-admin", ReportToAdminView.as_view(), name="report-to-admin"),
    path("report-to-admin/<int:report_id>", ReportToAdminView.as_view(), name="report-to-admin-detail"),
    path("my-reports", MyReportsView.as_view(), name='my_reports'),
    path('my-reports-with-replies', MyReportsWithRepliesView.as_view(), name='my_reports_with_replies'),
    path("report-replies", ReportReplyView.as_view(), name="report-replies"),
    path("report-replies/<int:report_id>", ReportReplyView.as_view(), name="report-replies-by-report"),
    path('report-thread/<int:report_id>', ReportThreadView.as_view(), name='report_thread'),
    path("reports-replied", AdminReportsWithRepliesView.as_view(), name="report_replied"),
    path("reports-with-replies", AdminRepliesListView.as_view(), name="reports_with_replies"),
    path('report-reply-notifications', ReportReplyNotificationsView.as_view(), name='report-reply-notifications'),
    path('report-reply-notifications/<int:reply_id>', ReportReplyNotificationsView.as_view(), name='mark-report-reply-read'),
    path('news/publication-request/<int:request_id>/', AdminNewsApprovalView.as_view(), name='admin_news_approval'),
]

# Society patterns
society_patterns = [
    path("start", StartSocietyRequestView.as_view(), name="start_society"),
    path("manage/<int:society_id>/", ManageSocietyDetailsView.as_view(), name="manage_society_details"),
    path("joined/", JoinedSocietiesView.as_view(), name="student_societies"),
    path("leave/<int:society_id>/", JoinedSocietiesView.as_view(), name="leave_society"),
    path("view/<int:society_id>/", StudentSocietyDataView.as_view(), name="society_view"),
    path("<int:society_id>/pending-members/", PendingMembersView.as_view(), name="pending-members"),
    path("<int:society_id>/pending-members/<int:request_id>/", PendingMembersView.as_view(), name="process-pending-member"),
    path("<int:society_id>/members/", SocietyMembersListView.as_view(), name="society-members"),
    path("<int:society_id>/roles/", SocietyRoleManagementView.as_view(), name="society-roles"),
    path('join/<int:society_id>/', RequestJoinSocietyView.as_view(), name='join_society'),
    path('join/', RequestJoinSocietyView.as_view(), name='join_society'),
    path("popular", get_popular_societies, name="popular_societies"),
    path("<int:society_id>/news/", SocietyNewsListView.as_view(), name="society_news_list"),
]

# Recommendations patterns
recommendation_patterns = [
    path("", RecommendedSocietiesView.as_view(), name="recommended_societies"),
    path("<int:society_id>/explanation/", SocietyRecommendationExplanationView.as_view(), name="society_recommendation_explanation"),
    path("feedback/", RecommendationFeedbackView.as_view(), name="recommendation_feedback_list"),
    path("<int:society_id>/feedback/", RecommendationFeedbackView.as_view(), name="recommendation_feedback_detail"),
    path("feedback/analytics/", RecommendationFeedbackAnalyticsView.as_view(), name="recommendation_feedback_analytics"),
]

# Event patterns
event_patterns = [
    path("requests/<int:society_id>/", CreateEventRequestView.as_view(), name="create-event-request"),
    path("joined/", JoinedEventsView.as_view(), name="joined-events"),
    path("list/", ManageEventListView.as_view(), name="event-list"),
    path("rsvp/", RSVPEventView.as_view(), name="rsvp_event"),
    path("history/", EventHistoryView.as_view(), name="event_history"),
    path("sorted/", get_sorted_events, name="sorted_events"),
    path("all/", AllEventsView.as_view(), name="all_events"),
    path("<int:event_id>/", EventDetailsView.as_view(), name="event_detail"),
    path("<int:event_id>/comments/", EventCommentsView.as_view(), name="event_comments"),
    path("<int:event_id>/manage/", ManageEventDetailsView.as_view(), name="manage_event_detail"),
]

# Comment patterns
comment_patterns = [
    path("", EventCommentsView.as_view(), name="comment_list_create"),
    path("<int:comment_id>/like/", like_comment, name="like_comment"),
    path("<int:comment_id>/dislike/", dislike_comment, name="dislike_comment"),
]

# News patterns
news_patterns = [
    path("", NewsView.as_view(), name="news"),
    path("<int:pk>/", NewsView.as_view(), name="mark_news_read"),
    path("get/", BroadcastListAPIView.as_view(), name="get-news"),
    path("<int:news_id>/detail/", SocietyNewsDetailView.as_view(), name="society_news_detail"),
    path("<int:news_id>/comments/", NewsCommentView.as_view(), name="news_comments"),
    path("feed/", MemberNewsView.as_view(), name="member_news_feed"),
    path('publication-request/', NewsPublicationRequestView.as_view(), name='news_publication_request'),
]

# News comments patterns
news_comment_patterns = [
    path("<int:comment_id>/", NewsCommentDetailView.as_view(), name="news_comment_detail"),
    path("<int:comment_id>/like/", NewsCommentLikeView.as_view(), name="news_comment_like"),
    path("<int:comment_id>/dislike/", NewsCommentDislikeView.as_view(), name="news_comment_dislike"),
]

# Notification patterns
notification_patterns = [
    path("", StudentNotificationsView.as_view(), name="student_notifications"),
    path("<int:pk>/", StudentNotificationsView.as_view(), name="mark_notification_read"),
    path("inbox/", StudentInboxView.as_view(), name="student_inbox"),
    path('inbox/<int:notification_id>/', StudentInboxView.as_view(), name='student-inbox-delete'),
]

# Report patterns
report_patterns = [
    path("to-admin/", ReportToAdminView.as_view(), name="report-to-admin"),
    path("to-admin/<int:report_id>/", ReportToAdminView.as_view(), name="report-to-admin-detail"),
    path("my/", MyReportsView.as_view(), name='my_reports'),
    path('my-with-replies/', MyReportsWithRepliesView.as_view(), name='my_reports_with_replies'),
    path("replies/", ReportReplyView.as_view(), name="report-replies"),
    path("replies/<int:report_id>/", ReportReplyView.as_view(), name="report-replies-by-report"),
    path('thread/<int:report_id>/', ReportThreadView.as_view(), name='report_thread'),
    path('reply-notifications/', ReportReplyNotificationsView.as_view(), name='report-reply-notifications'),
    path('reply-notifications/<int:reply_id>/', ReportReplyNotificationsView.as_view(), name='mark-report-reply-read'),
]

# Dashboard patterns
dashboard_patterns = [
    path("stats/", DashboardStatsView.as_view(), name="dashboard_stats"),
    path("activities/", RecentActivitiesView.as_view(), name="recent_activities"),
    path("notifications/", NotificationsView.as_view(), name="dashboard_notifications"),
    path("events/", EventCalendarView.as_view(), name="dashboard_events"),
    path('all-societies', PublicSocietiesView.as_view(), name='all_societies'),
    path("public-report", PublicReportView.as_view(), name="public-report"),
    path("popular-societies/", get_popular_societies, name="popular_societies"),
    path('events/upcoming/', get_upcoming_events, name='upcoming_events'),
]

# Award patterns
award_patterns = [
    path("", AwardView.as_view(), name="awards"),
    path("<int:pk>/", AwardView.as_view(), name="award_detail"),
    path("students/", AwardStudentView.as_view(), name="award_students"),
    path("students/<int:pk>/", AwardStudentView.as_view(), name="award_student_detail"),
]

# Verification patterns
verification_patterns = [
    path("request-otp", request_otp, name="request_otp"),
    path("verify-otp", verify_otp, name="verify_otp"),
]

# Main URL patterns
urlpatterns = [
    # Include grouped URL patterns
    path("user/", include(auth_patterns)),
    path("users/", include(profile_patterns)),
    path("admin/", include(admin_patterns)),
    path("society/", include(society_patterns)),
    path("recommendations/", include(recommendation_patterns)),
    path("events/", include(event_patterns)),
    path("comments/", include(comment_patterns)),
    path("news/", include(news_patterns)),
    path("news/comments/", include(news_comment_patterns)),
    path("notifications/", include(notification_patterns)),
    path("reports/", include(report_patterns)),
    path("dashboard/", include(dashboard_patterns)),
    path("awards/", include(award_patterns)),
    path("verification/", include(verification_patterns)),

    # Standalone URLs
    path('media/<path:path>/', custom_media_view, name="media"),
    path('api/pending-requests/', PendingJoinRequestsView.as_view(), name='pending-requests'),
    path("search/", SearchView.as_view(), name="search"),
]