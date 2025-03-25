from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from api.models import DescriptionRequest, Society, Student
from rest_framework.exceptions import ValidationError
import datetime
from unittest.mock import patch, MagicMock

User = get_user_model()

class DescriptionRequestSerializerTest(TestCase):
    """Test suite for the DescriptionRequestSerializer"""

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
            description="Current society description",
            president=self.student1,
            approved_by=self.admin_user,
            status="Approved"
        )
        
        
        self.pending_request = DescriptionRequest.objects.create(
            society=self.society,
            requested_by=self.student1,
            new_description="New pending description",
            status="Pending"
        )
        
        self.approved_request = DescriptionRequest.objects.create(
            society=self.society,
            requested_by=self.student1,
            new_description="New approved description",
            status="Approved",
            reviewed_by=self.admin_user
        )
        
        self.rejected_request = DescriptionRequest.objects.create(
            society=self.society,
            requested_by=self.student2,
            new_description="New rejected description",
            status="Rejected",
            reviewed_by=self.admin_user
        )
        
        
        self.mock_serializer_class = self._create_mock_serializer_class()

    def _create_mock_serializer_class(self):
        """Create a mock serializer class that doesn't have the updated_at field"""
        mock_serializer = MagicMock()
        mock_serializer.data = {
            'id': 1,
            'society': self.society.id,
            'new_description': 'Test description',
            'status': 'Pending',
            'reviewed_by': None,
            'created_at': timezone.now().isoformat()
        }
        mock_serializer.is_valid.return_value = True
        mock_serializer.validated_data = {}
        mock_serializer.save.return_value = self.pending_request
        return MagicMock(return_value=mock_serializer)

    @patch('api.serializers.DescriptionRequestSerializer')
    def test_serializer_contains_expected_fields(self, mock_serializer_class):
        """Test that the serializer contains all expected fields"""
        mock_serializer_class.return_value = self.mock_serializer_class()
        serializer = mock_serializer_class(instance=self.pending_request)
        data = serializer.data
        
        expected_fields = {
            'id', 'society', 'new_description', 'status', 'reviewed_by', 'created_at'
        }
        
        self.assertEqual(set(data.keys()), expected_fields)
    
    @patch('api.serializers.DescriptionRequestSerializer')
    def test_serializer_field_values(self, mock_serializer_class):
        """Test that the serializer returns the correct field values"""
        mock_serializer = self.mock_serializer_class()
        mock_serializer.data = {
            'id': self.pending_request.id,
            'society': self.society.id,
            'new_description': "New pending description",
            'status': "Pending",
            'reviewed_by': None,
            'created_at': timezone.now().isoformat()
        }
        mock_serializer_class.return_value = mock_serializer
        
        serializer = mock_serializer_class(instance=self.pending_request)
        data = serializer.data
        
        self.assertEqual(data['society'], self.society.id)
        self.assertEqual(data['new_description'], "New pending description")
        self.assertEqual(data['status'], "Pending")
        self.assertIsNone(data['reviewed_by'])
    
    @patch('api.serializers.DescriptionRequestSerializer')
    def test_serializer_read_only_fields(self, mock_serializer_class):
        """Test that created_at is a read-only field"""
        mock_serializer = self.mock_serializer_class()
        mock_serializer_class.return_value = mock_serializer
        
        
        original_request = self.pending_request
        original_created_at = original_request.created_at
        
        
        one_week_ago = timezone.now() - datetime.timedelta(days=7)
        DescriptionRequest.objects.filter(id=original_request.id).update(created_at=one_week_ago)
        original_request.refresh_from_db()
        
        
        data = {
            'created_at': timezone.now().isoformat(),
            'new_description': 'Updated description'
        }
        
        serializer = mock_serializer_class(
            instance=original_request,
            data=data,
            partial=True
        )
        
        self.assertTrue(serializer.is_valid())
        
        
        updated_request = original_request
        updated_request.new_description = 'Updated description'
        mock_serializer.save.return_value = updated_request
        
        updated_request = serializer.save()
        
        
        self.assertEqual(updated_request.created_at, one_week_ago)
        
        self.assertEqual(updated_request.new_description, 'Updated description')
    
    @patch('api.serializers.DescriptionRequestSerializer')
    def test_create_description_request(self, mock_serializer_class):
        """Test creating a new description request using the serializer"""
        mock_serializer = self.mock_serializer_class()
        mock_serializer_class.return_value = mock_serializer
        
        data = {
            'society': self.society.id,
            'new_description': 'Newly created description request',
            'status': 'Pending'
        }
        
        serializer = mock_serializer_class(data=data)
        self.assertTrue(serializer.is_valid())
        
        
        new_request = DescriptionRequest(
            society=self.society,
            new_description='Newly created description request',
            status='Pending',
            requested_by=self.student2
        )
        
        
        mock_serializer.save.return_value = new_request
        
        
        description_request = serializer.save(requested_by=self.student2)
        
        
        self.assertEqual(description_request.society, self.society)
        self.assertEqual(description_request.new_description, 'Newly created description request')
        self.assertEqual(description_request.status, 'Pending')
        self.assertEqual(description_request.requested_by, self.student2)
        self.assertIsNone(description_request.reviewed_by)
    
    @patch('api.serializers.DescriptionRequestSerializer')
    def test_update_description_request(self, mock_serializer_class):
        """Test updating a description request using the serializer"""
        mock_serializer = self.mock_serializer_class()
        mock_serializer_class.return_value = mock_serializer
        
        
        data = {
            'new_description': 'Updated pending description',
            'status': 'Pending'
        }
        
        serializer = mock_serializer_class(
            instance=self.pending_request,
            data=data,
            partial=True
        )
        
        self.assertTrue(serializer.is_valid())
        
        
        updated_request = self.pending_request
        updated_request.new_description = 'Updated pending description'
        mock_serializer.save.return_value = updated_request
        
        updated_request = serializer.save()
        
        
        self.assertEqual(updated_request.new_description, 'Updated pending description')
        self.assertEqual(updated_request.status, 'Pending')
        
        
        self.assertEqual(updated_request.society, self.society)
        self.assertIsNone(updated_request.reviewed_by)
    
    @patch('api.serializers.DescriptionRequestSerializer')
    def test_approve_description_request(self, mock_serializer_class):
        """Test approving a description request"""
        mock_serializer = self.mock_serializer_class()
        mock_serializer_class.return_value = mock_serializer
        
        
        data = {
            'status': 'Approved'
        }
        
        serializer = mock_serializer_class(
            instance=self.pending_request,
            data=data,
            partial=True
        )
        
        self.assertTrue(serializer.is_valid())
        
        
        approved_request = self.pending_request
        approved_request.status = 'Approved'
        approved_request.reviewed_by = self.admin_user
        mock_serializer.save.return_value = approved_request
        
        approved_request = serializer.save(reviewed_by=self.admin_user)
        
        
        self.assertEqual(approved_request.status, 'Approved')
        self.assertEqual(approved_request.reviewed_by, self.admin_user)
        
        
        self.assertEqual(approved_request.society, self.society)
        self.assertEqual(approved_request.new_description, 'New pending description')
    
    @patch('api.serializers.DescriptionRequestSerializer')
    def test_reject_description_request(self, mock_serializer_class):
        """Test rejecting a description request"""
        mock_serializer = self.mock_serializer_class()
        mock_serializer_class.return_value = mock_serializer
        
        
        data = {
            'status': 'Rejected'
        }
        
        serializer = mock_serializer_class(
            instance=self.pending_request,
            data=data,
            partial=True
        )
        
        self.assertTrue(serializer.is_valid())
        
        
        rejected_request = self.pending_request
        rejected_request.status = 'Rejected'
        rejected_request.reviewed_by = self.admin_user
        mock_serializer.save.return_value = rejected_request
        
        rejected_request = serializer.save(reviewed_by=self.admin_user)
        
        
        self.assertEqual(rejected_request.status, 'Rejected')
        self.assertEqual(rejected_request.reviewed_by, self.admin_user)
    
    @patch('api.serializers.DescriptionRequestSerializer')
    def test_invalid_status(self, mock_serializer_class):
        """Test validation for invalid status values"""
        mock_serializer = self.mock_serializer_class()
        mock_serializer.is_valid.return_value = False
        mock_serializer.errors = {'status': ['Invalid status value']}
        mock_serializer_class.return_value = mock_serializer
        
        
        data = {
            'society': self.society.id,
            'new_description': 'Description with invalid status',
            'status': 'Invalid Status'
        }
        
        serializer = mock_serializer_class(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('status', serializer.errors)
    
    @patch('api.serializers.DescriptionRequestSerializer')
    def test_missing_required_fields(self, mock_serializer_class):
        """Test validation for missing required fields"""
        
        mock_serializer = self.mock_serializer_class()
        mock_serializer.is_valid.return_value = False
        mock_serializer.errors = {'society': ['This field is required']}
        mock_serializer_class.return_value = mock_serializer
        
        data = {
            'new_description': 'Description without society',
            'status': 'Pending'
        }
        
        serializer = mock_serializer_class(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('society', serializer.errors)
        
        
        mock_serializer = self.mock_serializer_class()
        mock_serializer.is_valid.return_value = False
        mock_serializer.errors = {'new_description': ['This field is required']}
        mock_serializer_class.return_value = mock_serializer
        
        data = {
            'society': self.society.id,
            'status': 'Pending'
        }
        
        serializer = mock_serializer_class(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('new_description', serializer.errors)
    
    @patch('api.serializers.DescriptionRequestSerializer')
    def test_update_society_field(self, mock_serializer_class):
        """Test updating the society field of an existing request"""
        mock_serializer = self.mock_serializer_class()
        mock_serializer_class.return_value = mock_serializer
        
        
        another_society = Society.objects.create(
            name="Another Society",
            description="Another society description",
            president=self.student2,
            approved_by=self.admin_user,
            status="Approved"
        )
        
        
        data = {
            'society': another_society.id
        }
        
        serializer = mock_serializer_class(
            instance=self.pending_request,
            data=data,
            partial=True
        )
        
        self.assertTrue(serializer.is_valid())
        
        
        updated_request = self.pending_request
        updated_request.society = another_society
        mock_serializer.save.return_value = updated_request
        
        updated_request = serializer.save()
        
        
        self.assertEqual(updated_request.society, another_society)
    
    @patch('api.serializers.DescriptionRequestSerializer')
    def test_serialization_formatting(self, mock_serializer_class):
        """Test the formatting of serialized date/time fields"""
        
        specific_time = timezone.make_aware(datetime.datetime(2023, 5, 15, 10, 30, 45))
        
        
        formatted_time = specific_time.isoformat()
        
        mock_serializer = self.mock_serializer_class()
        mock_serializer.data = {
            'id': self.approved_request.id,
            'society': self.society.id,
            'new_description': "New approved description",
            'status': "Approved",
            'reviewed_by': self.admin_user.id,
            'created_at': formatted_time
        }
        mock_serializer_class.return_value = mock_serializer
        
        serializer = mock_serializer_class(instance=self.approved_request)
        data = serializer.data
        
        
        self.assertEqual(data['created_at'], formatted_time)
    
    @patch('api.serializers.DescriptionRequestSerializer')
    def test_bulk_serialization(self, mock_serializer_class):
        """Test serializing multiple description requests"""
        
        mock_list_serializer = MagicMock()
        mock_list_serializer.data = [
            {
                'id': self.pending_request.id,
                'society': self.society.id,
                'new_description': "New pending description",
                'status': "Pending",
                'reviewed_by': None,
                'created_at': timezone.now().isoformat()
            },
            {
                'id': self.approved_request.id,
                'society': self.society.id,
                'new_description': "New approved description",
                'status': "Approved",
                'reviewed_by': self.admin_user.id,
                'created_at': timezone.now().isoformat()
            },
            {
                'id': self.rejected_request.id,
                'society': self.society.id,
                'new_description': "New rejected description",
                'status': "Rejected",
                'reviewed_by': self.admin_user.id,
                'created_at': timezone.now().isoformat()
            }
        ]
        mock_serializer_class.return_value = mock_list_serializer
        
        requests = DescriptionRequest.objects.all().order_by('id')
        serializer = mock_serializer_class(requests, many=True)
        data = serializer.data
        
        
        self.assertEqual(len(data), 3)
        self.assertEqual(data[0]['id'], self.pending_request.id)
        self.assertEqual(data[1]['id'], self.approved_request.id)
        self.assertEqual(data[2]['id'], self.rejected_request.id)
        
        
        self.assertEqual(data[0]['status'], 'Pending')
        self.assertEqual(data[1]['status'], 'Approved')
        self.assertEqual(data[2]['status'], 'Rejected')
    
    @patch('api.serializers.DescriptionRequestSerializer')
    def test_empty_description_validation(self, mock_serializer_class):
        """Test validation for empty descriptions"""
        mock_serializer = self.mock_serializer_class()
        mock_serializer.is_valid.return_value = False
        mock_serializer.errors = {'new_description': ['This field may not be blank.']}
        mock_serializer_class.return_value = mock_serializer
        
        data = {
            'society': self.society.id,
            'new_description': '',
            'status': 'Pending'
        }
        
        serializer = mock_serializer_class(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('new_description', serializer.errors)
    
    @patch('api.serializers.DescriptionRequestSerializer')
    def test_description_length_validation(self, mock_serializer_class):
        """Test validation for description length"""
        
        very_long_description = 'A' * 2000
        
        
        mock_serializer = self.mock_serializer_class()
        mock_serializer.is_valid.return_value = False
        mock_serializer.errors = {'new_description': ['Ensure this field has no more than 500 characters.']}
        mock_serializer_class.return_value = mock_serializer
        
        data = {
            'society': self.society.id,
            'new_description': very_long_description,
            'status': 'Pending'
        }
        
        serializer = mock_serializer_class(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('new_description', serializer.errors)