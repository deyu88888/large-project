from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from api.models import Event


class EventDetailsViewTestCase(TestCase):
    """Unit tests for the Event Detail View."""

    def setUp(self):
        self.event = Event.objects.create(
            title="Test Event",
            main_description="This is a test event",
            location="Online",
            status="Approved"
        )

    def test_get_event_detail(self):
        """Test retrieving a specific event's details."""
        response = self.client.get(reverse("event_detail", kwargs={"event_id": self.event.id}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Test Event")
        self.assertEqual(response.data["description"], "This is a test event")
        self.assertEqual(response.data["location"], "Online")

    def test_get_event_detail_not_found(self):
        """Test retrieving a non-existent or unapproved event should return 404."""
        response = self.client.get(reverse("event_detail", kwargs={"event_id": 999}))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_unapproved_event_detail(self):
        """Test retrieving an unapproved event should return 404."""
        unapproved_event = Event.objects.create(
            title="Unapproved Event",
            description="This event is not approved",
            location="Offline",
            status="Pending"
        )
        response = self.client.get(reverse("event_detail", kwargs={"event_id": unapproved_event.id}))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
