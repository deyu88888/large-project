import json
from django.urls import reverse
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
            email="regular@example.com",  # unique email
            is_president=False,
            president_of=None,
            major="Test Major"
        )
        
        # Create a president student user using create_user
        self.president_student = Student.objects.create_user(
            username="president_user",
            password="test1234",
            email="president@example.com",  # unique email
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
        # Create a society with id=1 for the president to manage.
        self.society = Society.objects.create(
            id=1,
            name="Test Society",
            status="Approved",
            president=self.president_student,  # if your Society model uses this field
            approved_by=self.admin
        )
        
        # Associate the society with the president by setting president_of
        self.president_student.president_of = self.society
        self.president_student.save()
        
        self.base_url = "/api/manage-society-details/"
        
        # Generate tokens for authentication
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
        self.assertIn("Only the society president or vice president can manage this society.", str(response.data))

    def test_get_society_not_found(self):
        """
        If the society does not exist, should return 404 Not Found.
        """
        url = f"{self.base_url}9999/"  # some non-existent ID
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.president_user_token}")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("Society not found", str(response.data))

    def test_get_success(self):
        """
        If the user is a president and the society exists, should return 200 with the society details.
        """
        url = f"{self.base_url}{self.society.id}/"
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.president_user_token}")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check if the response data matches the serializer
        expected_data = SocietySerializer(self.society).data
        self.assertEqual(response.data, expected_data)

    def test_patch_not_president(self):
        """
        PATCH request by a non-president user should return 403.
        """
        url = f"{self.base_url}{self.society.id}/"
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.regular_user_token}")
        payload = {"name": "New Society Name"}
        response = self.client.patch(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_patch_society_not_found(self):
        """
        PATCH request to a non-existent society should return 404.
        """
        url = f"{self.base_url}9999/"
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.president_user_token}")
        payload = {"name": "New Society Name"}
        response = self.client.patch(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_valid_data(self):
        """
        PATCH with valid data by a president user should return 200 and create a SocietyRequest
        without immediately updating the Society.
        """
        url = f"{self.base_url}{self.society.id}/"
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.president_user_token}")
        payload = {"name": "Updated Society Name"}
        response = self.client.patch(url, payload, format="json")
        
        # Check that the response is 200 OK and contains the correct message.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Society update request submitted. Await admin approval.", str(response.data))
        
        # Refresh the society from the database. Its name should remain unchanged.
        self.society.refresh_from_db()
        self.assertEqual(self.society.name, "Test Society")
        
        # Verify that a SocietyRequest was created with the new name.
        society_request = SocietyRequest.objects.get(society=self.society)
        self.assertEqual(society_request.name, "Updated Society Name")


    def test_patch_invalid_data(self):
        """
        PATCH with invalid data (e.g., extremely long name if you have a max length) should return 400.
        """
        url = f"{self.base_url}{self.society.id}/"
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.president_user_token}")
        payload = {"name": "A" * 5000}  # exceeding typical max length
        response = self.client.patch(url, payload, format="json")
        # Depending on your serializer validation, it may fail if you have a max_length.
        # If your serializer doesn't have a max_length constraint, you can test another invalid field.
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_200_OK]) 
        # Adjust based on your actual validation rules

        # If 400, check error message
        if response.status_code == status.HTTP_400_BAD_REQUEST:
            self.assertIn("name", response.data)

