from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    AdminReportView, AwardStudentView, AwardView, BroadcastListAPIView, EventListView, AdminEventRequestView, ManageEventDetailsView, NewsView, PendingMembersView, PendingRequestsView, RegisterView,
    CurrentUserView, SocietyMembersListView,
    StudentNotificationsView, StartSocietyRequestView, ManageSocietyDetailsView, StudentInboxView,
    AdminView, StudentView, AdminEventView,
    AdminSocietyRequestView, DashboardStatsView,
    RecentActivitiesView, NotificationsView, EventCalendarView,
    StudentSocietiesView, JoinSocietyView, RSVPEventView, EventHistoryView,
    get_popular_societies, CreateEventRequestView, custom_media_view, get_sorted_events, StudentSocietyDataView,
    AllEventsView, EventDetailView, EventCommentsView, AdminDescriptionRequestView, AdminManageSocietyDetailsAdminView, 
    like_comment, dislike_comment, EventCommentsView, toggle_follow, StudentProfileView, AdminRepliesListView,
    AdminActivityLogView, AdminManageEventDetailsAdminView, AdminDeleteView, AdminManageStudentDetailsAdminView, ReportReplyView, 
    MyReportsView, MyReportsWithRepliesView, ReportThreadView, AdminReportsWithRepliesView, ReportReplyNotificationsView)
    AdminReportView, AwardStudentView, AwardView, BroadcastListAPIView, EventListView, EventRequestView,
    ManageEventDetailsView, NewsView, PendingMembersView, PendingRequestsView, RegisterView,
    CurrentUserView, SocietyMembersListView, StudentNotificationsView, StartSocietyRequestView,
    ManageSocietyDetailsView, StudentInboxView, AdminView, StudentView, EventView, SocietyRequestView,
    DashboardStatsView, RecentActivitiesView, NotificationsView, EventCalendarView,
    StudentSocietiesView, JoinSocietyView, RSVPEventView, EventHistoryView, get_popular_societies,
    CreateEventRequestView, custom_media_view, get_sorted_events, StudentSocietyDataView,
    AllEventsView, EventDetailView, DescriptionRequestView, toggle_follow, StudentProfileView,
    like_comment, dislike_comment, EventCommentsView, NewsPublicationRequestView,
    AdminNewsApprovalView, ManageSocietyDetailsAdminView, AdminRepliesListView,
    ActivityLogView, ManageEventDetailsAdminView, DeleteView, ManageStudentDetailsAdminView, ReportReplyView,
    MyReportsView, MyReportsWithRepliesView, ReportThreadView, AdminReportsWithRepliesView, ReportReplyNotificationsView,
    SearchView
)
from .utils import request_otp, verify_otp
from .recommendation_views import RecommendedSocietiesView, SocietyRecommendationExplanationView
from .recommendation_feedback_views import RecommendationFeedbackView, RecommendationFeedbackAnalyticsView

# Import your updated news_views including the new 'NewsCommentDislikeView'
from .news_views import (
    SocietyNewsListView,
    SocietyNewsDetailView,
    NewsCommentView,
    NewsCommentDetailView,
    NewsCommentLikeView,
    MemberNewsView,
    # New import for the comment dislike endpoint:
    NewsCommentDislikeView
)

urlpatterns = [
    # Authentication endpoints
    path("user/token/refresh", TokenRefreshView.as_view(), name="refresh"),
    path("user/register", RegisterView.as_view(), name="register"),
    path("user/login", TokenObtainPairView.as_view(), name="get_token"),
    path("user/current/", CurrentUserView.as_view(), name="current_user"),  # TODO: trailing backshlash needed

    # OTP verification
    path("request-otp", request_otp, name="request_otp"),
    path("verify-otp", verify_otp, name="verify_otp"),

    # Notification endpoints
    path("notifications/", StudentNotificationsView.as_view(), name="student_notifications"), # trailing slash needed
    path("notifications/<int:pk>", StudentNotificationsView.as_view(), name="mark_notification_read"),
    path("inbox/", StudentInboxView.as_view(), name="student_inbox"),

    path('inbox/<int:notification_id>', StudentInboxView.as_view(), name='student-inbox-delete'),
    path('report-reply-notifications/<int:reply_id>', ReportReplyNotificationsView.as_view(), name='report-reply-notifications-detail'),

    # Society creation/management endpoints
    path("start-society", StartSocietyRequestView.as_view(), name="start_society"),
    path("manage-society-details/<int:society_id>/", ManageSocietyDetailsView.as_view(), name="manage_society_details"),
    path("event-requests/<int:society_id>/", CreateEventRequestView.as_view(), name="create-event-request"),
    path("events/", EventListView.as_view(), name="event-list"),

    # User role endpoints
    path("user/admin", AdminView.as_view(), name="admin"),
    path("user/student", StudentView.as_view(), name="student"),
  
    # Society membership endpoints
    path('join-society/<int:society_id>/', JoinSocietyView.as_view(), name='join_society'),
    path('join-society/', JoinSocietyView.as_view(), name='join_society'),

    # Event endpoints
    path("events/rsvp/", RSVPEventView.as_view(), name="rsvp_event"),
    path("events/history", EventHistoryView.as_view(), name="event_history"),
    path("events", get_sorted_events, name="sorted_events"),

    # Admin panel endpoints
    # path("admin-panel/society", SocietyView.as_view(), name="admin"),
    # path("society/event/<str:event_status>", EventView.as_view(), name="event"),
    path("society/event/<str:event_status>", AdminEventView.as_view(), name="event"),
    path("society/event/request/<int:event_id>", AdminEventRequestView.as_view(), name="request_event"),
    # path("societyrejected-event", EventView.as_view(), name="event"), // not used, remove after
    # path("admin-panel/rejected-society", RejectedSocietyRequestView.as_view(), name="rejected_society"),  # refactored
    path("society/request/<str:society_status>", AdminSocietyRequestView.as_view(), name="request_society"),
    path("society/request/pending/<int:society_id>", AdminSocietyRequestView.as_view(), name="request_society"),

    path("description/request/pending", AdminDescriptionRequestView.as_view(), name="request_description"),
    path("admin-manage-society-details/<int:society_id>", AdminManageSocietyDetailsAdminView.as_view(), name="manage_society_details_admin"),
    path("admin-manage-student-details/<int:student_id>", AdminManageStudentDetailsAdminView.as_view(), name="manage_student_details_admin"),
    path("admin-manage-event-details/<int:event_id>", AdminManageEventDetailsAdminView.as_view(), name="manage_event_details_admin"),
    path("activity-log", AdminActivityLogView.as_view(), name="activity_log"),
    path("delete-activity-log/<int:log_id>", AdminActivityLogView.as_view(), name="delete_activity_log"),

    path('delete/<str:target_type>/<int:target_id>', AdminDeleteView.as_view(), name='delete'),
    path('undo-delete/<int:log_id>', AdminDeleteView.as_view(), name='undo-delete'),

    # Student societies endpoints
    path("student-societies/", StudentSocietiesView.as_view(), name="student_societies"),
    path("leave-society/<int:society_id>/", StudentSocietiesView.as_view(), name="leave_society"),
    path("society-view/<int:society_id>/", StudentSocietyDataView.as_view(), name="society_view"),
    path('media/<path:path>', custom_media_view, name="media"),
    path('api/pending-requests/', PendingRequestsView.as_view(), name='pending-requests'),

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
    path("report-to-admin/<int:report_id>", AdminReportView.as_view(), name="report-to-admin-detail"),
    path("my-reports", MyReportsView.as_view(), name='my_reports'),
    path('my-reports-with-replies', MyReportsWithRepliesView.as_view(), name='my_reports_with_replies'),
    path("report-replies", ReportReplyView.as_view(), name="report-replies"),
    path("report-replies/<int:report_id>", ReportReplyView.as_view(), name="report-replies-by-report"),
    path('report-thread/<int:report_id>', ReportThreadView.as_view(), name='report_thread'),
    path("reports-replied", AdminReportsWithRepliesView.as_view(), name="report_replied"),
    path("reports-with-replies", AdminRepliesListView.as_view(), name="reports_with_replies"),
    path('report-reply-notifications', ReportReplyNotificationsView.as_view(), name='report-reply-notifications'),
    path('report-reply-notifications/<int:reply_id>', ReportReplyNotificationsView.as_view(), name='mark-report-reply-read'),

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

    # search engine
    path("search/", SearchView.as_view(), name="search"),

    path("society/<int:society_id>/news/", SocietyNewsListView.as_view(), name="society_news_list"),
    path("news/<int:news_id>/", SocietyNewsDetailView.as_view(), name="society_news_detail"),
    path("news/<int:news_id>/comments/", NewsCommentView.as_view(), name="news_comments"),
    path("news/comments/<int:comment_id>/", NewsCommentDetailView.as_view(), name="news_comment_detail"),
    path("news/comments/<int:comment_id>/like/", NewsCommentLikeView.as_view(), name="news_comment_like"),
    # ADD THIS (similar to your like path):
    path("news/comments/<int:comment_id>/dislike/", NewsCommentDislikeView.as_view(), name="news_comment_dislike"),

    # This is the "feed" for the student's societies:
    path("my-news-feed/", MemberNewsView.as_view(), name="member_news_feed"),

    path('news/publication-request/', NewsPublicationRequestView.as_view(), name='news_publication_request'),
    path('news/publication-request/<int:request_id>/', AdminNewsApprovalView.as_view(), name='admin_news_approval'),
]