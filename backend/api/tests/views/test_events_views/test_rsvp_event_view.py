from datetime import timedelta
from django.urls import reverse
from django.utils import timezone
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from api.models import User, Student, Society, Event
from api.views import RSVPEventView


class RSVPEventViewTestCase(TestCase):
    """Test cases for RSVPEventView."""

    def setUp(self):
        """Set up test data."""
        
        self.admin_user = User.objects.create(
            username="adminuser",
            email="admin@example.com",
            first_name="Admin",
            last_name="User",
            role="admin",
            is_staff=True
        )
        
        
        self.student = Student.objects.create(
            username="teststudent",
            email="teststudent@example.com",
            password="password123",
            first_name="Test",
            last_name="Student",
            status="Approved",
            major="Computer Science"
        )
        
        
        self.other_student = Student.objects.create(
            username="otherstudent",
            email="other@example.com",
            password="password123",
            first_name="Other",
            last_name="Student",
            status="Approved",
            major="Physics"
        )

        
        self.society = Society.objects.create(
            name="Test Society",
            description="A test society",
            status="Approved",
            president=self.student,
            approved_by=self.admin_user
        )
        
        
        
        self.student.societies.add(self.society)

        
        self.other_society = Society.objects.create(
            name="Other Society",
            description="Another test society",
            status="Approved",
            president=self.other_student,
            approved_by=self.admin_user
        )

        
        tomorrow = timezone.now().date() + timedelta(days=1)
        self.future_event = Event.objects.create(
            title="Future Event",
            main_description="This is a future event",
            date=tomorrow,
            start_time=timezone.now().time(),
            duration=timedelta(hours=2),
            hosted_by=self.society,
            location="Test Location",
            max_capacity=50,
            status="Approved"
        )

        
        yesterday = timezone.now().date() - timedelta(days=1)
        self.past_event = Event.objects.create(
            title="Past Event",
            main_description="This is a past event",
            date=yesterday,
            start_time=timezone.now().time(),
            duration=timedelta(hours=2),
            hosted_by=self.society,
            location="Test Location",
            max_capacity=50,
            status="Approved"
        )

        
        self.other_society_event = Event.objects.create(
            title="Other Society Event",
            main_description="This is an event from another society",
            date=tomorrow,
            start_time=timezone.now().time(),
            duration=timedelta(hours=2),
            hosted_by=self.other_society,
            location="Other Location",
            max_capacity=50,
            status="Approved"
        )

        
        self.client = APIClient()
        self.url = reverse('rsvp_event')  

    def test_get_eligible_events(self):
        """Test that GET returns only eligible events (future events from societies the student belongs to)."""
        
        self.client.force_authenticate(user=self.student)
        
        
        response = self.client.get(self.url)
        
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.future_event.id)
        
        event_ids = [event['id'] for event in response.data]
        self.assertNotIn(self.past_event.id, event_ids)
        self.assertNotIn(self.other_society_event.id, event_ids)

    def test_get_excludes_rsvpd_events(self):
        """Test that GET excludes events the student has already RSVP'd for."""
        
        self.future_event.current_attendees.add(self.student)
        
        
        self.client.force_authenticate(user=self.student)
        
        
        response = self.client.get(self.url)
        
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_unauthenticated_access_denied(self):
        """Test that unauthenticated requests are denied."""
        
        response = self.client.get(self.url)
        
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_rsvp_success(self):
        """Test successful RSVP for an event."""
        
        self.client.force_authenticate(user=self.student)
        
        
        response = self.client.post(self.url, {'event_id': self.future_event.id})
        
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(f"RSVP'd for event '{self.future_event.title}'", response.data['message'])
        
        
        self.future_event.refresh_from_db()
        self.assertIn(self.student, self.future_event.current_attendees.all())
        
        
        self.student.refresh_from_db()
        self.assertIn(self.future_event, self.student.attended_events.all())

    def test_rsvp_event_not_found(self):
        """Test RSVP with non-existent event ID."""
        
        self.client.force_authenticate(user=self.student)
        
        
        non_existent_id = 9999  
        response = self.client.post(self.url, {'event_id': non_existent_id})
        
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("Event not found", response.data['error'])

    def test_rsvp_already_rsvpd(self):
        """Test RSVP when student has already RSVP'd."""
        
        self.future_event.current_attendees.add(self.student)
        
        
        self.client.force_authenticate(user=self.student)
        
        
        response = self.client.post(self.url, {'event_id': self.future_event.id})
        
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already RSVP'd", str(response.data))

    def test_rsvp_not_society_member(self):
        """Test RSVP for event from society student is not a member of."""
        
        self.client.force_authenticate(user=self.student)
        
        
        response = self.client.post(self.url, {'event_id': self.other_society_event.id})
        
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("must be a member of the hosting society", str(response.data))

    def test_rsvp_past_event(self):
        """Test RSVP for a past event."""
        
        self.client.force_authenticate(user=self.student)
        
        
        response = self.client.post(self.url, {'event_id': self.past_event.id})
        
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already started", str(response.data))

    def test_rsvp_full_event(self):
        """Test RSVP for an event that is already at capacity."""
        
        self.future_event.max_capacity = 1
        self.future_event.save()
        
        
        self.future_event.current_attendees.add(self.other_student)
        
        
        self.client.force_authenticate(user=self.student)
        
        
        response = self.client.post(self.url, {'event_id': self.future_event.id})
        
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("full", str(response.data))

    def test_cancel_rsvp_success(self):
        """Test successful cancellation of RSVP."""
        
        self.future_event.current_attendees.add(self.student)
        self.student.attended_events.add(self.future_event)
        
        
        self.client.force_authenticate(user=self.student)
        
        
        response = self.client.delete(self.url, {'event_id': self.future_event.id}, format='json')
        
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(f"Successfully canceled RSVP for event '{self.future_event.title}'", response.data['message'])
        
        
        self.future_event.refresh_from_db()
        self.assertNotIn(self.student, self.future_event.current_attendees.all())
        
        
        self.student.refresh_from_db()
        self.assertNotIn(self.future_event, self.student.attended_events.all())

    def test_cancel_rsvp_event_not_found(self):
        """Test cancellation with non-existent event ID."""
        
        self.client.force_authenticate(user=self.student)
        
        
        non_existent_id = 9999  
        response = self.client.delete(self.url, {'event_id': non_existent_id}, format='json')
        
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("Event not found", response.data['error'])

    def test_cancel_rsvp_not_rsvpd(self):
        """Test cancellation when student has not RSVP'd."""
        
        self.client.force_authenticate(user=self.student)
        
        
        response = self.client.delete(self.url, {'event_id': self.future_event.id}, format='json')
        
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("have not RSVP'd", str(response.data))