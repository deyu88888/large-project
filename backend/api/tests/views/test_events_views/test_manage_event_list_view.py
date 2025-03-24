import datetime
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.utils.timezone import now
from api.models import User, Event, Society, Student
from api.serializers import EventSerializer
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()

class ManageEventListViewTest(APITestCase):
    def setUp(self):
        # Create a test user (for authentication)
        self.user = User.objects.create_user(
            username="testuser",
            password="testpass",
            email="testuser@example.com"
        )
        # Generate an access token for the test user.
        self.token = str(AccessToken.for_user(self.user))
        
        # Create a student to be the society president
        self.student_president = Student.objects.create_user(
            username="president",
            password="presidentpass",
            email="president@example.com",
            major="Computer Science",
            first_name="president",
            last_name="User"
        )
        
        self.admin = User.objects.create_user(
            username="admin_for_approval",
            password="admin1234",
            email="admin_approval@example.com",
            first_name="Admin",
            last_name="Approver"
        )
        
        # Create a Society with the president.
        self.society = Society.objects.create(
            name="Test Society",
            president=self.student_president,
            approved_by=self.admin
        )
        
        # Set up the base URL for the events endpoint.
        # (Assuming your URL pattern for EventListView is: 
        #   path("events/", EventListView.as_view(), name="event-list"))
        self.url = "/api/events/"

        # Get current date and time.
        self.today = now().date()
        self.current_time = now().time()

        # Create events:
        # Upcoming event: either with a future date or if on the same day, with a start time greater than now.
        self.upcoming_event = Event.objects.create(
            title="Upcoming Event",
            date=self.today + datetime.timedelta(days=1),
            start_time="12:00:00",
            status="Approved",
            hosted_by=self.society
        )
        # Previous event: with a past date (or same day with a start time before now).
        self.previous_event = Event.objects.create(
            title="Previous Event",
            date=self.today - datetime.timedelta(days=1),
            start_time="10:00:00",
            status="Approved",
            hosted_by=self.society
        )
        # Pending event: status is "Pending".
        self.pending_event = Event.objects.create(
            title="Pending Event",
            date=self.today,
            start_time="12:00:00",
            status="Pending",
            hosted_by=self.society
        )

    def test_get_missing_society_id(self):
        """
        If society_id is missing from query parameters, should return 400 Bad Request.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        response = self.client.get(self.url, {"filter": "upcoming"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data.get("error"), "Missing society_id")

    def test_get_upcoming_events(self):
        """
        Filtering for upcoming events should return events with a future date 
        or with today's date and start_time greater than current time.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        response = self.client.get(
            self.url,
            {"society_id": self.society.id, "filter": "upcoming"},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Expect only the upcoming event.
        expected_data = EventSerializer([self.upcoming_event], many=True).data
        self.assertEqual(response.data, expected_data)

    def test_get_previous_events(self):
        """
        Filtering for previous events should return events with a past date 
        or with today's date and a start_time less than current time.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        response = self.client.get(
            self.url,
            {"society_id": self.society.id, "filter": "previous"},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_data = EventSerializer([self.previous_event], many=True).data
        self.assertEqual(response.data, expected_data)

    def test_get_pending_events(self):
        """
        Filtering for pending events should return events with status "Pending".
        """
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        response = self.client.get(
            self.url,
            {"society_id": self.society.id, "filter": "pending"},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_data = EventSerializer([self.pending_event], many=True).data
        self.assertEqual(response.data, expected_data)

    def test_get_no_auth(self):
        """
        If no authentication token is provided, should return 401 Unauthorized.
        """
        response = self.client.get(
            self.url,
            {"society_id": self.society.id, "filter": "upcoming"},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)