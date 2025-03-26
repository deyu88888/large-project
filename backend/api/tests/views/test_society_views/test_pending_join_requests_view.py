from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from api.models import Society, Student, User, SocietyRequest
import json


class TestPendingJoinRequestsView(TestCase):
    """
    Test suite for PendingJoinRequestsView which retrieves pending join requests for a student
    """

    def setUp(self):
        """
        Set up test data for the tests
        """
        self.client = APIClient()
        
        
        self.admin_user = User.objects.create_user(
            username='admin_user',
            email='admin@example.com',
            password='adminpass123',
            first_name='Admin',
            last_name='User',
            role='admin'
        )
        
        
        self.regular_user = User.objects.create_user(
            username='regular_user',
            email='regular@example.com',
            password='userpass123',
            first_name='Regular',
            last_name='User'
        )
        
        
        self.student1 = Student.objects.create(
            username='student1',
            email='student1@example.com',
            password='password123',
            first_name='Student',
            last_name='One',
            major='Computer Science'
        )
        
        self.student2 = Student.objects.create(
            username='student2',
            email='student2@example.com',
            password='password123',
            first_name='Student',
            last_name='Two',
            major='Engineering'
        )
        
        
        self.society1 = Society.objects.create(
            name='Test Society 1',
            description='This is test society 1',
            president=self.student1,
            status='Approved',
            approved_by=self.admin_user
        )
        
        self.society2 = Society.objects.create(
            name='Test Society 2',
            description='This is test society 2',
            president=self.student2,
            status='Approved',
            approved_by=self.admin_user
        )
        
        
        self.request1 = SocietyRequest.objects.create(
            society=self.society1,
            from_student=self.student2,
            intent='JoinSoc',
            approved=None
        )
        
        self.request2 = SocietyRequest.objects.create(
            society=self.society2,
            from_student=self.student1,
            intent='JoinSoc',
            approved=None
        )
        
        
        self.approved_request = SocietyRequest.objects.create(
            society=self.society1,
            from_student=self.student1,
            intent='JoinSoc',
            approved=True
        )
        
        
        self.url_pending_requests = reverse('pending-requests')

    def test_authentication_required(self):
        """
        Test that authentication is required to access the view
        """
        
        self.client.credentials()
        
        
        response = self.client.get(self.url_pending_requests)
        
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_student_forbidden(self):
        """
        Test that non-student users receive a 403 Forbidden response
        """
        
        refresh = RefreshToken.for_user(self.regular_user)
        access_token = str(refresh.access_token)
        
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        
        response = self.client.get(self.url_pending_requests)
        
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        
        data = json.loads(response.content)
        self.assertEqual(data["error"], "Only students can view their requests.")

    def test_student_pending_requests(self):
        """
        Test that students can access their pending requests
        """
        
        refresh = RefreshToken.for_user(self.student1)
        access_token = str(refresh.access_token)
        
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        
        response = self.client.get(self.url_pending_requests)
        
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        
        data = json.loads(response.content)
        
        
        self.assertEqual(len(data), 1)
        
        
        self.assertEqual(data[0]['society'], self.society2.id)
        
        
        request_ids = [req['id'] for req in data]
        self.assertIn(self.request2.id, request_ids)
        self.assertNotIn(self.approved_request.id, request_ids)

    def test_student_no_pending_requests(self):
        """
        Test that students with no pending requests get an empty list
        """
        
        student_no_requests = Student.objects.create(
            username='student_no_requests',
            email='no_requests@example.com',
            password='password123',
            first_name='No',
            last_name='Requests',
            major='Philosophy'
        )
        
        
        refresh = RefreshToken.for_user(student_no_requests)
        access_token = str(refresh.access_token)
        
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        
        response = self.client.get(self.url_pending_requests)
        
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        
        data = json.loads(response.content)
        self.assertEqual(len(data), 0)
        self.assertEqual(data, [])

    def test_serialized_data_fields(self):
        """
        Test that the serialized data contains all expected fields
        """
        
        refresh = RefreshToken.for_user(self.student2)
        access_token = str(refresh.access_token)
        
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        
        response = self.client.get(self.url_pending_requests)
        
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        
        data = json.loads(response.content)
        
        
        self.assertTrue(len(data) > 0)
        
        
        expected_fields = [
            'id', 'society', 'from_student', 'intent', 'approved'
        ]
        
        for field in expected_fields:
            self.assertIn(field, data[0])