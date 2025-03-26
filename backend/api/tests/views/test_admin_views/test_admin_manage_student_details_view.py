from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from api.models import User, Student, Society


class TestAdminManageStudentDetailsView(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="adminpass",
            role="admin",
            is_super_admin=True,
            is_staff=True,
        )
        self.student = Student.objects.create_user(
            username="studentuser",
            email="student@example.com",
            password="studentpass",
            role="student",
            major="Computer Science"
        )
        self.society = Society.objects.create(
            name="Tech Society",
            description="Tech stuff",
            president=self.student,
            approved_by=self.admin,
            status="Approved"
        )
        self.student.societies.add(self.society)
        self.client = APIClient()
        self.url = f"/api/admin/manage-student/{self.student.id}"

    def test_get_student_details_authenticated_admin(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], self.student.username)

    def test_get_student_details_unauthenticated(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_student_details_as_admin(self):
        self.client.force_authenticate(user=self.admin)
        updated_data = {
            "first_name": "Updated",
            "last_name": "Student",
            "major": "Mathematics",
            "societies": [self.society.id],
        }
        response = self.client.patch(self.url, updated_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["first_name"], "Updated")
        self.assertEqual(response.data["data"]["major"], "Mathematics")

    def test_patch_student_not_found(self):
        self.client.force_authenticate(user=self.admin)
        bad_url = f"/api/admin/manage-student/999999"
        response = self.client.get(bad_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)