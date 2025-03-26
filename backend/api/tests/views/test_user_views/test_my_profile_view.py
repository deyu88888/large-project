from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from api.models import User, Student
from rest_framework.test import APIClient


class MyProfileViewTestCase(TestCase):
    """Unit tests for the Student Profile View."""

    def setUp(self):
        self.client = APIClient()

        self.user = User.objects.create_user(username="user", email="user@example.com",
                                             password="password123")
        self.student = Student.objects.create(
            username="studentuser",
            email="student@example.com",
            password="password123"
        )

    def test_get_student_profile(self):
        """Test retrieving a student's profile successfully."""
        self.client.force_authenticate(user=self.student)
        url = reverse("user_profile", kwargs={"user_id": self.student.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.student.id)

    def test_get_nonexistent_student_profile(self):
        """Test retrieving a non-existent student's profile should return 404."""
        self.client.force_authenticate(user=self.user)
        url = reverse("user_profile", kwargs={"user_id": 999})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
