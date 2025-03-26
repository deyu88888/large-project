import uuid
from rest_framework.test import APITestCase
from rest_framework import status
from api.models import AdminReportRequest

class TestPublicReportView(APITestCase):

    def test_public_report_submission_valid_data(self):
        payload = {
            "subject": "Public feedback",
            "details": "Some valuable public feedback",
            "email": "publicuser@example.com"
        }

        response = self.client.post("/api/dashboard/public-report", payload, format='json')

        print("Response Status Code:", response.status_code)
        print("Response Data:", response.data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            response.data["message"],
            "Report submitted successfully. Thank you for your feedback."
        )

        report_exists = AdminReportRequest.objects.filter(
            subject="Public feedback",
            details="Some valuable public feedback",
            email="publicuser@example.com"
        ).exists()

        print("Report Created:", report_exists)
        self.assertTrue(report_exists)

    def test_public_report_submission_invalid_data(self):
        payload = {
            "subject": "",
            "details": "",
        }

        response = self.client.post("/api/dashboard/public-report", payload, format='json')

        print("Response Status Code:", response.status_code)
        print("Response Errors:", response.data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        self.assertIn('subject', response.data)
        self.assertIn('details', response.data)
        self.assertNotIn('report_type', response.data, "Serializer doesn't require 'report_type'")
        self.assertNotIn('email', response.data, "Email is optional and should not cause an error")

    def test_public_report_submission_without_email(self):
        payload = {
            "subject": "Feedback without email",
            "details": "Details provided without email"
        }

        response = self.client.post("/api/dashboard/public-report", payload, format='json')

        print("Response Status Code:", response.status_code)
        print("Response Data:", response.data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        report_exists = AdminReportRequest.objects.filter(
            subject="Feedback without email",
            details="Details provided without email",
            email__isnull=True
        ).exists()

        print("Report Created without email:", report_exists)
        self.assertTrue(report_exists)