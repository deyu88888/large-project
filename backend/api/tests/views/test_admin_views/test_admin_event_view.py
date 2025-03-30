from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from api.models import Event, Society, Student, User, EventRequest
from api.serializers import EventRequestSerializer
from datetime import timedelta
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile

class AdminEventViewTests(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username="adminuser",
            email="admin@example.com",
            password="adminpass",
            role="admin"
        )

        self.student = Student.objects.create_user(
            username="studentuser",
            email="student@example.com",
            password="studentpass",
            first_name="Test",
            last_name="Student",
        )

        self.society = Society.objects.create(
            name="Test Society",
            description="A sample test society.",
            president=self.student,
            approved_by=self.admin_user
        )

        now = timezone.now()

        dummy_image = SimpleUploadedFile(
            name='test.jpg',
            content=b'sample_image_data',
            content_type='image/jpeg'
        )

        self.approved_event1 = Event.objects.create(
            title="Approved Event 1",
            main_description="Description 1",
            cover_image=dummy_image,
            date=now.date(),
            start_time=(now + timedelta(hours=1)).time(),
            hosted_by=self.society,
            location="Test Location 1",
            max_capacity=100,
            status="Approved"
        )

        self.approved_event2 = Event.objects.create(
            title="Approved Event 2",
            main_description="Description 2",
            cover_image=dummy_image,
            date=(now + timedelta(days=1)).date(),
            start_time=(now + timedelta(hours=2)).time(),
            hosted_by=self.society,
            location="Test Location 2",
            max_capacity=50,
            status="Approved"
        )

        self.pending_event = Event.objects.create(
            title="Pending Event",
            main_description="Description 3",
            cover_image=dummy_image,
            date=(now + timedelta(days=2)).date(),
            start_time=(now + timedelta(hours=3)).time(),
            hosted_by=self.society,
            location="Test Location 3",
            max_capacity=10,
            status="Pending"
        )

        self.event_request1 = EventRequest.objects.create(
            event=self.approved_event1,
            from_student=self.student,
            hosted_by=self.society,
            intent="CreateEve",
            approved=True
        )

        self.event_request2 = EventRequest.objects.create(
            event=self.approved_event2,
            from_student=self.student,
            hosted_by=self.society,
            intent="CreateEve",
            approved=True
        )

        self.event_request3 = EventRequest.objects.create(
            event=self.pending_event,
            from_student=self.student,
            hosted_by=self.society,
            intent="CreateEve",
            approved=None
        )
        
        self.client.force_authenticate(user=self.admin_user)

    def test_get_approved_events(self):
        url = reverse('event', kwargs={'event_status': 'approved'})
        response = self.client.get(url)
        
        event_requests = EventRequest.objects.filter(
            event__status="Approved"
        ).order_by("event__date", "event__start_time")
        
        expected_data = EventRequestSerializer(
            event_requests, 
            many=True, 
            context={'request': response.wsgi_request}
        ).data
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data, expected_data)

    def test_get_pending_events(self):
        url = reverse('event', kwargs={'event_status': 'pending'})
        response = self.client.get(url)
        
        event_requests = EventRequest.objects.filter(
            event__status="Pending"
        ).order_by("event__date", "event__start_time")
        
        expected_data = EventRequestSerializer(
            event_requests, 
            many=True, 
            context={'request': response.wsgi_request}
        ).data
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data, expected_data)

    def test_get_invalid_status_returns_empty_list(self):
        url = reverse('event', kwargs={'event_status': 'rejectedddd'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_events_ordered_by_date_and_time(self):
        url = reverse('event', kwargs={'event_status': 'approved'})
        response = self.client.get(url)
        dates_and_times = [(event['event']['date'], event['event']['start_time']) 
                          for event in response.data]
        
        self.assertEqual(dates_and_times, sorted(dates_and_times))
        
        self.assertEqual(dates_and_times[0][0], self.approved_event1.date.isoformat())
        self.assertEqual(dates_and_times[1][0], self.approved_event2.date.isoformat())