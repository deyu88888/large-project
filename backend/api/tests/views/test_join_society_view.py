from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from api.models import Student, Society, Admin
from rest_framework_simplejwt.tokens import RefreshToken


class JoinSocietyViewTestCase(TestCase):
    """Unit tests for the JoinSocietyView."""

    def setUp(self):
        # Create a test admin
        self.admin = Admin.objects.create_user(
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

        # Create test societies
        self.society1 = Society.objects.create(
            name="Science Club",
            leader=self.student1,
            approved_by=self.admin,
        )
        self.society2 = Society.objects.create(
            name="Math Club",
            leader=self.student2,
            approved_by=self.admin,
        )
        self.society3 = Society.objects.create(
            name="Art Club",
            leader=None,
            approved_by=self.admin,
        )

        # Add student1 to society1
        self.society1.society_members.add(self.student1)

        # Set up API client
        self.client = APIClient()
        self.student1_token = self._generate_token(self.student1)
        self.student2_token = self._generate_token(self.student2)

    def _generate_token(self, user):
        """Generate a JWT token for the user."""
        refresh = RefreshToken.for_user(user)
        return f"Bearer {refresh.access_token}"

    def test_get_available_societies_authenticated_student(self):
        """Test retrieving societies a student has not joined."""
        self.client.credentials(HTTP_AUTHORIZATION=self.student1_token)
        response = self.client.get("/api/societies/available")  # Updated URL
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # Math Club and Art Club
        self.assertEqual(response.data[0]["name"], "Math Club")
        self.assertEqual(response.data[1]["name"], "Art Club")

    def test_get_available_societies_unauthenticated(self):
        """Test retrieving societies without authentication."""
        response = self.client.get("/api/societies/available")  # Updated URL
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_available_societies_non_student(self):
        """Test retrieving societies for a non-student user."""
        self.client.credentials(HTTP_AUTHORIZATION=self._generate_token(self.admin))
        response = self.client.get("/api/societies/available")  # Updated URL
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["error"], "Only students can join societies.")

    def test_join_society_valid(self):
        """Test joining a valid society."""
        self.client.credentials(HTTP_AUTHORIZATION=self.student1_token)
        response = self.client.post(f"/api/societies/{self.society2.id}/join")  # Updated URL
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["message"], f"Successfully joined society '{self.society2.name}'."
        )
        self.assertTrue(self.society2.society_members.filter(id=self.student1.id).exists())

    def test_join_society_already_joined(self):
        """Test joining a society that the student has already joined."""
        self.client.credentials(HTTP_AUTHORIZATION=self.student1_token)
        response = self.client.post(f"/api/societies/{self.society1.id}/join")  # Updated URL
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_join_society_invalid_id(self):
        """Test joining a society with an invalid ID."""
        self.client.credentials(HTTP_AUTHORIZATION=self.student1_token)
        response = self.client.post("/api/societies/9999/join")  # Updated URL
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("error", response.json())

    def test_join_society_unauthenticated(self):
        """Test joining a society without authentication."""
        response = self.client.post(f"/api/societies/{self.society2.id}/join")  # Updated URL
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_join_society_non_student(self):
        """Test joining a society as a non-student user."""
        self.client.credentials(HTTP_AUTHORIZATION=self._generate_token(self.admin))
        response = self.client.post(f"/api/societies/{self.society2.id}/join")  # Updated URL
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["error"], "Only students can join societies.")