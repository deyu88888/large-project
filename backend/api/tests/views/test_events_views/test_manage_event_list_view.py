import datetime
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils.timezone import now
from api.models import User, Event, Society, Student
from api.serializers import EventSerializer
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()

class ManageEventListViewTest(APITestCase):
    def setUp(self):
        # Create a student to be the society president
        self.student_president = Student.objects.create_user(
            username="president",
            password="presidentpass",
            email="president@example.com",
            major="Computer Science",
            first_name="president",
            last_name="User",
            role="student"
        )
        
        # Generate an access token for the president
        self.token = str(AccessToken.for_user(self.student_president))
        
        self.admin = User.objects.create_user(
            username="admin_for_approval",
            password="admin1234",
            email="admin_approval@example.com",
            first_name="Admin",
            last_name="Approver",
            role="admin"
        )
        
        # Create a Society
        self.society = Society.objects.create(
            name="Test Society",
            president=self.student_president,
            approved_by=self.admin
        )
        
        if hasattr(self.student_president, 'societies'):
            self.student_president.societies.add(self.society)
        
        if hasattr(self.student_president, 'societies_belongs_to'):
            self.student_president.societies_belongs_to.add(self.society)
        
        if hasattr(self.student_president, 'president_of'):
            self.student_president.president_of = self.society
        self.student_president.save()
        
        self.url = "/api/events/list/"
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
            start_time="23:59:59",
            status="Pending",
            hosted_by=self.society
        )

    def test_get_student_with_no_societies(self):
        """
        If a student doesn't belong to any societies, an empty list should be returned.
        """
        student_no_societies = Student.objects.create_user(
            username="no_societies",
            password="password123",
            email="no_soc@example.com",
            major="Physics",
            role="student"
        )
        token = str(AccessToken.for_user(student_no_societies))
        
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = self.client.get(self.url, format="json")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_get_upcoming_events(self):
        """
        Filtering for upcoming events should return events with a future date 
        or with today's date and start_time greater than current time.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        response = self.client.get(
            self.url,
            {"filter": "upcoming"},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_data = EventSerializer([self.upcoming_event], many=True, context={'request': response.wsgi_request}).data
        self.assertEqual(response.data, expected_data)

    def test_get_previous_events(self):
        """
        Filtering for previous events should return events with a past date 
        or with today's date and a start_time less than current time.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        response = self.client.get(
            self.url,
            {"filter": "previous"},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_data = EventSerializer([self.previous_event], many=True, context={'request': response.wsgi_request}).data
        self.assertEqual(response.data, expected_data)

    def test_get_pending_events(self):
        """
        Filtering for pending events should return events with status "Pending".
        """
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        response = self.client.get(
            self.url,
            {"filter": "pending"},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.pending_event.status, "Pending")
        expected_data = EventSerializer([self.pending_event], many=True, context={'request': response.wsgi_request}).data
        self.assertEqual(response.data, expected_data)

    def test_get_non_student_user(self):
        """
        If a non-student user tries to access the events, they should get a 403 Forbidden error.
        """
        non_student = User.objects.create_user(
            username="non_student",
            password="password123",
            email="non_student@example.com",
            role="admin"  # Not a student
        )
        token = str(AccessToken.for_user(non_student))
        
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = self.client.get(
            self.url,
            {"filter": "upcoming"},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data.get("error"), "Only students can retrieve society events.")

    def test_get_no_auth(self):
        """
        If no authentication token is provided, should return 401 Unauthorized.
        """
        response = self.client.get(
            self.url,
            {"filter": "upcoming"},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)