import json
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from api.models import Admin, Student, Society
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()

class CreateEventRequestViewTest(APITestCase):
    def setUp(self):
        # Create a regular (non-president) student user using create_user
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
        
        self.admin = Admin(
            username='admin_user',
            first_name='John',
            last_name='Smith',
            email='admin@example.com',
            role='admin',
            password='adminpassword',
        )
        self.admin.save()
        
        # Create a Society with id=1 for the president to manage.
        self.society = Society.objects.create(
            id=1,
            name="Test Society",
            status="Approved",
            president=self.president_student,
            approved_by=self.admin
        )
        # Set the president_of field so that the president is linked to this society.
        self.president_student.president_of = self.society
        self.president_student.save()
        
        # Base URL for event requests (make sure this matches your URL configuration)
        self.base_url = "/api/event-requests/"
        
        # Generate tokens for authentication.
        self.regular_user_token = str(AccessToken.for_user(self.regular_student))
        self.president_user_token = str(AccessToken.for_user(self.president_student))
        
        # Define a valid payload for creating an event request.
        # Adjust these fields to match the fields expected by your EventRequestSerializer.
        self.valid_payload = {
            "title": "Test Event",
            "date": "2025-03-01",     # Example date (YYYY-MM-DD)
            "start_time": "12:00:00",  # Example time (HH:MM:SS)
            "description": "This is a test event request"
        }
        
        # Define an invalid payload (e.g., with an empty title)
        self.invalid_payload = {
            "title": "",  # Assuming title is required.
            "date": "2025-03-01",
            "start_time": "12:00:00",
            "description": "This is a test event request"
        }

    def test_post_no_auth(self):
        """
        If no token is provided, the POST should return 401 Unauthorized.
        """
        url = f"{self.base_url}{self.society.id}/"
        response = self.client.post(url, self.valid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_post_not_president(self):
        """
        If the user is authenticated but not a president, should return 403 Forbidden.
        """
        url = f"{self.base_url}{self.society.id}/"
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.regular_user_token}")
        response = self.client.post(url, self.valid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Only the society president or vice president can create events for this society.", str(response.data))

    def test_post_society_not_found(self):
        """
        If the society does not exist (or the user is not the president of that society), should return 404 Not Found.
        """
        url = f"{self.base_url}9999/"  # non-existent society id
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.president_user_token}")
        response = self.client.post(url, self.valid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        # Because response might be an HttpResponseNotFound (without .data), decode its content.
        content = response.content.decode('utf-8')
        self.assertIn("Society not found", content)

    def test_post_invalid_data(self):
        """
        If the event request data is invalid, the view should return 400 Bad Request.
        """
        url = f"{self.base_url}{self.society.id}/"
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.president_user_token}")
        response = self.client.post(url, self.invalid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("title", response.data)

    def test_post_success(self):
        """
        With valid data by a president user, should create an event request and return 201 Created.
        """
        url = f"{self.base_url}{self.society.id}/"
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.president_user_token}")
        response = self.client.post(url, self.valid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("Event request submitted successfully", str(response.data))
        self.assertIn("data", response.data)
