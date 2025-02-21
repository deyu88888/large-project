from rest_framework.test import APITestCase
from rest_framework import status
from api.models import Student, Notification, Event, User
from api.tests.file_deletion import delete_file


class TestNotificationsView(APITestCase):
    def setUp(self):
        # Create a student user
        self.student = Student.objects.create_user(
            username="teststudent",
            password="password123",
            email="student@example.com",
            first_name="Test",
            last_name="Student",
        )

        # Force authentication as this student
        self.client.force_authenticate(user=self.student)

        # Create an event for the notifications
        self.event = Event.objects.create(title="Test Event")

        # Create sample notifications
        self.notification1 = Notification.objects.create(
            for_event=self.event,
            for_student=self.student,
            message="Notification 1",
        )
        self.notification2 = Notification.objects.create(
            for_event=self.event,
            for_student=self.student,
            message="Notification 2",
        )

        self.url = "/api/dashboard/notifications/"

    def test_notifications_authenticated_student(self):
        """A logged-in student can view their notifications."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)

    def test_notifications_non_student_user(self):
        """A logged-in user who is not a student cannot access notifications."""
        self.client.logout()

        # Create a non-student user (role="admin") using the base User model
        non_student = User.objects.create_user(
            username="nonstudent",
            password="password123",
            email="nonstudent@example.com",
            first_name="Jane",
            last_name="Smith",
            role="admin"
        )

        self.client.force_authenticate(user=non_student)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_notifications_unauthenticated_user(self):
        """An unauthenticated user cannot access notifications."""
        self.client.logout()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def tearDown(self):
        for student in Student.objects.all():
            if student.icon:
                delete_file(student.icon.path)
