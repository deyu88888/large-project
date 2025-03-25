from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from api.models import Event


class AllEventViewTestCase(TestCase):
    """Unit tests for the All Events View."""

    def setUp(self):
        self.event1 = Event.objects.create(
            title="Event 1",
            main_description="Description 1",
            location="Online",
            status="Approved"
        )
        self.event2 = Event.objects.create(
            title="Event 2",
            main_description="Description 2",
            location="Campus",
            status="Approved"
        )
        self.unapproved_event = Event.objects.create(
            title="Unapproved Event",
            main_description="Description 3",
            location="Offline",
            status="Pending"
        )

    def test_get_all_events(self):
        """Test retrieving all approved events."""
        response = self.client.get(reverse("all_events"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]["title"], "Event 1")
        self.assertEqual(response.data[1]["title"], "Event 2")

    def test_unapproved_events_not_included(self):
        """Test that unapproved events are not returned in the response."""
        response = self.client.get(reverse("all_events"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for event in response.data:
            self.assertNotEqual(event["title"], "Unapproved Event")