from django.utils.timezone import now
from django.db.models import Q
from rest_framework import  status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from api.models import Notification, ReportReply, AdminReportRequest
from api.serializers import RecentActivitySerializer, DashboardNotificationSerializer,\
    NotificationSerializer


class RecentActivitiesView(APIView):
    """
    View to provide a list of recent activities for the dashboard.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Gets a list of most recent activities"""
        activities = [
            {"description": "John Doe joined the Chess Society", "timestamp": now()},
            {"description": "A new event was created: 'AI Workshop'", "timestamp": now()},
        ]

        serializer = RecentActivitySerializer(activities, many=True)
        return Response(serializer.data, status=200)


class NotificationsView(APIView):
    """
    View to provide notifications for the logged-in user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Gets the current users notifications"""
        if request.user.role != "student":
            return Response({"error": "Only students can view notifications."}, status=403)

        notifications = Notification.objects.filter(for_user=request.user).order_by("-id")
        notifications = [n for n in notifications if n.is_sent()]
        serializer = DashboardNotificationSerializer(notifications, many=True)
        return Response(serializer.data, status=200)


class ReportReplyNotificationsView(APIView):
    """
    student notifications for replies to their reports
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Gets the students notifications specifically in response to reports"""
        student = request.user.student

        student_reports = AdminReportRequest.objects.filter(from_student=student)
        replies = ReportReply.objects.filter(
            report__in=student_reports
        ).filter(
            Q(replied_by__role="admin") | Q(replied_by__is_super_admin=True)
        ).exclude(
            hidden_for_students=request.user
        ).order_by('-created_at')

        notifications = []
        for reply in replies:
            replier_name = reply.replied_by.get_full_name() if reply.replied_by else "Admin"
            is_read = request.user in reply.read_by_students.all()
            notifications.append({
                'id': reply.id,
                'report_id': reply.report.id,
                'header': "New Reply to Your Report",
                'body': (f"{replier_name} replied to your report regarding "
                    f"{reply.report.report_type}"),
                'created_at': reply.created_at,
                'is_read': is_read,
                'type': "report_reply",
                'content_preview': (reply.content[:100] + "..." 
                    if len(reply.content) > 100 else reply.content)
            })

        return Response(notifications, status=status.HTTP_200_OK)

    def patch(self, request, reply_id):
        """
        Mark a specific reply as read
        """
        try:
            student = request.user.student     
            reply = ReportReply.objects.get(
                id=reply_id,
                report__from_student=student
            )
            reply.read_by_students.add(request.user)

            return Response({"status": "success"}, status=status.HTTP_200_OK)
        except ReportReply.DoesNotExist:
            return Response(
                {"error": "Reply not found or not authorized"},
                status=status.HTTP_404_NOT_FOUND
            )

    def delete(self, request, reply_id):
        """
        Delete a notification for a specific reply (remove from student's view)
        """
        try:
            student = request.user.student
            reply = ReportReply.objects.get(
                id=reply_id,
                report__from_student=student
            )
            reply.hidden_for_students.add(request.user)

            return Response(status=status.HTTP_204_NO_CONTENT)
        except ReportReply.DoesNotExist:
            return Response(
                {"error": "Reply not found or not authorized"},
                status=status.HTTP_404_NOT_FOUND
            )


class StudentNotificationsView(APIView):
    """
    View to retrieve and update notifications for a student.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get notifications for the current user"""
        user = request.user
        notifications = Notification.objects.filter(for_user=user)
        notifications = [n for n in notifications if n.is_sent()]

        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        """Marks a notification as read"""
        if not hasattr(request.user, 'student'):
            return Response(
                {"error": "Only students can mark notifications as read."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            notification = Notification.objects.get(id=pk, for_user=request.user.student)
        except Notification.DoesNotExist:
            return Response({"error": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)

        notification.is_read = True
        notification.save()

        return Response(
            {"message": "Notification marked as read.", "id": pk},
            status=status.HTTP_200_OK
        )


class StudentInboxView(StudentNotificationsView):
    """
    View to retrieve, update, and delete important notifications for a student.
    """
    def get(self, request):
        """Retrieves notifications marked 'is_important'"""
        user = request.user
        notifications = Notification.objects.filter(for_user=user, is_important=True)
        notifications = [n for n in notifications if n.is_sent()]
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, notification_id):
        """Deletes notifications the user has read"""
        try:
            user = request.user
            notification = Notification.objects.get(id=notification_id, for_user=user)
            notification.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Notification.DoesNotExist:
            return Response(
                {"error": "Notification not found or not authorized"},
                status=status.HTTP_404_NOT_FOUND
            )
