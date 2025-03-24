from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from api.models import AdminReportRequest, ReportReply
from api.serializers import AdminReportRequestSerializer, ReportReplySerializer, PublicReportSerializer
from api.views_files.view_utility import get_admin_if_user_is_admin


def get_report_if_exists(report_id):
    """Returns a report and error if an error is caused"""
    try:
        return AdminReportRequest.objects.get(id=report_id), None
    except AdminReportRequest.DoesNotExist:
        return None, Response(
            {"error": "Report not found"},
            status=status.HTTP_404_NOT_FOUND
        )


class ReportToAdminView(APIView):
    """
    API view for students and society presidents to submit reports to admins and admins receive reports.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Submit a request for an admin to review"""
        serializer = AdminReportRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(from_student=request.user.student)
            return Response({"message": "Report submitted successfully."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, report_id=None):
        """View a report chain"""
        if report_id:
            report, error = get_report_if_exists(report_id)
            if error:
                return error
            serializer = AdminReportRequestSerializer(report)
            return Response(serializer.data, status=status.HTTP_200_OK)

        reports = AdminReportRequest.objects.exclude(
            replies__is_admin_reply=True
        ).order_by("-requested_at")
        serializer = AdminReportRequestSerializer(reports, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ReportReplyView(APIView):
    """
    API view for admins and presidents to reply to reports or other replies.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Reply to a specific report"""
        serializer = ReportReplySerializer(data=request.data)
        if serializer.is_valid():
            report_id = serializer.validated_data.get('report').id
            report = AdminReportRequest.objects.get(id=report_id)

            parent_reply_id = serializer.validated_data.get('parent_reply')

            user = request.user
            is_admin = user.role == "admin" or user.is_super_admin
            is_president = user.role == "president"

            if parent_reply_id is None and not is_admin:
                return Response(
                    {"error": "Only admins or super admins can reply to reports directly."}, 
                    status=status.HTTP_403_FORBIDDEN
                )

            if parent_reply_id:
                parent_reply = ReportReply.objects.get(id=parent_reply_id.id)
                if is_president and not parent_reply.is_admin_reply:
                    return Response({"error": "Presidents can only reply to admin replies."}, 
                                    status=status.HTTP_403_FORBIDDEN)

            reply = serializer.save(
                replied_by=user,
                is_admin_reply=is_admin
            )

            return Response(ReportReplySerializer(reply).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, report_id=None):
        """Get all replies or replies for a specific report"""
        if report_id:
            replies = ReportReply.objects.filter(
                report_id=report_id,
                parent_reply=None
            ).order_by('created_at')
        else:
            replies = ReportReply.objects.all().order_by('created_at')

        serializer = ReportReplySerializer(replies, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MyReportsView(APIView):
    """
    API view for users to view their own submitted reports.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get self submitted reports"""
        reports = AdminReportRequest.objects.filter(from_student=request.user.student).order_by("-requested_at")
        serializer = AdminReportRequestSerializer(reports, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MyReportsWithRepliesView(APIView):
    """
    API view for users to view their own submitted reports with associated replies.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get self submitted reports with their replies"""
        reports = AdminReportRequest.objects.filter(
            from_student=request.user.student
        ).order_by("-requested_at")
        reports_with_replies = []

        for report in reports:
            replies = ReportReply.objects.filter(report=report).order_by('created_at')

            report_data = AdminReportRequestSerializer(report).data
            report_data['replies'] = ReportReplySerializer(replies, many=True).data
            reports_with_replies.append(report_data)

        return Response(reports_with_replies, status=status.HTTP_200_OK)


class AdminReportsWithRepliesView(APIView):
    """
    API view for admins to view reports they've replied to without user response.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        """Gets admins replied to reports"""
        _, error = get_admin_if_user_is_admin(request.user, "access this endpoint")
        if error:
            return error

        all_reports = AdminReportRequest.objects.all().order_by("-requested_at")

        reports_with_admin_replies = []

        for report in all_reports:
            admin_replies = ReportReply.objects.filter(
                report=report,
                is_admin_reply=True
            ).order_by('-created_at')

            if admin_replies.exists():
                latest_admin_reply = admin_replies.first()

                newer_user_replies = ReportReply.objects.filter(
                    report=report,
                    is_admin_reply=False,
                    created_at__gt=latest_admin_reply.created_at
                ).exists()

                if not newer_user_replies:
                    report_data = AdminReportRequestSerializer(report).data
                    all_replies = ReportReply.objects.filter(report=report).order_by('created_at')
                    report_data['replies'] = ReportReplySerializer(all_replies, many=True).data
                    reports_with_admin_replies.append(report_data)

        return Response(reports_with_admin_replies, status=status.HTTP_200_OK)


class ReportThreadView(APIView):
    """
    API view for viewing a complete report thread with hierarchical replies.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, report_id):
        """Gets a report thread"""
        report, error = get_report_if_exists(report_id)
        if error:
            return error

        user = request.user
        is_admin = hasattr(user, 'admin')
        is_creator = hasattr(user, 'student') and user.student == report.from_student

        is_president = False
        if hasattr(user, 'student'):
            is_president = user.student.is_president

        has_replied = ReportReply.objects.filter(
            report=report,
            replied_by=user
        ).exists()

        if not (is_admin or is_creator or is_president or has_replied):
            return Response(
                {"error": "You don't have permission to view this report thread."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        top_replies = ReportReply.objects.filter(
            report=report,
            parent_reply=None
        ).order_by('created_at')

        def get_nested_replies(reply):
            reply_data = ReportReplySerializer(reply).data
            child_replies = ReportReply.objects.filter(parent_reply=reply).order_by('created_at')
            if child_replies.exists():
                reply_data['child_replies'] = [get_nested_replies(child) for child in child_replies]
            else:
                reply_data['child_replies'] = []
            return reply_data

        report_data = AdminReportRequestSerializer(report).data
        report_data['replies'] = [get_nested_replies(reply) for reply in top_replies]

        return Response(report_data, status=status.HTTP_200_OK)

class PublicReportView(APIView):
    """
    Public users can submit reports to admins without requiring login.
    """
    permission_classes = []
    
    def post(self, request):
        """Posts a report from a public user"""
        serializer = PublicReportSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(anonymous_submission=True)
            return Response({"message": "Report submitted successfully. Thank you for your feedback."}, 
                           status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
