from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils.timezone import now, timedelta
from api.models import Admin, Notification, Event, Society, Student
from api.tests.file_deletion import delete_file


class NotificationModelTestCase(TestCase):
    """Unit test for the Notification model"""

    def setUp(self):
        
        self.admin = Admin.objects.create(
            username='admin_user',
            first_name='Admin',
            last_name='User',
            email='admin@example.com',
            password='adminpassword',
        )
        # Create a student
        self.student = Student.objects.create_user(
            username="teststudent",
            password="password123",
            email="teststudent@example.com",
            first_name="Test",
            last_name="Student",
        )
        self.society = Society.objects.create(
            name="Test Society",
            leader=self.student,
            approved_by=self.admin,
            category='Technology',
            social_media_links={"Email": "society@example.com"},
        )
        self.society.society_members.add(self.student)

        # Create an event hosted by the society
        self.event = Event.objects.create(
            title="Test Event",
            description="Event description",
            hosted_by=self.society,
            location="KCL Campus",
            date=now().date() + timedelta(days=1),
            start_time=now().time(),
        )

        # Create a notification
        self.notification = Notification.objects.create(
            header=str(self.event),
            body=f"Notification for {str(self.event)}",
            for_student=self.student,
            is_read=False,
            is_important=False,
        )

    def test_notification_valid(self):
        """Test to ensure the notification is valid"""
        self._assert_notification_is_valid()

    def test_student_not_nullable(self):
        """Test ensuring student cannot be None"""
        self.notification.for_student = None
        self._assert_notification_is_invalid()

    def test_is_read_default(self):
        """Test to ensure `is_read` defaults to False"""
        notification = Notification.objects.create(
            for_student=self.student,
        )
        self.assertFalse(notification.is_read)

    def test_is_important_default(self):
        """Test to ensure `is_read` defaults to False"""
        notification = Notification.objects.create(
            for_student=self.student,
        )
        self.assertFalse(notification.is_important)

    def test_string_representation(self):
        """Test the string representation matches the event title"""
        self.assertEqual(
            str(self.notification),
            f"{str(self.event)}\nNotification for {str(self.event)}"
        )

    def test_mark_notification_as_read(self):
        """Test marking a notification as read"""
        self.notification.is_read = True
        self.notification.full_clean()
        self.notification.save()
        self.assertTrue(self.notification.is_read)

    def _assert_notification_is_valid(self):
        try:
            self.notification.full_clean()
        except ValidationError:
            self.fail("Test notification should be valid")

    def _assert_notification_is_invalid(self):
        with self.assertRaises(ValidationError):
            self.notification.full_clean()

    def tearDown(self):
        for society in Society.objects.all():
            if society.icon:
                delete_file(society.icon.path)
        for student in Student.objects.all():
            if student.icon:
                delete_file(student.icon.path)
