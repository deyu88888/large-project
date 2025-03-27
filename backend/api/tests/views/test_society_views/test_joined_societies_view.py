from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from api.models import Student, Society, User
from api.tests.file_deletion import delete_file
from rest_framework_simplejwt.tokens import RefreshToken


class JoinedSocietiesViewTestCase(TestCase):
    """Unit tests for the JoinSocietyView."""

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
        
        # Create a third student to be the president of the third society
        self.student3 = Student.objects.create_user(
            username="student3",
            email="student3@example.com",
            password="password123",
            first_name="Student",
            last_name="Three",
        )

        # Create test societies
        self.society1 = Society.objects.create(
            name="Science Club",
            president=self.student1,
            approved_by=self.admin,
            status="Approved"
        )
        self.society2 = Society.objects.create(
            name="Math Club",
            president=self.student2,
            approved_by=self.admin,
            status="Approved"
        )
        self.society3 = Society.objects.create(
            name="Art Club",
            president=self.student3,
            approved_by=self.admin,
            status="Approved"
        )

        self.society1.society_members.add(self.student1)

        # Set up API client
        self.client = APIClient()
        self.student1_token = self._generate_token(self.student1)
        self.student2_token = self._generate_token(self.student2)
        self.student3_token = self._generate_token(self.student3)
        self.join_url = "/api/society/join/"
        self.get_available_url = "/api/society/join/"

    def _generate_token(self, user):
        """Generate a JWT token for the user."""
        refresh = RefreshToken.for_user(user)
        return f"Bearer {refresh.access_token}"

    def test_get_available_societies_authenticated_student(self):
        """Test retrieving societies a student has not joined."""
        self.client.credentials(HTTP_AUTHORIZATION=self.student1_token)
        response = self.client.get(self.get_available_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        society_names = [society["name"] for society in response.data]
        self.assertNotIn("Science Club", society_names)

    def test_get_available_societies_unauthenticated(self):
        """Test retrieving societies without authentication."""
        response = self.client.get(self.get_available_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_available_societies_non_student(self):
        """Test retrieving societies for a non-student user."""
        self.client.credentials(HTTP_AUTHORIZATION=self._generate_token(self.admin))
        response = self.client.get(self.get_available_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_join_society_valid(self):
        """Test creating a valid request to join a society."""
        join_url = f"{self.join_url}{self.society2.id}/"
        self.client.credentials(HTTP_AUTHORIZATION=self.student1_token)
        response = self.client.post(join_url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("message", response.data)
        self.assertFalse(self.society2.society_members.filter(id=self.student1.id).exists())

    def test_join_society_already_joined(self):
        """
        Test joining a society that the student has already joined.
        The current implementation returns 201 Created even if already joined.
        """
        join_url = f"{self.join_url}{self.society1.id}/"
        self.client.credentials(HTTP_AUTHORIZATION=self.student1_token)
        response = self.client.post(join_url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_join_society_invalid_id(self):
        """Test joining a society with an invalid ID."""
        join_url = f"{self.join_url}9999/"
        self.client.credentials(HTTP_AUTHORIZATION=self.student1_token)
        response = self.client.post(join_url)  # Non-existent society
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_join_society_unauthenticated(self):
        """Test joining a society without authentication."""
        join_url = f"{self.join_url}{self.society2.id}/"
        response = self.client.post(join_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_join_society_non_student(self):
        """Test joining a society as a non-student user."""
        join_url = f"{self.join_url}{self.society2.id}/"
        self.client.credentials(HTTP_AUTHORIZATION=self._generate_token(self.admin))
        response = self.client.post(join_url) 
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def tearDown(self):
        for society in Society.objects.all():
            if society.icon:
                delete_file(society.icon.path)
        for student in Student.objects.all():
            if student.icon:
                delete_file(student.icon.path)