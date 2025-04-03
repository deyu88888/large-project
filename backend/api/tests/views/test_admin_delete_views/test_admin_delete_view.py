import json
from datetime import timedelta
from unittest.mock import patch, MagicMock
from django.utils import timezone
from django.urls import reverse, path, include
from django.test import override_settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APITestCase, URLPatternsTestCase

from api.models import User, ActivityLog, Student, Society, Event
from api.views import AdminDeleteView, get_admin_if_user_is_admin


class TestAdminDeleteView(APITestCase, URLPatternsTestCase):
    """Tests for the AdminDeleteView class.
    """
    
    urlpatterns = [
        path('admin/delete/<str:target_type>/<int:target_id>', AdminDeleteView.as_view(), name='delete'),
    ]

    def setUp(self):
        """Set up test data."""
        
        self.get_admin_patcher = patch('api.views.get_admin_if_user_is_admin')
        self.mock_get_admin = self.get_admin_patcher.start()
        
        
        self.delete_logs_patcher = patch('api.models.ActivityLog.delete_expired_logs')
        self.mock_delete_logs = self.delete_logs_patcher.start()
        
        self.super_admin = User.objects.create(
            username="superadmin",
            email="superadmin@example.com",
            role="admin",
            is_super_admin=True,
            first_name="Super",
            last_name="Admin"
        )
        
        
        self.admin = User.objects.create(
            username="regularadmin",
            email="admin@example.com",
            role="admin",
            is_super_admin=False,
            first_name="Regular",
            last_name="Admin"
        )
        
        
        self.student = Student.objects.create(
            username="teststudent",
            email="student@example.com",
            role="student",
            first_name="Test",
            last_name="Student",
            major="Computer Science"
        )
        
        
        self.society = Society.objects.create(
            name="Test Society",
            description="A test society",
            president=self.student,
            category="Academic",
            approved_by=self.admin  
        )
        
        
        self.event = Event.objects.create(
            title="Test Event",
            main_description="A test event",
            hosted_by=self.society,
            location="Test Location"
        )
        
        
        self.original_model_mapping = getattr(AdminDeleteView, 'model_mapping', {})
        
        
        self.model_mapping_patcher = patch.object(
            AdminDeleteView, 
            'model_mapping', 
            {
                "Admin": User,
                "Student": Student,
                "Society": Society,
                "Event": Event
            }
        )
        self.model_mapping_patcher.start()
        
        
        self.delete_url = reverse('delete', kwargs={'target_type': 'Student', 'target_id': self.student.id})
        
        
        self.serialize_patcher = patch.object(
            AdminDeleteView, 
            'serialize_model_data', 
            return_value={'id': 1, 'name': 'Test'}
        )
        self.mock_serialize = self.serialize_patcher.start()
        
    def tearDown(self):
        """Clean up after tests."""
        
        self.serialize_patcher.stop()
        self.get_admin_patcher.stop()
        self.delete_logs_patcher.stop()
        self.model_mapping_patcher.stop()
        
    def test_delete_unauthorized_user(self):
        """Test deletion by an unauthorized user."""
        
        self.client.force_authenticate(user=self.student)
        
        
        error_response = Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        self.mock_get_admin.return_value = (None, error_response)
        
        response = self.client.delete(self.delete_url, {'reason': 'Test reason'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Student.objects.filter(id=self.student.id).count(), 1)
        
    def test_delete_student_by_admin(self):
        """Test successful deletion of a student by an admin."""
        
        self.client.force_authenticate(user=self.admin)
        
        
        self.mock_get_admin.return_value = (self.admin, None)
        
        
        non_president_student = Student.objects.create(
            username="non_president",
            email="non_president@example.com",
            role="student",
            first_name="Non",
            last_name="President",
            major="Computer Science"
        )
        
        
        delete_url = reverse('delete', kwargs={'target_type': 'Student', 'target_id': non_president_student.id})
        
        response = self.client.delete(delete_url, {'reason': 'Test reason'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Student.objects.filter(id=non_president_student.id).count(), 0)
        
        
        log = ActivityLog.objects.last()
        self.assertEqual(log.action_type, "Delete")
        self.assertEqual(log.target_type, "Student")
        
        
        
        self.assertEqual(str(log.target_id), str(non_president_student.id))
        
        self.assertEqual(log.performed_by, self.admin)
        self.assertEqual(log.reason, "Test reason")
        
    def test_delete_society_by_admin(self):
        """Test successful deletion of a society by an admin."""
        
        self.client.force_authenticate(user=self.admin)
        
        
        self.mock_get_admin.return_value = (self.admin, None)
        
        delete_url = reverse('delete', kwargs={'target_type': 'Society', 'target_id': self.society.id})
        response = self.client.delete(delete_url, {'reason': 'Test reason'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Society.objects.filter(id=self.society.id).count(), 0)
        
    def test_delete_event_by_admin(self):
        """Test successful deletion of an event by an admin."""
        
        self.client.force_authenticate(user=self.admin)
        
        
        self.mock_get_admin.return_value = (self.admin, None)
        
        delete_url = reverse('delete', kwargs={'target_type': 'Event', 'target_id': self.event.id})
        response = self.client.delete(delete_url, {'reason': 'Test reason'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Event.objects.filter(id=self.event.id).count(), 0)
        
    def test_delete_admin_by_regular_admin(self):
        """Test deletion of an admin by a regular admin (should fail)."""
        
        self.client.force_authenticate(user=self.admin)
        
        
        self.mock_get_admin.return_value = (self.admin, None)
        
        delete_url = reverse('delete', kwargs={'target_type': 'Admin', 'target_id': self.super_admin.id})
        response = self.client.delete(delete_url, {'reason': 'Test reason'}, format='json')
        
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(User.objects.filter(id=self.super_admin.id).count(), 1)
        
    def test_delete_admin_by_super_admin(self):
        """Test deletion of an admin by a super admin (should succeed)."""
        
        self.client.force_authenticate(user=self.super_admin)
        
        
        self.mock_get_admin.return_value = (self.super_admin, None)
        
        delete_url = reverse('delete', kwargs={'target_type': 'Admin', 'target_id': self.admin.id})
        response = self.client.delete(delete_url, {'reason': 'Test reason'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertEqual(User.objects.filter(id=self.admin.id, role="admin").count(), 0)
        
    def test_self_delete_by_admin(self):
        """Test admin trying to delete their own account (should fail)."""
        
        self.client.force_authenticate(user=self.admin)
        
        
        self.mock_get_admin.return_value = (self.admin, None)
        
        delete_url = reverse('delete', kwargs={'target_type': 'Admin', 'target_id': self.admin.id})
        response = self.client.delete(delete_url, {'reason': 'Test reason'}, format='json')
        
        
        
        
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN])
        self.assertEqual(User.objects.filter(id=self.admin.id).count(), 1)
        
    def test_delete_invalid_target_type(self):
        """Test deletion with an invalid target type."""
        
        self.client.force_authenticate(user=self.admin)
        
        
        self.mock_get_admin.return_value = (self.admin, None)
        
        delete_url = reverse('delete', kwargs={'target_type': 'InvalidType', 'target_id': 1})
        response = self.client.delete(delete_url, {'reason': 'Test reason'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
    def test_delete_nonexistent_target(self):
        """Test deletion of a nonexistent target."""
        
        self.client.force_authenticate(user=self.admin)
        
        
        self.mock_get_admin.return_value = (self.admin, None)
        
        delete_url = reverse('delete', kwargs={'target_type': 'Student', 'target_id': 9999})
        response = self.client.delete(delete_url, {'reason': 'Test reason'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
    def test_delete_without_reason(self):
        """Test deletion without providing a reason."""
        
        self.client.force_authenticate(user=self.admin)
        
        
        self.mock_get_admin.return_value = (self.admin, None)
        
        response = self.client.delete(self.delete_url, {}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Student.objects.filter(id=self.student.id).count(), 1)
        
    def test_serialization_error(self):
        """Test handling of serialization errors."""
        
        self.client.force_authenticate(user=self.admin)
        
        
        self.mock_get_admin.return_value = (self.admin, None)
        
        
        self.mock_serialize.side_effect = TypeError("Test error")
        
        response = self.client.delete(self.delete_url, {'reason': 'Test reason'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(Student.objects.filter(id=self.student.id).count(), 1)
        
    def test_expired_logs_deleted(self):
        """Test that expired logs are deleted after a successful deletion."""
        
        self.client.force_authenticate(user=self.admin)
        
        
        self.mock_get_admin.return_value = (self.admin, None)
        
        
        non_president_student = Student.objects.create(
            username="non_president2",
            email="non_president2@example.com",
            role="student",
            first_name="Non",
            last_name="President2",
            major="Computer Science"
        )
        
        
        delete_url = reverse('delete', kwargs={'target_type': 'Student', 'target_id': non_president_student.id})
        
        response = self.client.delete(delete_url, {'reason': 'Test reason'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.mock_delete_logs.assert_called_once()