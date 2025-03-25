from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory
from datetime import timedelta
from api.serializers import RSVPEventSerializer
from api.models import Event, Society, Student
from rest_framework.exceptions import ValidationError
from unittest.mock import patch, PropertyMock, MagicMock

User = get_user_model()

class RSVPEventSerializerTest(TestCase):
    """Test suite for the RSVPEventSerializer"""

    def setUp(self):
        """Set up test data for the serializer tests"""
        
        self.admin_user = User.objects.create_user(
            username="adminuser",
            email="admin@example.com",
            password="password123",
            role="admin"
        )
        
        
        self.student1 = Student.objects.create(
            username="student1",
            email="student1@example.com",
            password="password123",
            first_name="Student",
            last_name="One",
            role="student",
            status="Approved"
        )
        
        self.student2 = Student.objects.create(
            username="student2",
            email="student2@example.com",
            password="password123",
            first_name="Student",
            last_name="Two",
            role="student",
            status="Approved"
        )
        
        
        self.society = Society.objects.create(
            name="Test Society",
            description="A test society",
            president=self.student1,
            approved_by=self.admin_user,
            status="Approved"
        )
        
        
        self.society.society_members.add(self.student1, self.student2)
        
        
        tomorrow = timezone.now() + timedelta(days=1)
        self.future_event = Event.objects.create(
            title="Future Event",
            main_description="An event in the future",
            date=tomorrow.date(),
            start_time=tomorrow.time(),
            duration=timedelta(hours=2),
            hosted_by=self.society,
            location="Test Location",
            status="Approved"
        )
        
        
        yesterday = timezone.now() - timedelta(days=1)
        self.past_event = Event.objects.create(
            title="Past Event",
            description="An event in the past",
            date=yesterday.date(),
            start_time=yesterday.time(),
            duration=timedelta(hours=2),
            hosted_by=self.society,
            location="Test Location",
            status="Approved"
        )
        
        
        self.full_event = Event.objects.create(
            title="Full Event",
            description="An event that is at capacity",
            date=tomorrow.date(),
            start_time=tomorrow.time(),
            duration=timedelta(hours=2),
            hosted_by=self.society,
            location="Test Location",
            max_capacity=1,
            status="Approved"
        )
        
        self.full_event.current_attendees.add(self.student2)
        
        
        self.rsvp_event = Event.objects.create(
            title="RSVP Event",
            description="An event with RSVPs",
            date=tomorrow.date(),
            start_time=tomorrow.time(),
            duration=timedelta(hours=2),
            hosted_by=self.society,
            location="Test Location",
            status="Approved"
        )
        self.rsvp_event.current_attendees.add(self.student1)
        
        
        self.factory = APIRequestFactory()

    def _create_request(self, user):
        """Helper to create a request with the given user"""
        request = self.factory.get('/')
        request.user = user
        return request

    def test_serializer_contains_expected_fields(self):
        """Test that the serializer contains all expected fields"""
        serializer = RSVPEventSerializer(instance=self.future_event)
        data = serializer.data
        
        expected_fields = {'id', 'title', 'date', 'start_time', 'duration', 'location'}
        self.assertEqual(set(data.keys()), expected_fields)

    @patch('api.models.Student.societies')
    @patch('api.models.Event.has_started')
    def test_rsvp_successful(self, mock_has_started, mock_societies):
        """Test successful RSVP for an event"""
        
        mock_has_started.return_value = False
        
        
        mock_societies_all = MagicMock()
        mock_societies_all.all.return_value = [self.society]
        mock_societies.__get__ = MagicMock(return_value=mock_societies_all)
        
        request = self._create_request(self.student1)
        context = {'request': request, 'action': 'RSVP'}
        
        serializer = RSVPEventSerializer(instance=self.future_event, data={}, context=context)
        serializer.is_valid()
        
        
        attrs = serializer.validate({})
        self.assertEqual(attrs, {})
        
        
        event = serializer.save()
        
        
        self.assertIn(self.student1, event.current_attendees.all())

    @patch('api.models.Student.societies')
    def test_cancel_rsvp_successful(self, mock_societies):
        """Test successful cancellation of an RSVP"""
        
        mock_societies_all = MagicMock()
        mock_societies_all.all.return_value = [self.society]
        mock_societies.__get__ = MagicMock(return_value=mock_societies_all)
        
        request = self._create_request(self.student1)
        context = {'request': request, 'action': 'CANCEL'}
        
        serializer = RSVPEventSerializer(instance=self.rsvp_event, data={}, context=context)
        serializer.is_valid()
        
        
        attrs = serializer.validate({})
        self.assertEqual(attrs, {})
        
        
        event = serializer.save()
        
        
        self.assertNotIn(self.student1, event.current_attendees.all())

    @patch('api.models.Student.societies')
    def test_rsvp_not_society_member(self, mock_societies):
        """Test RSVP validation fails if student is not a society member"""
        
        mock_societies_all = MagicMock()
        mock_societies_all.all.return_value = []
        mock_societies.__get__ = MagicMock(return_value=mock_societies_all)
        
        request = self._create_request(self.student1)
        context = {'request': request, 'action': 'RSVP'}
        
        serializer = RSVPEventSerializer(instance=self.future_event, data={}, context=context)
        
        
        with self.assertRaises(ValidationError) as context:
            serializer.validate({})
        
        self.assertIn("You must be a member", str(context.exception))

    @patch('api.models.Student.societies')
    def test_rsvp_already_rsvpd(self, mock_societies):
        """Test RSVP validation fails if student already RSVP'd"""
        
        mock_societies_all = MagicMock()
        mock_societies_all.all.return_value = [self.society]
        mock_societies.__get__ = MagicMock(return_value=mock_societies_all)
        
        request = self._create_request(self.student1)
        context = {'request': request, 'action': 'RSVP'}
        
        serializer = RSVPEventSerializer(instance=self.rsvp_event, data={}, context=context)
        
        
        with self.assertRaises(ValidationError) as context:
            serializer.validate({})
        
        self.assertIn("already RSVP'd", str(context.exception))

    @patch('api.models.Student.societies')
    def test_rsvp_event_started(self, mock_societies):
        """Test RSVP validation fails if event has started"""
        
        mock_societies_all = MagicMock()
        mock_societies_all.all.return_value = [self.society]
        mock_societies.__get__ = MagicMock(return_value=mock_societies_all)
        
        request = self._create_request(self.student1)
        context = {'request': request, 'action': 'RSVP'}
        
        
        with patch.object(Event, 'has_started', return_value=True):
            serializer = RSVPEventSerializer(instance=self.future_event, data={}, context=context)
            
            
            with self.assertRaises(ValidationError) as context:
                serializer.validate({})
            
            self.assertIn("already started", str(context.exception))

    @patch('api.models.Student.societies')
    def test_rsvp_past_event(self, mock_societies):
        """Test RSVP validation fails for past events"""
        
        mock_societies_all = MagicMock()
        mock_societies_all.all.return_value = [self.society]
        mock_societies.__get__ = MagicMock(return_value=mock_societies_all)
        
        request = self._create_request(self.student1)
        context = {'request': request, 'action': 'RSVP'}
        
        
        with patch.object(Event, 'has_started', return_value=True):
            serializer = RSVPEventSerializer(instance=self.past_event, data={}, context=context)
            
            
            with self.assertRaises(ValidationError) as context:
                serializer.validate({})
            
            self.assertIn("already started", str(context.exception))

    @patch('api.models.Student.societies')
    def test_rsvp_full_event(self, mock_societies):
        """Test RSVP validation fails if event is full"""
        
        mock_societies_all = MagicMock()
        mock_societies_all.all.return_value = [self.society]
        mock_societies.__get__ = MagicMock(return_value=mock_societies_all)
        
        request = self._create_request(self.student1)
        context = {'request': request, 'action': 'RSVP'}
        
        
        with patch.object(Event, 'has_started', return_value=False), \
             patch.object(Event, 'is_full', return_value=True):
            serializer = RSVPEventSerializer(instance=self.full_event, data={}, context=context)
            
            
            with self.assertRaises(ValidationError) as context:
                serializer.validate({})
            
            self.assertIn("event is full", str(context.exception))

    @patch('api.models.Student.societies')
    def test_cancel_not_rsvpd(self, mock_societies):
        """Test cancel validation fails if student hasn't RSVP'd"""
        
        mock_societies_all = MagicMock()
        mock_societies_all.all.return_value = [self.society]
        mock_societies.__get__ = MagicMock(return_value=mock_societies_all)
        
        request = self._create_request(self.student1)
        context = {'request': request, 'action': 'CANCEL'}
        
        serializer = RSVPEventSerializer(instance=self.future_event, data={}, context=context)
        
        
        with self.assertRaises(ValidationError) as context:
            serializer.validate({})
        
        self.assertIn("not RSVP'd", str(context.exception))

    @patch('api.models.Student.societies')
    def test_invalid_action(self, mock_societies):
        """Test with an invalid action in context"""
        
        mock_societies_all = MagicMock()
        mock_societies_all.all.return_value = [self.society]
        mock_societies.__get__ = MagicMock(return_value=mock_societies_all)
        
        request = self._create_request(self.student1)
        context = {'request': request, 'action': 'INVALID'}
        
        serializer = RSVPEventSerializer(instance=self.future_event, data={}, context=context)
        
        
        attrs = serializer.validate({})
        self.assertEqual(attrs, {})
        
        
        original_count = self.future_event.current_attendees.count()
        serializer.save()
        self.assertEqual(original_count, self.future_event.current_attendees.count())

    def test_missing_request_in_context(self):
        """Test behavior when request is missing from context"""
        context = {'action': 'RSVP'}  
        
        serializer = RSVPEventSerializer(instance=self.future_event, data={}, context=context)
        
        
        with self.assertRaises(AttributeError):
            serializer.validate({})

    @patch('api.models.Student.societies')
    def test_multiple_rsvp_actions(self, mock_societies):
        """Test multiple RSVP actions in sequence"""
        
        mock_societies_all = MagicMock()
        mock_societies_all.all.return_value = [self.society]
        mock_societies.__get__ = MagicMock(return_value=mock_societies_all)
        
        
        request = self._create_request(self.student1)
        context = {'request': request, 'action': 'RSVP'}
        
        with patch.object(Event, 'has_started', return_value=False), \
             patch.object(Event, 'is_full', return_value=False):
            serializer = RSVPEventSerializer(instance=self.future_event, data={}, context=context)
            serializer.is_valid()
            serializer.save()
            
            
            self.assertIn(self.student1, self.future_event.current_attendees.all())
            
            
            context = {'request': request, 'action': 'CANCEL'}
            
            serializer = RSVPEventSerializer(instance=self.future_event, data={}, context=context)
            serializer.is_valid()
            serializer.save()
            
            
            self.assertNotIn(self.student1, self.future_event.current_attendees.all())
            
            
            context = {'request': request, 'action': 'RSVP'}
            
            serializer = RSVPEventSerializer(instance=self.future_event, data={}, context=context)
            serializer.is_valid()
            serializer.save()
            
            
            self.assertIn(self.student1, self.future_event.current_attendees.all())

    @patch('api.models.Student.societies')
    def test_rsvp_with_max_capacity_edge_case(self, mock_societies):
        """Test RSVP at capacity boundary"""
        
        mock_societies_all = MagicMock()
        mock_societies_all.all.return_value = [self.society]
        mock_societies.__get__ = MagicMock(return_value=mock_societies_all)
        
        
        event = Event.objects.create(
            title="Capacity Edge Case",
            description="Testing max capacity edge cases",
            date=(timezone.now() + timedelta(days=1)).date(),
            start_time=(timezone.now() + timedelta(days=1)).time(),
            duration=timedelta(hours=2),
            hosted_by=self.society,
            location="Test Location",
            max_capacity=1,
            status="Approved"
        )
        
        
        request = self._create_request(self.student1)
        context = {'request': request, 'action': 'RSVP'}
        
        with patch.object(Event, 'has_started', return_value=False), \
             patch.object(Event, 'is_full', return_value=False):
            serializer = RSVPEventSerializer(instance=event, data={}, context=context)
            serializer.is_valid()
            serializer.save()
            
            self.assertIn(self.student1, event.current_attendees.all())
        
        
        request = self._create_request(self.student2)
        context = {'request': request, 'action': 'RSVP'}
        
        
        with patch.object(Event, 'has_started', return_value=False), \
             patch.object(Event, 'is_full', return_value=True):
            serializer = RSVPEventSerializer(instance=event, data={}, context=context)
            
            with self.assertRaises(ValidationError) as context:
                serializer.validate({})
            
            self.assertIn("event is full", str(context.exception))
        
        
        request = self._create_request(self.student1)
        context = {'request': request, 'action': 'CANCEL'}
        
        serializer = RSVPEventSerializer(instance=event, data={}, context=context)
        serializer.is_valid()
        serializer.save()
        
        
        request = self._create_request(self.student2)
        context = {'request': request, 'action': 'RSVP'}
        
        with patch.object(Event, 'has_started', return_value=False), \
             patch.object(Event, 'is_full', return_value=False):
            serializer = RSVPEventSerializer(instance=event, data={}, context=context)
            serializer.is_valid()
            serializer.save()
            
            self.assertIn(self.student2, event.current_attendees.all())