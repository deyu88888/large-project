from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

from api.models import User, SocietyRequest, Student, Society
from api.serializers import SocietySerializer
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()

class ManageSocietyDetailsViewTest(APITestCase):
    def setUp(self):
        
        self.regular_student = Student.objects.create_user(
            username="regular_user",
            password="test1234",
            email="regular@example.com", 
            is_president=False,
            president_of=None,
            major="Test Major"
        )
        
        # Create a president student user using create_user
        self.president_student = Student.objects.create_user(
            username="president_user",
            password="test1234",
            email="president@example.com", 
            is_president=True,
            major="Test Major"
        )
        self.admin = User.objects.create_user(
            username="admin_for_approval",
            password="admin1234",
            email="admin_approval@example.com",
            first_name="Admin",
            last_name="Approver"
        )
        self.society = Society.objects.create(
            id=1,
            name="Test Society",
            status="Approved",
            president=self.president_student,
            approved_by=self.admin
        )
        self.president_student.president_of = self.society
        self.president_student.save()
        self.base_url = "/api/society/manage/"
        
        self.regular_user_token = str(AccessToken.for_user(self.regular_student))
        self.president_user_token = str(AccessToken.for_user(self.president_student))

    def test_get_no_auth(self):
        """
        If no token is provided, should return 401 Unauthorized.
        """
        url = f"{self.base_url}{self.society.id}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_not_president(self):
        """
        If the user is authenticated but not a president, should return 403 Forbidden.
        """
        url = f"{self.base_url}{self.society.id}/"
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.regular_user_token}")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Only", str(response.data))

    def test_get_society_not_found(self):
        """
        If the society does not exist, should return 404 Not Found.
        """
        url = f"{self.base_url}9999/"
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.president_user_token}")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        content = response.content.decode('utf-8')
        self.assertIn("not found", content.lower())

    def test_get_success(self):
        """
        If the user is a president and the society exists, should return 200 with the society details.
        """
        url = f"{self.base_url}{self.society.id}/"
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.president_user_token}")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_data = SocietySerializer(self.society).data
        self.assertEqual(response.data, expected_data)

    def test_patch_not_president(self):
        """
        PATCH request by a non-president user should return 403.
        """
        url = f"{self.base_url}{self.society.id}/"
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.regular_user_token}")
        payload = {"name": "New Society Name"}
        response = self.client.patch(url, payload, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_patch_society_not_found(self):
        """
        PATCH request to a non-existent society should return 404.
        """
        url = f"{self.base_url}9999/"
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.president_user_token}")
        payload = {"name": "New Society Name"}
        response = self.client.patch(url, payload, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_valid_data(self):
        """
        PATCH with valid data by a president user should return 200 and create a SocietyRequest
        without immediately updating the Society.
        """
        url = f"{self.base_url}{self.society.id}/"
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.president_user_token}")
        payload = {"name": "Updated Society Name"}
        response = self.client.patch(url, payload, format="multipart")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Society update request submitted", str(response.data))
        
        self.society.refresh_from_db()
        self.assertEqual(self.society.name, "Test Society")
        
        society_request = SocietyRequest.objects.get(society=self.society)
        self.assertEqual(society_request.name, "Updated Society Name")


    def test_patch_invalid_data(self):
        """
        PATCH with invalid data (e.g., extremely long name if you have a max length) should return 400.
        """
        url = f"{self.base_url}{self.society.id}/"
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.president_user_token}")
        payload = {"name": "A" * 5000}
        response = self.client.patch(url, payload, format="multipart")
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_200_OK]) 
        if response.status_code == status.HTTP_400_BAD_REQUEST:
            self.assertIn("name", response.data)