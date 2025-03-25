from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from api.models import Student, Society, User
from api.tests.file_deletion import delete_file
from rest_framework_simplejwt.tokens import RefreshToken


class StudentSocietiesDataViewTestCase(TestCase):
    """Unit tests for the StudentSocietiesView."""

    def setUp(self):
        # Create a test admin
        self.admin = User.objects.create_user(
            username="admin_user",
            email="admin@example.com",
            password="adminpassword",
            first_name="Admin",
            last_name="User",
        )

        # Create test students
        self.student1 = Student.objects.create_user(
            username="student1",
            email="student1@example.com",
            password="password123",
            first_name="Student",
            last_name="One",
        )
        self.student2 = Student.objects.create_user(
            username="student2",
            email="student2@example.com",
            password="password123",
            first_name="Student",
            last_name="Two",
        )
        self.student3 = Student.objects.create_user(
            username="student3",
            email="student3@example.com",
            password="password123",
            first_name="Student",
            last_name="Three",
        )

        # Create test societies
        self.society = Society.objects.create(
            name="Science Club",
            president=self.student1,
            approved_by=self.admin,
            event_manager=self.student2,
            status="Approved"
        )
        self.society.society_members.add(self.student1)
        self.society.society_members.add(self.student2)

        # Set up API client
        self.client = APIClient()
        self.student1_token = self._generate_token(self.student1)
        self.student3_token = self._generate_token(self.student3)

    def _generate_token(self, user):
        """Generate a JWT token for the user."""
        refresh = RefreshToken.for_user(user)
        return f"Bearer {refresh.access_token}"

    def test_student_get_society(self):
        """Test retrieving society for student."""
        self.client.credentials(HTTP_AUTHORIZATION=self.student1_token)
        response = self.client.get(f"/api/society-view/{self.society.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_society_fields(self):
        """Test society fields."""
        self.client.credentials(HTTP_AUTHORIZATION=self.student1_token)
        response = self.client.get(f"/api/society-view/{self.society.id}/")
        self.assertEqual(response.data["name"], "Science Club")
        self.assertEqual(response.data["president"]["id"], self.student1.id)
        self.assertEqual(response.data["event_manager"]["id"], self.student2.id)
        self.assertEqual(response.data["status"], "Approved")
        self.assertEqual(response.data["approved_by"], self.admin.id)

    def test_society_is_member(self):
        """Tests the is_member field for students who are/aren't members"""
        self.client.credentials(HTTP_AUTHORIZATION=self.student1_token)
        response = self.client.get(f"/api/society-view/{self.society.id}/")
        self.assertEqual(response.data["is_member"], 2)

        self.client.credentials(HTTP_AUTHORIZATION=self.student3_token)
        response = self.client.get(f"/api/society-view/{self.society.id}/")
        self.assertEqual(response.data["is_member"], 0)
