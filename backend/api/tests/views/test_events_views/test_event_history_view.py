from datetime import timedelta
from django.urls import reverse
from django.utils import timezone
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from api.models import User, Student, Society, Event


class EventHistoryViewTestCase(TestCase):
    """Test cases for EventHistoryView."""

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

        
        yesterday = timezone.now().date() - timedelta(days=1)
        self.past_event1 = Event.objects.create(
            title="Past Event 1",
            main_description="This is a past event",
            date=yesterday,
            start_time=timezone.now().time(),
            duration=timedelta(hours=2),
            hosted_by=self.society,
            location="Test Location 1",
            max_capacity=50,
            status="Approved"
        )
        
        last_week = timezone.now().date() - timedelta(days=7)
        self.past_event2 = Event.objects.create(
            title="Past Event 2",
            main_description="This is another past event",
            date=last_week,
            start_time=timezone.now().time(),
            duration=timedelta(hours=3),
            hosted_by=self.society,
            location="Test Location 2",
            max_capacity=100,
            status="Approved"
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
        
        
        self.student.attended_events.add(self.past_event1)
        self.student.attended_events.add(self.past_event2)
        
        self.student.attended_events.add(self.future_event)
        
        
        self.other_student.attended_events.add(self.past_event2)
        
        
        self.client = APIClient()
        self.url = reverse('event_history')  

    def test_event_history_returns_all_attended_events(self):
        """Test that GET returns all events the student has attended."""
        
        self.client.force_authenticate(user=self.student)
        
        
        response = self.client.get(self.url)
        
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertEqual(len(response.data), 3)
        
        
        event_ids = [event['id'] for event in response.data]
        self.assertIn(self.past_event1.id, event_ids)
        self.assertIn(self.past_event2.id, event_ids)
        self.assertIn(self.future_event.id, event_ids)

    def test_event_history_returns_correct_data_structure(self):
        """Test that the response contains the correct data structure."""
        
        self.client.force_authenticate(user=self.student)
        
        
        response = self.client.get(self.url)
        
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        
        event = response.data[0]
        self.assertIn('id', event)
        self.assertIn('title', event)
        self.assertIn('main_description', event)
        self.assertIn('date', event)
        self.assertIn('start_time', event)
        self.assertIn('duration', event)
        self.assertIn('location', event)
        self.assertIn('hosted_by', event)

    def test_event_history_requires_authentication(self):
        """Test that unauthenticated requests are denied."""
        
        response = self.client.get(self.url)
        
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_event_history_only_returns_student_specific_events(self):
        """Test that the endpoint only returns events for the authenticated student."""
        
        self.client.force_authenticate(user=self.other_student)
        
        
        response = self.client.get(self.url)
        
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        
        self.assertEqual(len(response.data), 1)
        
        
        self.assertEqual(response.data[0]['id'], self.past_event2.id)
        
        
        event_ids = [event['id'] for event in response.data]
        self.assertNotIn(self.past_event1.id, event_ids)
        self.assertNotIn(self.future_event.id, event_ids)

    def test_event_history_shows_no_events_for_new_student(self):
        """Test that a student with no event history gets an empty response."""
        
        new_student = Student.objects.create(
            username="newstudent",
            email="new@example.com",
            password="password123",
            first_name="New",
            last_name="Student",
            status="Approved",
            major="Mathematics"
        )
        
        
        self.client.force_authenticate(user=new_student)
        
        
        response = self.client.get(self.url)
        
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        
        self.assertEqual(len(response.data), 0)
        self.assertEqual(response.data, [])

    
    