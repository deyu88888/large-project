from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from api.models import Student, AdminReportRequest
from django.utils.crypto import get_random_string

class TestReportToAdminView(APITestCase):
    def setUp(self):
        self.client = APIClient()

        self.student = Student.objects.create_user(
            username=f"student_{get_random_string(5)}",
            email=f"student_{get_random_string(5)}@example.com",
            password="password123",
            role="student",
            major="Engineering"
        )

        self.report = AdminReportRequest.objects.create(
            report_type="Feedback",
            subject="Broken Link",
            details="The homepage link is broken.",
            from_student=self.student
        )

        self.submit_url = "/api/reports/to-admin/"
        self.detail_url = f"/api/reports/to-admin/{self.report.id}/"
        self.invalid_detail_url = "/api/reports/to-admin/99999/"

    def test_get_all_reports_authenticated(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(self.submit_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(any(r['id'] == self.report.id for r in response.data))

    def test_get_single_report_authenticated(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.report.id)

    def test_get_single_report_not_found(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(self.invalid_detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_submit_report_authenticated(self):
        self.client.force_authenticate(user=self.student)
        report_data = {
            "report_type": "Feedback",
            "subject": "Suggestion",
            "details": "Please add dark mode support."
        }
        response = self.client.post(self.submit_url, report_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_submit_report_unauthenticated(self):
        report_data = {
            "report_type": "Feedback",
            "subject": "Suggestion",
            "details": "Unauthenticated should fail."
        }
        response = self.client.post(self.submit_url, report_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
