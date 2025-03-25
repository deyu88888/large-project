from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from api.serializers import BroadcastSerializer
from api.models import BroadcastMessage, Society, Event, Student

User = get_user_model()

class BroadcastSerializerTest(TestCase):
    """Test suite for the BroadcastSerializer"""

    def setUp(self):
        """Set up test data for the serializer tests"""
        
        self.admin_user = User.objects.create_user(
            username="adminuser",
            email="admin@example.com",
            password="password123",
            role="admin"
        )
        
        self.student_user1 = Student.objects.create(
            username="student1",
            email="student1@example.com",
            password="password123",
            first_name="Student",
            last_name="One",
            role="student"
        )
        
        self.student_user2 = Student.objects.create(
            username="student2",
            email="student2@example.com",
            password="password123",
            first_name="Student",
            last_name="Two",
            role="student"
        )
        
        
        self.society1 = Society.objects.create(
            name="Test Society 1",
            description="A test society",
            president=self.student_user1,
            approved_by=self.admin_user,
            status="Approved"
        )
        
        self.society2 = Society.objects.create(
            name="Test Society 2",
            description="Another test society",
            president=self.student_user2,
            approved_by=self.admin_user,
            status="Approved"
        )
        
        
        self.event1 = Event.objects.create(
            title="Test Event 1",
            description="A test event",
            date=timezone.now().date(),
            start_time=timezone.now().time(),
            hosted_by=self.society1,
            location="Test Location"
        )
        
        self.event2 = Event.objects.create(
            title="Test Event 2",
            description="Another test event",
            date=timezone.now().date(),
            start_time=timezone.now().time(),
            hosted_by=self.society2,
            location="Test Location 2"
        )
        
        
        self.broadcast = BroadcastMessage.objects.create(
            sender=self.admin_user,
            message="Test broadcast message"
        )
        self.broadcast.societies.add(self.society1)
        self.broadcast.events.add(self.event1)
        self.broadcast.recipients.add(self.student_user1)

    def test_broadcast_serializer_contains_expected_fields(self):
        """Test that the serializer contains all expected fields"""
        serializer = BroadcastSerializer(instance=self.broadcast)
        data = serializer.data
        
        self.assertEqual(set(data.keys()), {
            'id', 'sender', 'societies', 'events', 'recipients', 'message', 'created_at'
        })
    
    def test_broadcast_serializer_read_only_fields(self):
        """Test that read-only fields cannot be updated"""
        
        serializer = BroadcastSerializer(instance=self.broadcast)
        initial_data = serializer.data
        
        
        modified_data = {
            'id': 9999,
            'sender': self.student_user1.id,
            'created_at': '2020-01-01T00:00:00Z',
            'message': 'Updated message',
            'societies': [self.society1.id, self.society2.id],
            'events': [self.event1.id, self.event2.id],
            'recipients': [self.student_user1.id, self.student_user2.id]
        }
        
        update_serializer = BroadcastSerializer(
            instance=self.broadcast,
            data=modified_data,
            partial=True
        )
        
        self.assertTrue(update_serializer.is_valid())
        updated_instance = update_serializer.save()
        
        
        self.assertEqual(updated_instance.id, self.broadcast.id)  
        self.assertEqual(updated_instance.sender, self.admin_user)  
        self.assertEqual(updated_instance.message, 'Updated message')  
        
        
        self.assertEqual(set(updated_instance.societies.all()), {self.society1, self.society2})
        self.assertEqual(set(updated_instance.events.all()), {self.event1, self.event2})
        
        recipient_ids = {user.id for user in updated_instance.recipients.all()}
        expected_ids = {self.student_user1.id, self.student_user2.id}
        self.assertEqual(recipient_ids, expected_ids)
    
    def test_create_broadcast_with_serializer(self):
        """Test creating a broadcast message using the serializer"""
        data = {
            'message': 'New broadcast message',
            'societies': [self.society1.id, self.society2.id],
            'events': [self.event2.id],
            'recipients': [self.student_user2.id]
        }
        
        
        serializer = BroadcastSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        
        
        broadcast = serializer.save(sender=self.admin_user)
        
        
        self.assertEqual(broadcast.message, 'New broadcast message')
        self.assertEqual(set(broadcast.societies.all()), {self.society1, self.society2})
        self.assertEqual(set(broadcast.events.all()), {self.event2})
        
        recipient_ids = {user.id for user in broadcast.recipients.all()}
        expected_ids = {self.student_user2.id}
        self.assertEqual(recipient_ids, expected_ids)
        self.assertEqual(broadcast.sender, self.admin_user)
    
    def test_update_broadcast_with_serializer(self):
        """Test updating a broadcast message using the serializer"""
        serializer = BroadcastSerializer(
            instance=self.broadcast,
            data={'message': 'Updated message content'},
            partial=True
        )
        
        self.assertTrue(serializer.is_valid())
        updated_broadcast = serializer.save()
        
        
        self.assertEqual(updated_broadcast.message, 'Updated message content')
        
        self.assertEqual(set(updated_broadcast.societies.all()), {self.society1})
        self.assertEqual(set(updated_broadcast.events.all()), {self.event1})
        
        recipient_ids = {user.id for user in updated_broadcast.recipients.all()}
        expected_ids = {self.student_user1.id}
        self.assertEqual(recipient_ids, expected_ids)
    
    def test_partial_update_broadcast_relationships(self):
        """Test partially updating a broadcast's relationships"""
        serializer = BroadcastSerializer(
            instance=self.broadcast,
            data={
                'societies': [self.society2.id],
                'events': [],  
                'recipients': [self.student_user1.id, self.student_user2.id]
            },
            partial=True
        )
        
        self.assertTrue(serializer.is_valid())
        updated_broadcast = serializer.save()
        
        
        self.assertEqual(set(updated_broadcast.societies.all()), {self.society2})
        self.assertEqual(list(updated_broadcast.events.all()), [])  
        
        recipient_ids = {user.id for user in updated_broadcast.recipients.all()}
        expected_ids = {self.student_user1.id, self.student_user2.id}
        self.assertEqual(recipient_ids, expected_ids)
        
        self.assertEqual(updated_broadcast.message, 'Test broadcast message')
    
    def test_serializer_data_types(self):
        """Test that serialized data has correct types"""
        serializer = BroadcastSerializer(instance=self.broadcast)
        data = serializer.data
        
        
        self.assertIsInstance(data['id'], int)
        self.assertIsInstance(data['sender'], int)
        
        
        self.assertIsInstance(data['societies'], list)
        self.assertIsInstance(data['events'], list)
        self.assertIsInstance(data['recipients'], list)
        
        
        self.assertIsInstance(data['message'], str)
        self.assertIsInstance(data['created_at'], str)  
    
    def test_validate_required_fields(self):
        """Test validation for required fields"""
        
        data = {
            'societies': [self.society1.id],
            'events': [self.event1.id],
            'recipients': [self.student_user1.id]
        }
        
        serializer = BroadcastSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('message', serializer.errors)
    
    def test_message_cannot_be_empty(self):
        """Test that message cannot be empty"""
        data = {
            'message': '',
            'societies': [self.society1.id],
            'events': [self.event1.id],
            'recipients': [self.student_user1.id]
        }
        
        serializer = BroadcastSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('message', serializer.errors)
    
    def test_broadcast_with_no_recipients(self):
        """Test creating a broadcast with no direct recipients"""
        data = {
            'message': 'Broadcast to societies and events only',
            'societies': [self.society1.id],
            'events': [self.event1.id],
            'recipients': []
        }
        
        serializer = BroadcastSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        broadcast = serializer.save(sender=self.admin_user)
        
        
        self.assertEqual(set(broadcast.societies.all()), {self.society1})
        self.assertEqual(set(broadcast.events.all()), {self.event1})
        self.assertEqual(list(broadcast.recipients.all()), [])  
    
    def test_broadcast_with_no_targets(self):
        """Test creating a broadcast with no targets at all (should still be valid)"""
        data = {
            'message': 'Broadcast with no targets',
            'societies': [],
            'events': [],
            'recipients': []
        }
        
        serializer = BroadcastSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        broadcast = serializer.save(sender=self.admin_user)
        
        
        self.assertEqual(list(broadcast.societies.all()), [])
        self.assertEqual(list(broadcast.events.all()), [])
        self.assertEqual(list(broadcast.recipients.all()), [])