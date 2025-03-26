from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from api.models import Student, AdminReportRequest
import random
import string


def generate_unique_email():
    return f"student_{''.join(random.choices(string.ascii_lowercase + string.digits, k=6))}@example.com"


class TestMyReportsView(APITestCase):
    def setUp(self):
        self.student = Student.objects.create_user(
            username="studentuser",
            email=generate_unique_email(),
            password="testpass123",
            role="student",
            major="Computer Science"
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.student)

        
        for i in range(3):
            AdminReportRequest.objects.create(
                report_type="Misconduct",
                subject=f"Test Report {i+1}",
                details="This is a test report",
                from_student=self.student
            )

        self.url = "/api/reports/my/"

    def test_my_reports_view(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)
        for report in response.data:
            self.assertEqual(report["report_type"], "Misconduct")
            self.assertIn("Test Report", report["subject"])