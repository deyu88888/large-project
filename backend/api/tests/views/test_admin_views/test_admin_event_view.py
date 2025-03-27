from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from api.models import Event, Society, Student, User
from api.serializers import EventSerializer
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

        Event.objects.create(
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

        Event.objects.create(
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

        Event.objects.create(
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

        
        self.client.force_authenticate(user=self.admin_user)

    def test_get_approved_events(self):
        url = reverse('event', kwargs={'event_status': 'approved'})
        response = self.client.get(url)
        events = Event.objects.filter(status="Approved").order_by("date", "start_time")
        expected_data = EventSerializer(events, many=True, context={'request': response.wsgi_request}).data
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, expected_data)

    def test_get_pending_events(self):
        url = reverse('event', kwargs={'event_status': 'pending'})
        response = self.client.get(url)
        events = Event.objects.filter(status="Pending").order_by("date", "start_time")
        expected_data = EventSerializer(events, many=True, context={'request': response.wsgi_request}).data
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, expected_data)

    def test_get_invalid_status_returns_empty_list(self):
        url = reverse('event', kwargs={'event_status': 'rejectedddd'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_events_ordered_by_date_and_time(self):
        url = reverse('event', kwargs={'event_status': 'approved'})
        response = self.client.get(url)
        dates_and_times = [(event['date'], event['start_time']) for event in response.data]
        self.assertEqual(dates_and_times, sorted(dates_and_times))