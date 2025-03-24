from datetime import timedelta
from django.test import TestCase
from django.utils.timezone import now
from api.models import Notification, Event, Student, Society, User
from api.serializers import NotificationSerializer
from api.tests.file_deletion import delete_file

# pylint: disable=no-member


class NotificationSerializerTestCase(TestCase):
    """Test cases for the Notification Serializer"""
    def setUp(self):
        # Create an admin for society approval
        self.admin = User.objects.create_user(
            username="admin_user",
            password="adminpassword",
            email="admin@example.com",
            first_name="Admin",
            last_name="User",
        )
        
        # Create a student
        self.student = Student.objects.create_user(
            username="test_student",
            password="Password123",
            first_name="Test",
            last_name="Student",
            email="test_student@example.com",
            role="student",
            major="Computer Science",
        )

        # Create a society with all required fields
        self.society = Society.objects.create(
            name="Test Society",
            president=self.student,
            approved_by=self.admin,  # Required field
            status="Approved",  # Add status if needed
            social_media_links={"Email": "society@example.com"}  # Required field
        )

        # Create an event
        self.event = Event.objects.create(
            title="Test Event",
            description="This is a test event",
            date=now().date(),
            start_time=now().time(),
            duration=timedelta(hours=2),
            hosted_by=self.society,
            location="Test Location"
        )

        # Create a notification
        self.notification = Notification.objects.create(
            header=str(self.event),
            body=f"Notification for {str(self.event)}",
            for_user=self.student,
            is_read=False,
            is_important=False,
        )

        # Sample data for serialization
        self.serializer = None
        self.data = {
            "header": str(self.event),
            "body": f"Notification for {str(self.event)}",
            "for_user": self.student.id,
            "is_read": False,
            "is_important": False,
        }

    def test_notification_serialization(self):
        """Test to ensure the serializer is correctly serializing"""
        self.serializer = NotificationSerializer(instance=self.notification)
        data = self.serializer.data

        self.assertEqual(data["header"], self.notification.header)
        self.assertEqual(data["body"], self.notification.body)
        self.assertEqual(data["for_user"], self.student.id)
        self.assertEqual(data["is_read"], self.notification.is_read)
        self.assertEqual(data["is_important"], self.notification.is_important)

    def test_notification_deserialization(self):
        """Test to ensure deserialization functions correctly"""
        self.serializer = NotificationSerializer(data=self.data)
        self._assert_serializer_is_valid()

        notification = self.serializer.save()

        self.assertEqual(notification.header, self.data["header"])
        self.assertEqual(notification.body, self.data["body"])
        self.assertEqual(notification.for_user.id, self.data["for_user"])
        self.assertEqual(notification.is_read, self.data["is_read"])
        self.assertEqual(notification.is_important, self.data["is_important"])

    def test_notification_update(self):
        """Test notification update functions correctly"""
        self.assertFalse(self.notification.is_read)
        self.data["is_read"] = True
        self.serializer = NotificationSerializer(
            instance=self.notification,
            data=self.data,
            partial=True
        )
        self._assert_serializer_is_valid()
        self.serializer.save()

        self.assertTrue(self.notification.is_read)

    def _assert_serializer_is_valid(self):
        if not self.serializer.is_valid():
            self.fail("Test serializer should be valid")

    def _assert_serializer_is_invalid(self):
        if self.serializer.is_valid():
            self.fail("Test serializer should be invalid")

    def tearDown(self):
        for society in Society.objects.all():
            if society.icon:
                delete_file(society.icon.path)
        for student in Student.objects.all():
            if student.icon:
                delete_file(student.icon.path)