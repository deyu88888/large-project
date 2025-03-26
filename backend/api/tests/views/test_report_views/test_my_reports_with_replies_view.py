from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from api.models import Student, AdminReportRequest, ReportReply
import random
import string


def generate_unique_email():
    return f"student_{''.join(random.choices(string.ascii_lowercase + string.digits, k=6))}@example.com"


class TestMyReportsWithRepliesView(APITestCase):
    def setUp(self):
        self.student = Student.objects.create_user(
            username="teststudent",
            email=generate_unique_email(),
            password="securepass123",
            role="student",
            major="Physics"
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.student)

        
        self.report1 = AdminReportRequest.objects.create(
            report_type="Feedback",
            subject="Feedback 1",
            details="Report details 1",
            from_student=self.student
        )

        self.report2 = AdminReportRequest.objects.create(
            report_type="System Issue",
            subject="Bug Report",
            details="Found a bug",
            from_student=self.student
        )

        
        self.reply1 = ReportReply.objects.create(
            report=self.report1,
            content="Thanks for your feedback.",
            replied_by=self.student,
            is_admin_reply=False
        )

        self.reply2 = ReportReply.objects.create(
            report=self.report1,
            content="We are looking into it.",
            replied_by=self.student,
            is_admin_reply=False
        )

        self.url = "/api/reports/my-with-replies/"

    def test_my_reports_with_replies_view(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

        feedback_report = next(r for r in response.data if r["subject"] == "Feedback 1")
        self.assertEqual(len(feedback_report["replies"]), 2)

        other_report = next(r for r in response.data if r["subject"] == "Bug Report")
        self.assertEqual(len(other_report["replies"]), 0)