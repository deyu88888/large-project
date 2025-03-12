import datetime
from django.urls import reverse
from django.utils.timezone import now, make_aware
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken
from api.models import Admin, Student, Society, Event
from api.serializers import EventSerializer

class ManageEventDetailsViewTestCase(APITestCase):
    def setUp(self):
        # Create an admin user.
        self.admin = Admin.objects.create_user(
            username="admin_user",
            email="admin@example.com",
            password="adminpassword",
            first_name="Admin",
            last_name="User",
        )
        
        # Create a president student.
        self.president = Student.objects.create_user(
            username="president_user",
            email="president@example.com",
            password="test1234",
            first_name="Pres",
            last_name="Ident",
            is_president=True,
            major="Test Major"
        )
        
        # Create a society that this president leads.
        self.society = Society.objects.create(
            name="Tech Society",
            leader=self.president,
            approved_by=self.admin,
            status="Approved",
            category="Technology",
            social_media_links={"email": "tech@example.com"},
            membership_requirements="Must attend 2 events",
            upcoming_projects_or_plans="Plan a hackathon"
        )
        # Link the president to the society.
        self.president.president_of = self.society
        self.president.save()
        
        # Generate token for the president.
        self.president_token = str(AccessToken.for_user(self.president))
        
        # Create an event that is editable (upcoming) and one that is not.
        # For editable event, use a future date.
        future_date = now().date() + datetime.timedelta(days=10)
        self.upcoming_event = Event.objects.create(
            title="Upcoming Event",
            description="Future event",
            location="Auditorium",
            date=future_date,
            start_time=datetime.time(15, 0),
            duration=datetime.timedelta(hours=1),
            hosted_by=self.society,
            status="Approved"
        )
        
        # For non-editable event, use a past date.
        past_date = now().date() - datetime.timedelta(days=10)
        self.past_event = Event.objects.create(
            title="Past Event",
            description="Past event",
            location="Lecture Hall",
            date=past_date,
            start_time=datetime.time(10, 0),
            duration=datetime.timedelta(hours=1),
            hosted_by=self.society,
            status="Approved"
        )
        
        # Also create an event with status "Pending" (which is editable regardless of time)
        self.pending_event = Event.objects.create(
            title="Pending Event",
            description="Event pending approval",
            location="Room 101",
            date=past_date,  # past date but status is pending so it's editable
            start_time=datetime.time(10, 0),
            duration=datetime.timedelta(hours=1),
            hosted_by=self.society,
            status="Pending"
        )
        
        # Base URL for ManageEventDetailsView (adjust if your URL pattern is different)
        # e.g., /api/event/<event_id>/manage/
        self.base_url = "/api/event/{}/manage/"

    def test_get_event_details(self):
        """Test that GET returns event details using the EventSerializer."""
        url = self.base_url.format(self.upcoming_event.id)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.president_token}")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_data = EventSerializer(self.upcoming_event).data
        self.assertEqual(response.data, expected_data)

    def test_patch_editable_event_success(self):
        """
        Test that PATCH with valid data on an editable (upcoming or pending) event
        returns 200 and creates an event update request.
        """
        url = self.base_url.format(self.upcoming_event.id)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.president_token}")
        payload = {"title": "Updated Upcoming Event"}
        response = self.client.patch(url, payload, format="json")
        # Expect 200 OK with a message and event_request_id in the response.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Event update requested. Await admin approval.", str(response.data))
        self.assertIn("event_request_id", response.data)

    def test_patch_non_editable_event_failure(self):
        """
        Test that PATCH on a non-editable event (e.g., a past event) returns 400.
        """
        url = self.base_url.format(self.past_event.id)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.president_token}")
        payload = {"title": "Attempted Update on Past Event"}
        response = self.client.patch(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Only upcoming or pending events can be edited", str(response.data))

    def test_patch_pending_event_success(self):
        """
        Test that PATCH on a pending event (which is editable regardless of time) succeeds.
        """
        url = self.base_url.format(self.pending_event.id)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.president_token}")
        payload = {"title": "Updated Pending Event"}
        response = self.client.patch(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Event update requested. Await admin approval.", str(response.data))
        self.assertIn("event_request_id", response.data)

    def test_patch_unauthenticated(self):
        """Test that PATCH without authentication returns 401."""
        url = self.base_url.format(self.upcoming_event.id)
        payload = {"title": "Should not update"}
        response = self.client.patch(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_non_president_user(self):
        """Test that PATCH by a user who is not a president returns 403."""
        # Create a non-president student.
        non_president = Student.objects.create_user(
            username="regular_user",
            email="regular@example.com",
            password="password123",
            first_name="Regular",
            last_name="User",
            is_president=False,
            major="Test Major"
        )
        token = str(AccessToken.for_user(non_president))
        url = self.base_url.format(self.upcoming_event.id)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        payload = {"title": "Should not update"}
        response = self.client.patch(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Only society presidents can edit events", str(response.data))

    def test_delete_editable_event_success(self):
        """
        Test that DELETE on an editable event (upcoming or pending) returns 200 and deletes the event.
        """
        # We'll use the upcoming event.
        url = self.base_url.format(self.upcoming_event.id)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.president_token}")
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Event deleted successfully.", str(response.data))
        # Verify the event is deleted.
        with self.assertRaises(Event.DoesNotExist):
            Event.objects.get(pk=self.upcoming_event.id)

    def test_delete_non_editable_event_failure(self):
        """
        Test that DELETE on a non-editable event (past event) returns 400.
        """
        url = self.base_url.format(self.past_event.id)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.president_token}")
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Only upcoming or pending events can be deleted", str(response.data))

    def test_delete_unauthenticated(self):
        """Test that DELETE without authentication returns 401."""
        url = self.base_url.format(self.upcoming_event.id)
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_non_president(self):
        """Test that DELETE by a non-president returns 403."""
        non_president = Student.objects.create_user(
            username="regular_user2",
            email="regular2@example.com",
            password="password123",
            first_name="Regular2",
            last_name="User",
            is_president=False,
            major="Test Major"
        )
        token = str(AccessToken.for_user(non_president))
        url = self.base_url.format(self.upcoming_event.id)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Only society presidents can delete events", str(response.data))
