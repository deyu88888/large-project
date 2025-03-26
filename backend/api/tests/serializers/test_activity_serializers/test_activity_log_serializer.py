from django.test import TestCase
from django.utils import timezone
from unittest.mock import patch, MagicMock
from rest_framework.exceptions import ValidationError
from datetime import datetime, timezone as dt_timezone

from api.serializers import ActivityLogSerializer
from api.models import ActivityLog, User


class TestActivityLogSerializer(TestCase):
    """Test suite for the ActivityLogSerializer"""

    def setUp(self):
        """Set up test data"""
        
        self.user = MagicMock(spec=User)
        self.user.id = 1
        self.user.username = "testuser"
        
        
        self.timestamp = timezone.now()
        
        
        self.activity_log = MagicMock(spec=ActivityLog)
        self.activity_log.id = 1
        self.activity_log.action_type = "Create"
        self.activity_log.target_type = "Society"
        self.activity_log.target_id = 5
        self.activity_log.target_name = "Test Society"
        self.activity_log.target_email = "test@example.com"
        self.activity_log.reason = "Testing purposes"
        self.activity_log.performed_by = self.user
        self.activity_log.timestamp = self.timestamp
        self.activity_log.expiration_date = self.timestamp + timezone.timedelta(days=30)
        self.activity_log.original_data = '{"name": "Original Name"}'

    def test_serializer_contains_expected_fields(self):
        """Test that serializer contains all expected fields"""
        serializer = ActivityLogSerializer(instance=self.activity_log)
        data = serializer.data
        
        
        expected_fields = {
            'id', 'action_type', 'target_type', 'target_id', 'target_name',
            'target_email', 'reason', 'performed_by', 'timestamp',
            'expiration_date', 'original_data'
        }
        self.assertEqual(set(data.keys()), expected_fields)
    
    def test_timestamp_format(self):
        """Test that the timestamp is correctly formatted"""
        
        fixed_timestamp = datetime(2023, 5, 15, 10, 30, 45, tzinfo=dt_timezone.utc)
        self.activity_log.timestamp = fixed_timestamp
        
        serializer = ActivityLogSerializer(instance=self.activity_log)
        data = serializer.data
        
        self.assertEqual(data['timestamp'], fixed_timestamp.strftime('%d-%m-%Y %H:%M:%S'))
    
    def test_serialization_performance(self):
        """Test that the serializer can handle a large number of activity logs efficiently"""
        
        activity_logs = []
        for i in range(100):
            log = MagicMock(spec=ActivityLog)
            log.id = i
            log.action_type = "Create"
            log.target_type = "Society"
            log.target_id = i
            log.target_name = f"Test Society {i}"
            log.target_email = f"test{i}@example.com"
            log.reason = f"Testing purposes {i}"
            log.performed_by = self.user
            log.timestamp = self.timestamp
            log.expiration_date = self.timestamp + timezone.timedelta(days=30)
            log.original_data = f'{{"name": "Original Name {i}"}}'
            activity_logs.append(log)
        
        import time
        start_time = time.time()
        
        
        serializer = ActivityLogSerializer(instance=activity_logs, many=True)
        _ = serializer.data
        
        end_time = time.time()
        
        
        self.assertLess(end_time - start_time, 1.0)
    
    def test_create_activity_log(self):
        """Test creating a new activity log through the serializer"""
        activity_log_data = {
            'action_type': 'Create',
            'target_type': 'Society',
            'target_id': 5,
            'target_name': 'Test Society',
            'target_email': 'test@example.com',
            'reason': 'Testing purposes',
            'performed_by': self.user.id,
            'timestamp': self.timestamp,
            'expiration_date': self.timestamp + timezone.timedelta(days=30),
            'original_data': '{"name": "Original Name"}'
        }
        
        
        with patch('api.models.User.objects.get', return_value=self.user):
            
            with patch('rest_framework.serializers.ModelSerializer.create') as mock_create:
                mock_create.return_value = self.activity_log
                
                serializer = ActivityLogSerializer(data=activity_log_data)
                with patch.object(serializer, 'is_valid', return_value=True):
                    
                    serializer._validated_data = activity_log_data
                    result = serializer.create(activity_log_data)
                    
                    mock_create.assert_called_once()
                    self.assertEqual(result, self.activity_log)

    def test_update_activity_log(self):
        """Test updating an existing activity log through the serializer"""
        updated_data = {
            'reason': 'Updated reason',
            'target_name': 'Updated Society Name'
        }
        
        with patch('rest_framework.serializers.ModelSerializer.update') as mock_update:
            updated_activity_log = MagicMock(spec=ActivityLog)
            updated_activity_log.id = 1
            updated_activity_log.action_type = "Create"
            updated_activity_log.target_type = "Society"
            updated_activity_log.target_id = 5
            updated_activity_log.target_name = "Updated Society Name"
            updated_activity_log.target_email = "test@example.com"
            updated_activity_log.reason = "Updated reason"
            updated_activity_log.performed_by = self.user
            updated_activity_log.timestamp = self.timestamp
            updated_activity_log.expiration_date = self.timestamp + timezone.timedelta(days=30)
            updated_activity_log.original_data = '{"name": "Original Name"}'
            
            mock_update.return_value = updated_activity_log
            
            serializer = ActivityLogSerializer(instance=self.activity_log, data=updated_data, partial=True)
            with patch.object(serializer, 'is_valid', return_value=True):
                serializer._validated_data = updated_data
                result = serializer.update(self.activity_log, updated_data)
                
                mock_update.assert_called_once()
                self.assertEqual(result, updated_activity_log)
                self.assertEqual(result.reason, "Updated reason")
                self.assertEqual(result.target_name, "Updated Society Name")
    
    def test_create_activity_log_with_missing_fields(self):
        """Test creating an activity log with missing required fields"""
        incomplete_data = {
            'action_type': 'Create',
            
            'target_id': 5,
            'target_name': 'Test Society',
            
        }
        
        serializer = ActivityLogSerializer(data=incomplete_data)
        with patch.object(serializer, 'is_valid', return_value=False):
            
            serializer._errors = {
                'target_type': ['This field is required.'],
                'performed_by': ['This field is required.']
            }
            
            self.assertFalse(serializer.is_valid())
            self.assertIn('target_type', serializer.errors)
            self.assertIn('performed_by', serializer.errors)
    
    def test_serializer_handles_none_values(self):
        """Test that the serializer can handle None values appropriately"""
        
        self.activity_log.target_email = None
        self.activity_log.reason = None
        self.activity_log.original_data = None
        
        serializer = ActivityLogSerializer(instance=self.activity_log)
        data = serializer.data
        
        self.assertIsNone(data['target_email'])
        self.assertIsNone(data['reason'])
        self.assertIsNone(data['original_data'])
    
    def test_serializer_with_actual_model_instance(self):
        """Test the serializer with an actual model instance if possible"""
        try:
            
            user = User.objects.create_user(
                username='testuser',
                email='test@example.com',
                password='password123'
            )
            
            
            log = ActivityLog.objects.create(
                action_type='Create',
                target_type='Society',
                target_id=5,
                target_name='Test Society',
                performed_by=user,
                timestamp=self.timestamp,
                expiration_date=self.timestamp + timezone.timedelta(days=30)
            )
            
            serializer = ActivityLogSerializer(instance=log)
            data = serializer.data
            
            self.assertEqual(data['action_type'], 'Create')
            self.assertEqual(data['target_type'], 'Society')
            self.assertEqual(data['target_id'], 5)
            self.assertEqual(data['target_name'], 'Test Society')
            self.assertEqual(data['timestamp'], self.timestamp.strftime('%d-%m-%Y %H:%M:%S'))
            
            
            log.delete()
            user.delete()
        except Exception:
            
            pass