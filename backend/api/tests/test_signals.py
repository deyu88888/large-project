import datetime
from unittest.mock import patch, MagicMock

from django.core.cache import cache
from django.test import TestCase, override_settings
from django.utils.timezone import now
from api.models import Student, Society, Notification, Event, SocietyRequest, User, \
    EventRequest, Award, AwardStudent
from api.signals import broadcast_dashboard_update

@override_settings(CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}})
class SignalsTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Create a student and society for testing.
        cls.admin = User.objects.create_user(
            username="admin_user",
            email="admin@example.com",
            password="adminpassword",
            first_name="Admin",
            last_name="User",
            role="admin",
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
        
        # Clear notifications before creating test objects
        Notification.objects.all().delete()
        
        # Create society request
        cls.society_request = SocietyRequest.objects.create(
            name="Test Society2",
            president=cls.student,
            from_student=cls.student,
            intent="CreateSoc",
            category="General",
            social_media_links={},
            membership_requirements="",
            upcoming_projects_or_plans=""
        )

        cls.event = Event.objects.create(
            title="Dummy Event",
            main_description="A test event description",
            location="Room 101",
            date=now().date(),
            start_time=datetime.time(12, 0),
            duration=datetime.timedelta(hours=1),
            hosted_by=cls.society,
            status="Pending"  
        )
    
        # Clear notifications before creating event request
        Notification.objects.all().delete()
        
        cls.event_request = EventRequest.objects.create(
            event=cls.event,
            hosted_by=cls.society,
            from_student=cls.student,
            intent="CreateEve",
        )
        
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
        cache.clear()

    def test_update_is_president_on_save(self):
        self.assertFalse(self.student.is_president)
        self.student.president_of = self.society
        self.student.save()
        self.student.refresh_from_db()
        self.assertTrue(self.student.is_president)

    def test_notify_on_society_requested(self):
        # Create a new society request to ensure notifications are created after test setup
        Notification.objects.all().delete()
        
        new_society_request = SocietyRequest.objects.create(
            name="New Test Society",
            president=self.student,
            from_student=self.student,
            intent="CreateSoc",
            category="Academic",
            social_media_links={},
            membership_requirements="",
            upcoming_projects_or_plans=""
        )
        
        notifications = Notification.objects.filter(
            for_user=self.admin,
            header="Society requested",
        )
        self.assertTrue(notifications.exists(), "No society request notification found")
        self.assertIn("request", notifications.first().body.lower())

    @patch("api.signals.broadcast_dashboard_update")
    def test_notify_on_society_request_approved(self, mock_broadcast):
        # Clear all notifications
        Notification.objects.all().delete()
        
        # Set approved to True
        self.society_request.approved = True
        self.society_request.save()
        
        notifications = Notification.objects.filter(
            for_user=self.society.president,
            header="Society Approved"
        )
        self.assertTrue(notifications.exists(), f"No society approval notification found. Notifications: {notifications}")
        self.assertIn("approved", notifications.first().body.lower())
        mock_broadcast.assert_called_once()

    @patch("api.signals.broadcast_dashboard_update")
    def test_notify_on_society_request_rejected(self, mock_broadcast):
        # Clear all notifications
        Notification.objects.all().delete()
        
        # Set approved to False
        self.society_request.approved = False
        self.society_request.save()
        
        notifications = Notification.objects.filter(
            for_user=self.society.president,
            header="Society Denied",
        )
        self.assertTrue(notifications.exists(), "No society rejection notification found")
        self.assertIn("rejected", notifications.first().body.lower())
        mock_broadcast.assert_called_once()

    def test_notify_on_event_requested(self):
        # Clear all existing notifications
        Notification.objects.all().delete()
        
        # Create a new event request
        new_event = Event.objects.create(
            title="New Test Event",
            main_description="Another test event",
            location="Room 102",
            date=now().date(),
            start_time=datetime.time(14, 0),
            duration=datetime.timedelta(hours=2),
            hosted_by=self.society,
            status="Pending"  
        )
        
        new_event_request = EventRequest.objects.create(
            event=new_event,
            hosted_by=self.society,
            from_student=self.student,
            intent="CreateEve",
        )
        
        notifications = Notification.objects.filter(
            for_user=self.admin,
            header="Event requested",
        )
        self.assertTrue(notifications.exists(), "No event request notification found")
        self.assertIn("requested", notifications.first().body.lower())

    def test_notify_on_event_request_approved(self):
        # Clear all notifications
        Notification.objects.all().delete()
        
        # Set approved to True
        self.event_request.approved = True
        self.event_request.save()
        
        notifications = Notification.objects.filter(
            for_user=self.society.president,
            header="Event Approved",
        )
        self.assertTrue(notifications.exists(), "No event approval notification found")
        self.assertIn("approved", notifications.first().body.lower())

    def test_notify_on_event_request_rejected(self):
        # Clear all notifications
        Notification.objects.all().delete()
        
        # Set approved to False
        self.event_request.approved = False
        self.event_request.save()
        
        notifications = Notification.objects.filter(
            for_user=self.society.president,
            header="Event Denied",
        )
        self.assertTrue(notifications.exists(), "No event rejection notification found")
        self.assertIn("rejected", notifications.first().body.lower())

    def test_dashboard_update_mechanism(self):
        # Simple test to verify the function exists
        broadcast_dashboard_update()
        self.assertTrue(True)
    
    def test_notify_student_award(self):
        # Clear all notifications
        Notification.objects.all().delete()
        
        award = Award.objects.create(
            rank="Bronze",
            title="Test Award",
            description="Test description"
        )
        
        award_student = AwardStudent.objects.create(
            award=award,
            student=self.student
        )
        
        notifications = Notification.objects.filter(
            for_user=self.student,
            header="Award Received",
        )
        self.assertTrue(notifications.exists(), "No award notification found")
        self.assertIn("award", notifications.first().body.lower())