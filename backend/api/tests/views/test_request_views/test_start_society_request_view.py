from django.urls import reverse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APITestCase
from unittest.mock import patch, MagicMock
from api.models import Student
from django.contrib.auth import get_user_model

User = get_user_model()

class StartSocietyRequestViewTests(APITestCase):
    def setUp(self):
        self.student = Student.objects.create_user(
            username="student1",
            password="password123",
            email="student@example.com",
            first_name="Stu",
            last_name="Dent",
            major="CS"
        )
        self.url = reverse("start_society")

    @patch("api.views_files.request_views.get_student_if_user_is_student")
    def test_not_student_returns_error(self, mock_get_student):
        error_response = Response(
            {"error": "You must be a student"},
            status=status.HTTP_403_FORBIDDEN
        )
        error_response.__bool__ = lambda self: True
        mock_get_student.return_value = (None, error_response)

        self.client.force_authenticate(user=self.student)
        response = self.client.post(self.url, {})

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data["error"], "You must be a student")


    @patch("api.views_files.view_utility.get_student_if_user_is_student")
    @patch("api.views_files.request_views.student_has_no_role")

    def test_student_has_role_returns_error(self, mock_no_role, mock_get_student):
        mock_get_student.return_value = (self.student, None)
        mock_no_role.return_value = Response(
            {"error": "You already have a role"},
            status=status.HTTP_400_BAD_REQUEST
        )
        self.client.force_authenticate(user=self.student)
        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["error"], "You already have a role")

    @patch("api.views_files.request_views.StartSocietyRequestSerializer")
    @patch("api.views_files.view_utility.get_student_if_user_is_student")
    @patch("api.views_files.view_utility.student_has_no_role")
    def test_invalid_serializer_returns_400(self, mock_no_role, mock_get_student, mock_serializer_class):
        mock_get_student.return_value = (self.student, None)
        mock_no_role.return_value = None

        mock_serializer = MagicMock()
        mock_serializer.is_valid.return_value = False
        mock_serializer.errors = {"name": ["This field is required."]}
        mock_serializer_class.return_value = mock_serializer

        self.client.force_authenticate(user=self.student)
        response = self.client.post(self.url, {"description": "A test"})
        self.assertEqual(response.status_code, 400)
        self.assertIn("name", response.data)

    @patch("api.views_files.request_views.StartSocietyRequestSerializer")
    @patch("api.views_files.view_utility.get_student_if_user_is_student")
    @patch("api.views_files.view_utility.student_has_no_role")
    def test_successful_request_returns_201(self, mock_no_role, mock_get_student, mock_serializer_class):
        mock_get_student.return_value = (self.student, None)
        mock_no_role.return_value = None

        mock_serializer = MagicMock()
        mock_serializer.is_valid.return_value = True
        mock_serializer.validated_data = {
            "name": "Robotics Club",
            "description": "We build robots!",
            "category": "Technology"
        }
        mock_serializer.save.return_value = None
        mock_serializer_class.return_value = mock_serializer

        self.client.force_authenticate(user=self.student)
        data = {
            "name": "Robotics Club",
            "description": "We build robots!",
            "category": "Technology"
        }
        response = self.client.post(self.url, data)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["message"], "Your request has been submitted for review.")
