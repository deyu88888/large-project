import json
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from api.models import Student
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()

class TestStudentListViewTests(APITestCase):
    
    def setUp(self):
        """Set up test students and authentication token."""
        # Create an admin user
        self.admin = User.objects.create_superuser(
            username="admin_user",
            email="admin@example.com",
            password="password123",
            first_name="Admin",
            last_name="User",
            role="admin"
        )

        # Create a student user
        self.student = Student.objects.create(
            username="student1",
            email="student1@example.com",
            password="password123",
            first_name="John",
            last_name="Doe",
            major="Computer Science",
            status="Approved"
        )

        # Generate JWT token for authentication
        self.admin_token = str(AccessToken.for_user(self.admin))

        # URL for student list
        self.student_list_url = reverse("student")  # Ensure your `urls.py` has `path("user/student", StudentView.as_view(), name="student")`

    def test_get_student_list_success(self):
        """Test retrieving a list of students (GET request)."""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.admin_token}")
        response = self.client.get(self.student_list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 1)  # Ensure one student exists
        self.assertEqual(response.data[0]["username"], "student1")
        self.assertEqual(response.data[0]["major"], "Computer Science")

    def test_get_student_list_unauthenticated(self):
        """Test unauthenticated requests are denied."""
        self.client.credentials()  # Remove authentication
        response = self.client.get(self.student_list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_student_list_forbidden_for_students(self):
        """Test that a student cannot access the student list (should be admin-only)."""
        student_token = str(AccessToken.for_user(self.student))
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {student_token}")
        response = self.client.get(self.student_list_url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)  # Expecting "Forbidden"

