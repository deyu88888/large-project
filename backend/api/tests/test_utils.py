import json
from django.core.cache import cache
from django.core.mail import send_mail
from django.http import HttpRequest
from django.test import TestCase, override_settings
from django.urls import reverse, path
from django.utils import timezone
from rest_framework import status
from django.conf import settings

# Import the views from your utils.py file
from api.utils import request_otp, verify_otp, generate_otp, send_otp_email, OTP_VALIDITY_MINUTES

# We'll define URL patterns for these views for testing.
urlpatterns = [
    path("otp/request/", request_otp, name="request_otp"),
    path("otp/verify/", verify_otp, name="verify_otp"),
]

@override_settings(ROOT_URLCONF=__name__, EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class OTPUtilsTestCase(TestCase):
    def setUp(self):
        # Clear the cache to start fresh.
        cache.clear()
        self.valid_email = "user@kcl.ac.uk"
        self.invalid_email = "user@example.com"

    def test_generate_otp_returns_6_digit_string(self):
        otp = generate_otp()
        self.assertTrue(otp.isdigit())
        self.assertEqual(len(otp), 6)

    def test_send_otp_email_sends_message(self):
        # Call send_otp_email and verify that an email is sent.
        otp = "123456"
        send_otp_email(self.valid_email, otp)
        from django.core import mail
        self.assertEqual(len(mail.outbox), 1)
        sent_email = mail.outbox[0]
        self.assertIn("Your OTP code is:", sent_email.body)
        self.assertEqual(sent_email.to, [self.valid_email])

    def test_request_otp_valid_email(self):
        """
        Test that POST to request_otp with a valid KCL email returns 200,
        stores an OTP in cache, and sends an email.
        """
        payload = {"email": self.valid_email}
        response = self.client.post(
            reverse("request_otp"),
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), {"message": "OTP sent to your email"})
        otp_in_cache = cache.get(f"otp_{self.valid_email}")
        self.assertIsNotNone(otp_in_cache)

    def test_request_otp_invalid_email(self):
        """
        Test that POST to request_otp with an invalid email returns 400.
        """
        payload = {"email": self.invalid_email}
        response = self.client.post(
            reverse("request_otp"),
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.json(), {"error": "Only KCL emails are allowed"})

    def test_request_otp_missing_email(self):
        """
        Test that POST to request_otp with missing email returns 400.
        """
        payload = {}  # no email provided
        response = self.client.post(
            reverse("request_otp"),
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.json(), {"error": "Only KCL emails are allowed"})

    def test_request_otp_invalid_method(self):
        """
        Test that a GET request to request_otp returns a 400 error.
        """
        response = self.client.get(reverse("request_otp"))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.json(), {"error": "Invalid request"})

    def test_request_otp_invalid_json(self):
        """
        Test that if invalid JSON is provided in the request body,
        the view returns a 500 error with the exception message.
        """
        response = self.client.post(
            reverse("request_otp"),
            data="invalid json",
            content_type="application/json"
        )
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn("error", response.json())

    def test_verify_otp_success(self):
        """
        Test that a correct OTP verification returns 200 and deletes the OTP.
        """
        otp = "123456"
        cache.set(f"otp_{self.valid_email}", otp, timeout=OTP_VALIDITY_MINUTES * 60)
        payload = {"email": self.valid_email, "otp": otp}
        response = self.client.post(
            reverse("verify_otp"),
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), {"message": "OTP verified successfully."})
        self.assertIsNone(cache.get(f"otp_{self.valid_email}"))

    def test_verify_otp_missing_fields(self):
        """
        Test that missing email or otp returns a 400 error.
        """
        payload = {"email": self.valid_email}
        response = self.client.post(
            reverse("verify_otp"),
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.json(), {"error": "Email and OTP are required."})

        payload = {"otp": "123456"}
        response = self.client.post(
            reverse("verify_otp"),
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.json(), {"error": "Email and OTP are required."})

    def test_verify_otp_wrong_otp(self):
        """
        Test that an incorrect OTP returns a 400 error.
        """
        correct_otp = "123456"
        cache.set(f"otp_{self.valid_email}", correct_otp, timeout=OTP_VALIDITY_MINUTES * 60)
        payload = {"email": self.valid_email, "otp": "000000"}
        response = self.client.post(
            reverse("verify_otp"),
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.json(), {"error": "Invalid OTP. Please try again."})

    def test_verify_otp_expired(self):
        """
        Test that if no OTP is in the cache, verify_otp returns a 400 error indicating expiration.
        """
        cache.delete(f"otp_{self.valid_email}")
        payload = {"email": self.valid_email, "otp": "123456"}
        response = self.client.post(
            reverse("verify_otp"),
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.json(), {"error": "OTP has expired or is invalid."})

    def test_verify_otp_invalid_method(self):
        """
        Test that a GET request to verify_otp returns a 400 error.
        """
        response = self.client.get(reverse("verify_otp"))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.json(), {"error": "Invalid request"})
