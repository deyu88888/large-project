from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from api.models import Student, Society, User
from api.tests.file_deletion import delete_file
from rest_framework_simplejwt.tokens import RefreshToken


class StudentSocietiesViewTestCase(TestCase):
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

        # Add societies to student1
        self.society1.society_members.add(self.student1)
        self.society2.society_members.add(self.student1)

        # Set up API client
        self.client = APIClient()
        self.student1_token = self._generate_token(self.student1)
        self.student2_token = self._generate_token(self.student2)
        print(f"Student1's societies in test DB: {list(self.student1.societies_belongs_to.all())}")
        

    def _generate_token(self, user):
        """Generate a JWT token for the user."""
        refresh = RefreshToken.for_user(user)
        return f"Bearer {refresh.access_token}"

    def test_get_societies_authenticated_student(self):
        """Test retrieving societies for an authenticated student."""
        self.client.credentials(HTTP_AUTHORIZATION=self.student1_token)
        response = self.client.get("/api/student-societies/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]["name"], "Science Club")
        self.assertEqual(response.data[1]["name"], "Math Club")

    def test_get_societies_unauthenticated(self):
        """Test retrieving societies without authentication."""
        response = self.client.get("/api/student-societies/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_societies_non_student(self):   
        """Test retrieving societies for a non-student user."""
        self.client.credentials(HTTP_AUTHORIZATION=self._generate_token(self.admin))
        response = self.client.get("/api/student-societies/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)   
        self.assertEqual(response.data["error"], "Only students can manage societies.")

    def test_leave_society_valid(self):
        """Test leaving a society successfully using DELETE method."""
        self.client.credentials(HTTP_AUTHORIZATION=self.student1_token)
        response = self.client.delete(f"/api/leave-society/{self.society1.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], f"Successfully left society '{self.society1.name}'.")
        self.assertFalse(self.student1.societies.filter(id=self.society1.id).exists())

    def test_leave_society_not_member(self):
        """Test attempting to leave a society the student is not a member of."""
        self.client.credentials(HTTP_AUTHORIZATION=self.student2_token)
        response = self.client.delete(f"/api/leave-society/{self.society1.id}/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)
        self.assertEqual(response.data["error"], "You are not a member of this society.")

    def test_leave_society_invalid_id(self):
        """Test attempting to leave a society with an invalid ID."""
        self.client.credentials(HTTP_AUTHORIZATION=self.student1_token)
        response = self.client.delete("/api/leave-society/9999/")  # Non-existent society ID
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("error", response.data)
        self.assertEqual(response.data["error"], "Society does not exist.")

    def tearDown(self):
        for society in Society.objects.all():
            if society.icon:
                delete_file(society.icon.path)
        for student in Student.objects.all():
            if student.icon:
                delete_file(student.icon.path)

    def test_get_societies_empty(self):
        """
        Test retrieving societies for a student who hasn't joined any society.
        The response should be an empty list.
        """
        # Create a new student who is not associated with any society.
        student = Student.objects.create_user(
            username="new_student",
            email="new_student@example.com",
            password="password123",
            first_name="New",
            last_name="Student",
            major="Test Major"
        )
        token = self._generate_token(student)
        self.client.credentials(HTTP_AUTHORIZATION=token)
        
        response = self.client.get("/api/student-societies/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_leave_society_already_left(self):
        """
        Test that when a student tries to leave a society they are no longer a member of,
        the response returns a 400 error indicating the student is not a member.
        """
        # First, have student1 leave society1 successfully.
        self.client.credentials(HTTP_AUTHORIZATION=self.student1_token)
        response = self.client.delete(f"/api/leave-society/{self.society1.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Now, try leaving the same society again.
        response = self.client.delete(f"/api/leave-society/{self.society1.id}/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "You are not a member of this society.")

    def test_leave_society_non_existent(self):
        """
        Test that trying to leave a society that doesn't exist returns a 404 Not Found.
        """
        self.client.credentials(HTTP_AUTHORIZATION=self.student1_token)
        response = self.client.delete("/api/leave-society/9999/")  # Non-existent society
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["error"], "Society does not exist.")

    def test_get_societies_authenticated_student_multiple(self):
        """
        Test retrieving societies for an authenticated student who has joined multiple societies.
        """
        # Create another society and add student1 as a member.
        society3 = Society.objects.create(
            name="Art Club",
            status="Approved",
            president=self.student2,  # Different president; doesn't affect GET for joined societies.
            approved_by=self.admin,  # Adding the required approved_by field
            social_media_links={"Email": "artclub@example.com"}  # Adding social_media_links if needed
        )
        society3.society_members.add(self.student1)
        
        self.client.credentials(HTTP_AUTHORIZATION=self.student1_token)
        response = self.client.get("/api/student-societies/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Now student1 should have 3 societies.
        self.assertEqual(len(response.data), 3)
        society_names = {soc["name"] for soc in response.data}
        self.assertIn("Science Club", society_names)
        self.assertIn("Math Club", society_names)
        self.assertIn("Art Club", society_names)
