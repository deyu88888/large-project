from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from api.models import User, Student, AdminReportRequest, ReportReply
from django.utils import timezone

class TestAdminRepliesListView(APITestCase):
    def setUp(self):
        self.super_admin = User.objects.create_user(
            username="superadmin",
            email="superadmin@example.com",
            password="superpass",
            role="admin",
            is_super_admin=True,
            is_staff=True,
        )

        self.student = Student.objects.create_user(
            username="studentuser",
            email="student@example.com",
            password="studentpass",
            role="student",
            is_staff=False,
            major="CS"
        )

        self.client = APIClient()
        self.url = "/api/admin/reports-with-replies"

    def test_get_reports_with_student_reply_only(self):
        self.client.force_authenticate(user=self.super_admin)

        report = AdminReportRequest.objects.create(
            subject="Test Report",
            details="Student submitted this report",
            report_type="Issue",
            is_from_society_officer=False,
            from_student=self.student,
            email="student@example.com",
            requested_at=timezone.now()
        )

        ReportReply.objects.create(
            report=report,
            content="Student's reply",
            replied_by=self.student,
            is_admin_reply=False
        )

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertIn("latest_reply", response.data[0])
        self.assertEqual(response.data[0]["latest_reply"]["content"], "Student's reply")

    def test_get_reports_with_admin_reply(self):
        self.client.force_authenticate(user=self.super_admin)

        report = AdminReportRequest.objects.create(
            subject="Test Report",
            details="Student submitted this report",
            report_type="Feedback",
            is_from_society_officer=False,
            from_student=self.student,
            email="student@example.com",
            requested_at=timezone.now()
        )

        ReportReply.objects.create(
            report=report,
            content="Admin's reply",
            replied_by=self.super_admin,
            is_admin_reply=True
        )

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)  

    def test_get_reports_unauthenticated(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_reports_non_admin_user(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
