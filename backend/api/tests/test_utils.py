import json
from unittest.mock import patch
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from api.utils import generate_otp, OTP_VALIDITY_MINUTES

class UtilsTestCase(TestCase):
    """Unit tests for utility functions related to OTP handling."""

    def setUp(self):
        """Setup test data."""
        self.valid_email = "test@kcl.ac.uk"
        self.invalid_email = "test@gmail.com"
        self.valid_otp = "123456"

    def test_generate_otp(self):
        """Test that generate_otp returns a 6-digit numeric string."""
        otp = generate_otp()
        self.assertEqual(len(otp), 6)
        self.assertTrue(otp.isdigit())

    def test_request_otp_success(self):
        """Test that request_otp successfully generates and sends an OTP."""
        with patch("api.utils.send_mail") as mock_send_mail:
            response = self.client.post(
                reverse("request_otp"),
                data=json.dumps({"email": self.valid_email}),
                content_type="application/json"
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertIn("OTP sent to your email", response.json()["message"])
            self.assertIsNotNone(cache.get(f"otp_{self.valid_email}"))
            mock_send_mail.assert_called_once()

    def test_request_otp_invalid_email(self):
        """Test that request_otp rejects non-KCL emails."""
        response = self.client.post(
            reverse("request_otp"),
            data=json.dumps({"email": self.invalid_email}),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Only KCL emails are allowed", response.json()["error"])

    def test_request_otp_missing_email(self):
        """Test that request_otp fails when email is missing."""
        response = self.client.post(
            reverse("request_otp"),
            data=json.dumps({}),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Only KCL emails are allowed", response.json()["error"])

    def test_request_otp_invalid_json(self):
        """Test that request_otp handles invalid JSON correctly."""
        response = self.client.post(
            reverse("request_otp"),
            data="invalid json",
            content_type="application/json"
        )
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn("error", response.json())

    def test_request_otp_send_mail_failure(self):
        """Test that if send_mail fails, request_otp returns a 500 error."""
        with patch("api.utils.send_mail", side_effect=Exception("Mail error")):
            response = self.client.post(
                reverse("request_otp"),
                data=json.dumps({"email": self.valid_email}),
                content_type="application/json"
            )
            self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
            self.assertIn("error", response.json())

    def test_verify_otp_success(self):
        """Test successful OTP verification."""
        cache.set(f"otp_{self.valid_email}", self.valid_otp, timeout=OTP_VALIDITY_MINUTES * 60)
        response = self.client.post(
            reverse("verify_otp"),
            data=json.dumps({"email": self.valid_email, "otp": self.valid_otp}),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("OTP verified successfully.", response.json()["message"])

    def test_verify_otp_expired(self):
        """Test OTP verification failure due to expired OTP."""
        response = self.client.post(
            reverse("verify_otp"),
            data=json.dumps({"email": self.valid_email, "otp": self.valid_otp}),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("OTP has expired or is invalid.", response.json()["error"])

    def test_verify_otp_invalid(self):
        """Test OTP verification failure due to incorrect OTP."""
        cache.set(f"otp_{self.valid_email}", "654321", timeout=OTP_VALIDITY_MINUTES * 60)
        response = self.client.post(
            reverse("verify_otp"),
            data=json.dumps({"email": self.valid_email, "otp": self.valid_otp}),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Invalid OTP. Please try again.", response.json()["error"])

    def test_verify_otp_missing_fields(self):
        """Ensure both email and OTP must be provided."""
        response = self.client.post(
            reverse("verify_otp"),
            data=json.dumps({"email": self.valid_email}),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Email and OTP are required.", response.json()["error"])

        response = self.client.post(
            reverse("verify_otp"),
            data=json.dumps({"otp": self.valid_otp}),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Email and OTP are required.", response.json()["error"])

    def test_request_otp_invalid_method(self):
        """Test that a GET request to request_otp returns a 400 error."""
        response = self.client.get(reverse("request_otp"))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Invalid request", response.json()["error"])

    def test_verify_otp_invalid_method(self):
        """Test that a GET request to verify_otp returns a 400 error."""
        response = self.client.get(reverse("verify_otp"))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Invalid request", response.json()["error"])

    def test_verify_otp_cache_failure(self):
        """Test verify_otp when cache.get raises an exception."""
        with patch("django.core.cache.cache.get", side_effect=Exception("Cache error")):
            response = self.client.post(
                reverse("verify_otp"),
                data=json.dumps({"email": self.valid_email, "otp": self.valid_otp}),
                content_type="application/json"
            )
            self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
            self.assertIn("error", response.json())

    def test_verify_otp_cache_delete_failure(self):
        """Test that an exception during cache.delete is handled properly."""
        cache.set(f"otp_{self.valid_email}", self.valid_otp, timeout=OTP_VALIDITY_MINUTES * 60)
        with patch("django.core.cache.cache.delete", side_effect=Exception("Cache delete error")):
            response = self.client.post(
                reverse("verify_otp"),
                data=json.dumps({"email": self.valid_email, "otp": self.valid_otp}),
                content_type="application/json"
            )
            self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
            self.assertIn("error", response.json())

    def tearDown(self):
        """Clear cache after each test."""
        cache.delete(f"otp_{self.valid_email}")
