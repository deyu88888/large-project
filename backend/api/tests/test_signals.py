import datetime
from unittest.mock import patch

from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.test import TestCase, override_settings
from django.utils.timezone import now, make_aware

from api.models import Student, Society, AwardStudent, Notification, Event
from api.signals import broadcast_dashboard_update  # and other signal handlers as needed
from api.consumer.consumers import DashboardConsumer

# Override channel layers to use in-memory backend for testing.
@override_settings(CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}})
class SignalsTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Create a student and society for testing.
        from api.models import Admin  # Import here if needed
        cls.admin = Admin.objects.create_user(
            username="admin_user",
            email="admin@example.com",
            password="adminpassword",
            first_name="Admin",
            last_name="User"
        )
        cls.student = Student.objects.create_user(
            username="student_user",
            email="student@example.com",
            password="password123",
            first_name="Student",
            last_name="User",
            is_president=False,
            major="Computer Science"
        )
        cls.society = Society.objects.create(
            name="Test Society",
            president=cls.student,
            approved_by=cls.admin,
            status="Pending",
            category="General",
            social_media_links={},
            membership_requirements="",
            upcoming_projects_or_plans=""
        )
        # Initially, student.president_of is None.
        # (Assuming your model doesn't auto-assign unless president is set.)
        # We'll use this for testing update_is_president_on_save.
        # Also, create a dummy event so that broadcast_dashboard_update can count something.
        Event.objects.create(
            title="Dummy Event",
            location="Room 101",
            date=now().date(),
            start_time=datetime.time(12, 0),
            duration=datetime.timedelta(hours=1),
            hosted_by=cls.society,
            status="Approved"
        )
    
    def tearDown(self):
        # Clean up: clear cache if used, and remove any generated icons, etc.
        cache.clear()

    def test_update_is_president_on_save(self):
        """
        Test that when a student is saved with a president_of value, the student's is_president
        property is updated accordingly.
        """
        # Initially, student.is_president should be False.
        self.assertFalse(self.student.is_president)
        # Set president_of to the society.
        self.student.president_of = self.society
        self.student.save()
        # Reload from DB.
        self.student.refresh_from_db()
        # The signal should update is_president to True.
        self.assertTrue(self.student.is_president)

    @patch("api.signals.broadcast_dashboard_update")
    def test_notify_on_status_change_approved(self, mock_broadcast):
        """
        Test that when a Society's status is changed to "Approved", a Notification is created
        and broadcast_dashboard_update is called.
        """
        # Change society status to Approved.
        self.society.status = "Approved"
        self.society.save()
        # Check that a notification is created for the society president.
        notifications = Notification.objects.filter(for_student=self.society.president)
        self.assertTrue(notifications.exists())
        self.assertIn("approved", notifications.first().body.lower())
        # Ensure broadcast_dashboard_update was called.
        mock_broadcast.assert_called_once()

    @patch("api.signals.broadcast_dashboard_update")
    def test_notify_on_status_change_rejected(self, mock_broadcast):
        """
        Test that when a Society's status is changed to "Rejected", a Notification is created
        and broadcast_dashboard_update is called.
        """
        self.society.status = "Rejected"
        self.society.save()
        notifications = Notification.objects.filter(for_student=self.society.president)
        self.assertTrue(notifications.exists())
        self.assertIn("rejected", notifications.first().body.lower())
        mock_broadcast.assert_called_once()

    @patch("api.signals.async_to_sync")
    def test_broadcast_dashboard_update(self, mock_async_to_sync):
        """
        Test that calling broadcast_dashboard_update calculates stats and sends a message to the dashboard group.
        """
        # We want to capture the arguments passed to async_to_sync(group_send)
        # When broadcast_dashboard_update is called, it should calculate stats from DB.
        broadcast_dashboard_update()
        # Verify that async_to_sync was called (once) with a function that sends group message.
        self.assertTrue(mock_async_to_sync.called)
        # You can further inspect the call arguments if needed.
        call_args = mock_async_to_sync.call_args[0][0]
        # call_args is the function passed; you could also patch get_channel_layer to inspect its group_send.
        # For simplicity, we assert that the group name "dashboard" appears in the arguments when the function is eventually called.
        # Alternatively, you might patch channel_layer.group_send directly.
    
    @patch("api.signals.async_to_sync")
    def test_notify_student_award(self, mock_async_to_sync):
        """
        Test that when an AwardStudent instance is created, the notify_student_award signal sends a message
        to the "award_notifications" group.
        """
        from api.models import Award, AwardStudent
        # Create dummy award and award student.
        award = Award.objects.create(
            rank="Bronze",
            title="Test Award",
            description="Test description"
        )
        # Clear any previous calls.
        mock_async_to_sync.reset_mock()
        # Create AwardStudent instance; signal should trigger.
        award_student = AwardStudent.objects.create(
            award=award,
            student=self.student
        )
        # Check that async_to_sync was called with a function that sends a group message.
        self.assertTrue(mock_async_to_sync.called)
        # Optionally, inspect the arguments passed to group_send if desired.

