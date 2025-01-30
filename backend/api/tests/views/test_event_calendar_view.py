from rest_framework.test import APITestCase
from rest_framework import status
from api.models import Event, User
from datetime import datetime, timedelta
from django.utils.timezone import make_aware


class TestEventCalendarView(APITestCase):
    def setUp(self):
        # Create a user
        self.user = User.objects.create_user(
            username="testuser",
            password="password123",
            email="user@example.com",
            first_name="Test",
            last_name="User",
            role="student"
        )

        # Force authenticate
        self.client.force_authenticate(user=self.user)

        # URL for the view
        self.url = "/api/dashboard/events/"

        # Create sample events
        self.event1 = Event.objects.create(
            title="Event 1",
            date=make_aware(datetime.now()),
            start_time=datetime.now().time(),
            duration=timedelta(hours=2),
            location="Room A"
        )
        self.event2 = Event.objects.create(
            title="Event 2",
            date=make_aware(datetime.now() + timedelta(days=1)),
            start_time=(datetime.now() + timedelta(hours=2)).time(),
            duration=timedelta(hours=1),
            location="Room B"
        )

    def test_event_calendar_authenticated(self):
        """Test that an authenticated user can view the event calendar."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)

        # Verify event details
        event_titles = [event["title"] for event in response.data]
        self.assertIn(self.event1.title, event_titles)
        self.assertIn(self.event2.title, event_titles)

    def test_event_calendar_unauthenticated(self):
        """Test that an unauthenticated user cannot view the event calendar."""
        self.client.logout()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_event_calendar_empty(self):
        """Test that the event calendar returns an empty list when there are no events."""
        Event.objects.all().delete()  # Remove all events
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)