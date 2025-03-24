from django.test import TestCase
from django.utils import timezone
from django.db import IntegrityError
from api.models import BroadcastMessage, User, Society, Student, Event


class BroadcastMessageModelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Create admin user as sender
        cls.admin_user = User.objects.create_user(
            username="admin_sender",
            email="admin@example.com",
            password="password123",
            role="admin",
            is_staff=True
        )
        
        # Create recipient users
        cls.recipient1 = User.objects.create_user(
            username="recipient1",
            email="recipient1@example.com",
            password="password123"
        )
        
        cls.recipient2 = User.objects.create_user(
            username="recipient2",
            email="recipient2@example.com",
            password="password123"
        )
        
        # Create a student for society president
        cls.student = Student.objects.create_user(
            username="student1",
            email="student1@example.com",
            password="password123",
            role="student",
            first_name="Test",
            last_name="Student",
            status="Approved"
        )
        
        # Create a society
        cls.society = Society.objects.create(
            name="Test Society",
            description="A test society",
            status="Approved",
            president=cls.student,
            approved_by=cls.admin_user
        )
        
        # Create an event
        cls.event = Event.objects.create(
            title="Test Event",
            description="A test event",
            hosted_by=cls.society,
            date=timezone.now().date(),
            start_time=timezone.now().time(),
            location="Test Location"
        )
        
        # Create a basic broadcast message
        cls.broadcast = BroadcastMessage.objects.create(
            sender=cls.admin_user,
            message="Test broadcast message"
        )

    def test_broadcast_creation(self):
        self.assertEqual(self.broadcast.sender, self.admin_user)
        self.assertEqual(self.broadcast.message, "Test broadcast message")
        self.assertIsNotNone(self.broadcast.created_at)
        self.assertEqual(self.broadcast.societies.count(), 0)
        self.assertEqual(self.broadcast.events.count(), 0)
        self.assertEqual(self.broadcast.recipients.count(), 0)

    def test_string_representation(self):
        expected_str = f"Broadcast from {self.admin_user.username} at {self.broadcast.created_at:%Y-%m-%d %H:%M}"
        self.assertEqual(str(self.broadcast), expected_str)

    def test_broadcast_with_recipients(self):
        broadcast = BroadcastMessage.objects.create(
            sender=self.admin_user,
            message="Broadcast with recipients"
        )
        broadcast.recipients.add(self.recipient1, self.recipient2)
        
        self.assertEqual(broadcast.recipients.count(), 2)
        self.assertIn(self.recipient1, broadcast.recipients.all())
        self.assertIn(self.recipient2, broadcast.recipients.all())
        
        # Verify reciprocal relationship
        self.assertIn(broadcast, self.recipient1.received_broadcasts.all())
        self.assertIn(broadcast, self.recipient2.received_broadcasts.all())

    def test_broadcast_with_societies(self):
        broadcast = BroadcastMessage.objects.create(
            sender=self.admin_user,
            message="Broadcast to societies"
        )
        broadcast.societies.add(self.society)
        
        self.assertEqual(broadcast.societies.count(), 1)
        self.assertIn(self.society, broadcast.societies.all())
        
        # Verify reciprocal relationship
        self.assertIn(broadcast, self.society.broadcasts.all())

    def test_broadcast_with_events(self):
        broadcast = BroadcastMessage.objects.create(
            sender=self.admin_user,
            message="Broadcast to events"
        )
        broadcast.events.add(self.event)
        
        self.assertEqual(broadcast.events.count(), 1)
        self.assertIn(self.event, broadcast.events.all())
        
        # Verify reciprocal relationship
        self.assertIn(broadcast, self.event.broadcasts.all())

    def test_broadcast_with_mixed_targets(self):
        broadcast = BroadcastMessage.objects.create(
            sender=self.admin_user,
            message="Broadcast to multiple target types"
        )
        broadcast.recipients.add(self.recipient1)
        broadcast.societies.add(self.society)
        broadcast.events.add(self.event)
        
        self.assertEqual(broadcast.recipients.count(), 1)
        self.assertEqual(broadcast.societies.count(), 1)
        self.assertEqual(broadcast.events.count(), 1)

    def test_broadcast_without_targets(self):
        broadcast = BroadcastMessage.objects.create(
            sender=self.admin_user,
            message="Broadcast with no targets"
        )
        
        self.assertEqual(broadcast.recipients.count(), 0)
        self.assertEqual(broadcast.societies.count(), 0)
        self.assertEqual(broadcast.events.count(), 0)

    def test_broadcast_with_empty_message_allowed(self):
        broadcast = BroadcastMessage.objects.create(
            sender=self.admin_user,
            message=""
        )
        
        self.assertEqual(broadcast.message, "")

    def test_sender_required(self):
        with self.assertRaises(IntegrityError):
            BroadcastMessage.objects.create(
                message="Missing sender"
            )

    def test_broadcast_delete_with_sender_cascade(self):
        broadcast = BroadcastMessage.objects.create(
            sender=self.recipient1,
            message="This broadcast will be deleted with sender"
        )
        broadcast_id = broadcast.id
        
        # Delete the sender
        self.recipient1.delete()
        
        # Verify broadcast is also deleted (CASCADE)
        with self.assertRaises(BroadcastMessage.DoesNotExist):
            BroadcastMessage.objects.get(id=broadcast_id)

    def test_remove_society_from_broadcast(self):
        broadcast = BroadcastMessage.objects.create(
            sender=self.admin_user,
            message="Broadcast with society to be removed"
        )
        broadcast.societies.add(self.society)
        self.assertEqual(broadcast.societies.count(), 1)
        
        # Remove society
        broadcast.societies.remove(self.society)
        self.assertEqual(broadcast.societies.count(), 0)
        self.assertNotIn(self.society, broadcast.societies.all())

    def test_broadcast_creation_time(self):
        # Check created_at is set automatically and is recent
        current_time = timezone.now()
        broadcast = BroadcastMessage.objects.create(
            sender=self.admin_user,
            message="Timestamp test"
        )
        
        # Verify created_at is set and is within the last minute
        self.assertIsNotNone(broadcast.created_at)
        time_diff = current_time - broadcast.created_at
        self.assertLess(time_diff.total_seconds(), 60)

    def test_broadcast_filtering_by_recipient(self):
        # Create multiple broadcasts with different recipients
        broadcast1 = BroadcastMessage.objects.create(
            sender=self.admin_user,
            message="For recipient 1"
        )
        broadcast1.recipients.add(self.recipient1)
        
        broadcast2 = BroadcastMessage.objects.create(
            sender=self.admin_user,
            message="For recipient 2"
        )
        broadcast2.recipients.add(self.recipient2)
        
        # Verify filtering works correctly
        recipient1_broadcasts = BroadcastMessage.objects.filter(recipients=self.recipient1)
        self.assertEqual(recipient1_broadcasts.count(), 1)
        self.assertIn(broadcast1, recipient1_broadcasts)
        self.assertNotIn(broadcast2, recipient1_broadcasts)
        
        recipient2_broadcasts = BroadcastMessage.objects.filter(recipients=self.recipient2)
        self.assertEqual(recipient2_broadcasts.count(), 1)
        self.assertIn(broadcast2, recipient2_broadcasts)
        self.assertNotIn(broadcast1, recipient2_broadcasts)

    def test_broadcast_filtering_by_society(self):
        # Create another society
        society2 = Society.objects.create(
            name="Another Society",
            description="Another test society",
            status="Approved",
            president=self.student,
            approved_by=self.admin_user
        )
        
        # Create broadcasts for different societies
        broadcast1 = BroadcastMessage.objects.create(
            sender=self.admin_user,
            message="For society 1"
        )
        broadcast1.societies.add(self.society)
        
        broadcast2 = BroadcastMessage.objects.create(
            sender=self.admin_user,
            message="For society 2"
        )
        broadcast2.societies.add(society2)
        
        # Verify filtering works correctly
        society1_broadcasts = BroadcastMessage.objects.filter(societies=self.society)
        self.assertEqual(society1_broadcasts.count(), 1)
        self.assertIn(broadcast1, society1_broadcasts)
        self.assertNotIn(broadcast2, society1_broadcasts)
        
        society2_broadcasts = BroadcastMessage.objects.filter(societies=society2)
        self.assertEqual(society2_broadcasts.count(), 1)
        self.assertIn(broadcast2, society2_broadcasts)
        self.assertNotIn(broadcast1, society2_broadcasts)

    def test_broadcast_filtering_by_sender(self):
        # Create broadcasts from different senders
        admin_broadcast = BroadcastMessage.objects.create(
            sender=self.admin_user,
            message="From admin"
        )
        
        student_broadcast = BroadcastMessage.objects.create(
            sender=self.student,
            message="From student"
        )
        
        # Verify filtering works correctly
        admin_broadcasts = BroadcastMessage.objects.filter(sender=self.admin_user)
        self.assertIn(self.broadcast, admin_broadcasts)  # Original broadcast
        self.assertIn(admin_broadcast, admin_broadcasts)
        self.assertNotIn(student_broadcast, admin_broadcasts)
        
        student_broadcasts = BroadcastMessage.objects.filter(sender=self.student)
        self.assertIn(student_broadcast, student_broadcasts)
        self.assertNotIn(admin_broadcast, student_broadcasts)