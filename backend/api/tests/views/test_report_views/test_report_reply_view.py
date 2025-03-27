from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from api.models import User, Student, AdminReportRequest, ReportReply
from django.urls import reverse
import random
import string

def unique_email(prefix):
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"{prefix}_{suffix}@example.com"

class TestReportReplyView(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="adminuser",
            email=unique_email("admin"),
            password="adminpass",
            role="admin",
            is_super_admin=True,
            is_staff=True
        )

        self.student_user = Student.objects.create_user(
            username="studentuser",
            email=unique_email("student"),
            password="studentpass",
            role="student",
            major="Physics"
        )

        self.report = AdminReportRequest.objects.create(
            report_type="Feedback",
            subject="Test Subject",
            details="Test details",
            from_student=self.student_user
        )

        self.client = APIClient()
        self.base_url = "/api/reports/replies/"
        self.reply_url = self.base_url
        self.report_specific_url = f"{self.base_url}{self.report.id}/"

    def test_get_all_replies_authenticated(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.reply_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_replies_for_specific_report_authenticated(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.report_specific_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_post_reply_to_report(self):
        self.client.force_authenticate(user=self.admin)
        data = {
            "report": self.report.id,
            "content": "Admin reply"
        }
        response = self.client.post(self.reply_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["content"], "Admin reply")

    def test_president_reply_to_admin_reply(self):
        
        self.client.force_authenticate(user=self.admin)
        admin_reply = ReportReply.objects.create(
            report=self.report,
            content="Admin's initial reply",
            replied_by=self.admin,
            is_admin_reply=True
        )

        
        president = Student.objects.create_user(
            username="presidentuser",
            email=unique_email("president"),
            password="prespass",
            role="president",
            major="Law"
        )

        self.client.force_authenticate(user=president)
        data = {
            "report": self.report.id,
            "content": "President reply",
            "parent_reply": admin_reply.id
        }
        response = self.client.post(self.reply_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["content"], "President reply")

    def test_president_cannot_reply_directly_to_report(self):
        president = Student.objects.create_user(
            username="presidentuser",
            email=unique_email("president2"),
            password="prespass",
            role="president",
            major="History"
        )

        self.client.force_authenticate(user=president)
        data = {
            "report": self.report.id,
            "content": "Unauthorized president reply"
        }
        response = self.client.post(self.reply_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("error", response.data)

    def test_unauthenticated_cannot_post(self):
        data = {
            "report": self.report.id,
            "content": "Should fail"
        }
        response = self.client.post(self.reply_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_cannot_get(self):
        response = self.client.get(self.reply_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)  