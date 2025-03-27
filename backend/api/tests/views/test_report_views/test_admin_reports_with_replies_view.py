import uuid
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from api.models import AdminReportRequest, ReportReply, Student, User

class TestAdminReportsWithRepliesView(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username="adminuser",
            email=f"admin_{uuid.uuid4().hex}@example.com",
            password="adminpass",
            role="admin",
            is_super_admin=True,
            is_staff=True,
        )

        self.student_user = Student.objects.create_user(
            username="studentuser",
            email=f"student_{uuid.uuid4().hex}@example.com",
            password="studentpass",
            role="student"
        )

        self.report = AdminReportRequest.objects.create(
            report_type="Feedback",
            subject="Feedback Subject",
            details="Some useful feedback",
            from_student=self.student_user
        )

        self.admin_reply = ReportReply.objects.create(
            report=self.report,
            content="Thanks for the feedback!",
            replied_by=self.admin_user,
            is_admin_reply=True
        )

    def test_admin_reports_with_replies_view(self):
        self.client.force_authenticate(user=self.admin_user)
        
        response = self.client.get(reverse("report_replied"))
        
        
        print(f"DEBUG: Requested URL: {reverse('report_replied')}")
        print(f"DEBUG: Status Code: {response.status_code}")
        if response.status_code != 200:
            print("DEBUG: Response content:", response.content.decode())

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        report_ids = [report["id"] for report in response.data]
        self.assertIn(self.report.id, report_ids)