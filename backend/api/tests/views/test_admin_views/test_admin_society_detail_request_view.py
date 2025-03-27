from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from rest_framework.response import Response
from django.contrib.auth.hashers import make_password
from unittest.mock import patch, MagicMock
from api.models import User, Student, Society, SocietyRequest


class AdminSocietyDetailRequestViewTests(TestCase):
    """Tests for the AdminSocietyDetailRequestView."""

    def setUp(self):
        """Set up test data for each test."""
        # Create admin user
        self.admin_user = User.objects.create(
            username="admin_user",
            email="admin@example.com",
            password=make_password("adminpassword"),
            first_name="Admin",
            last_name="User",
            role="admin"
        )
        
        # Create regular user (not an admin)
        self.regular_user = User.objects.create(
            username="regular_user",
            email="regular@example.com",
            password=make_password("regularpassword"),
            first_name="Regular",
            last_name="User",
            role="user"
        )
        
        # Create student user (society president)
        self.student = Student.objects.create(
            username="student_user",
            email="student@example.com",
            password=make_password("studentpassword"),
            first_name="Student",
            last_name="User",
            major="Computer Science",
            is_president=True
        )
        
        # Create society with valid social media links
        self.society = Society.objects.create(
            name="Original Society Name",
            description="Original description",
            category="Technology",
            president=self.student,
            approved_by=self.admin_user,
            status="Approved",
            social_media_links={"X": "https://x.com/originalsociety", "Email": "original@example.com"},
            membership_requirements="Original requirements",
            upcoming_projects_or_plans="Original plans"
        )
        
        self.society_request = SocietyRequest.objects.create(
            society=self.society,
            from_student=self.student,
            intent="UpdateSoc",
            approved=False,
            name="Updated Society Name",
            description="Updated description",
            category="Arts",
            social_media_links={
                "X": "https://x.com/updatedsociety", 
                "Instagram": "https://instagram.com/updatedsociety",
                "Email": "updated@example.com"
            },
            membership_requirements="Updated requirements",
            upcoming_projects_or_plans="Updated plans"
        )
        
        self.client = APIClient()
        self.list_url = reverse('society_detail_requests')
        self.detail_url = reverse('society_detail_request_action', kwargs={'request_id': self.society_request.id})

    @patch('api.views_files.admin_views.get_admin_if_user_is_admin')
    def test_get_society_detail_requests_as_admin(self, mock_get_admin):
        """Test getting society detail requests as an admin."""
        mock_get_admin.return_value = (self.admin_user, None)
        
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.list_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['intent'], 'UpdateSoc')
        self.assertEqual(response.data[0]['name'], 'Updated Society Name')
        
        mock_get_admin.assert_called_once_with(self.admin_user, 'view pending society detail requests')

    @patch('api.views_files.admin_views.get_admin_if_user_is_admin')
    def test_get_society_detail_requests_as_non_admin(self, mock_get_admin):
        """Test that non-admins cannot get society detail requests."""
        error_response = Response(
            {"error": "You do not have permission to view pending society detail requests."},
            status=status.HTTP_403_FORBIDDEN
        )
        mock_get_admin.return_value = (None, error_response)
        self.client.force_authenticate(user=self.regular_user)
        
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        mock_get_admin.assert_called_once_with(self.regular_user, 'view pending society detail requests')

    @patch('api.views_files.admin_views.get_admin_if_user_is_admin')
    @patch('api.views_files.admin_views.get_channel_layer')
    @patch('api.views_files.admin_views.async_to_sync')
    def test_approve_society_detail_request(self, mock_async_to_sync, mock_get_channel_layer, mock_get_admin):
        """Test approving a society detail request."""
        mock_get_admin.return_value = (self.admin_user, None)
        
        mock_channel = MagicMock()
        mock_get_channel_layer.return_value = mock_channel
        mock_channel_send = MagicMock()
        mock_async_to_sync.return_value = mock_channel_send
        
        self.client.force_authenticate(user=self.admin_user)
        
        data = {"status": "Approved"}
        response = self.client.put(self.detail_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('successfully', response.data['message'])
        
        self.society.refresh_from_db()
        self.assertEqual(self.society.name, "Updated Society Name")
        self.assertEqual(self.society.description, "Updated description")
        self.assertEqual(self.society.category, "Arts")
        
        social_links = self.society.social_media_links
        self.assertEqual(social_links["X"], "https://x.com/updatedsociety")
        self.assertEqual(social_links["Instagram"], "https://instagram.com/updatedsociety")
        self.assertTrue("Email" in social_links)
        
        self.assertEqual(self.society.membership_requirements, "Updated requirements")
        self.assertEqual(self.society.upcoming_projects_or_plans, "Updated plans")
        
        self.society_request.refresh_from_db()
        self.assertTrue(self.society_request.approved)
        mock_channel_send.assert_called_once()
        mock_get_admin.assert_called_once_with(self.admin_user, 'approve or reject society detail requests')

    def test_update_request_as_non_admin(self):
        """Test that non-admins cannot update society detail requests."""
        self.client.force_authenticate(user=self.regular_user)
        data = {"status": "Approved"}
        response = self.client.put(self.detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @patch('api.views_files.admin_views.get_admin_if_user_is_admin')
    @patch('api.views_files.admin_views.get_channel_layer')
    @patch('api.views_files.admin_views.async_to_sync')
    def test_approve_partial_update_request(self, mock_async_to_sync, mock_get_channel_layer, mock_get_admin):
        """Test approving a society detail request with partial updates."""
        mock_get_admin.return_value = (self.admin_user, None)
        mock_channel_layer = MagicMock()
        mock_get_channel_layer.return_value = mock_channel_layer
        
        mock_channel_send = MagicMock()
        mock_async_to_sync.return_value = mock_channel_send
        
        partial_request = SocietyRequest.objects.create(
            society=self.society,
            from_student=self.student,
            intent="UpdateSoc",
            approved=False,
            name="Partially Updated Name",
            social_media_links={"WhatsApp": "https://wa.me/1234567890"}
        )
        
        self.client.force_authenticate(user=self.admin_user)
        
        original_description = self.society.description
        original_category = self.society.category
        original_requirements = self.society.membership_requirements
        original_plans = self.society.upcoming_projects_or_plans
        partial_url = reverse('society_detail_request_action', kwargs={'request_id': partial_request.id})
        data = {"status": "Approved"}
        response = self.client.put(partial_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.society.refresh_from_db()
        self.assertEqual(self.society.name, "Partially Updated Name")
        self.assertEqual(self.society.description, original_description)
        self.assertEqual(self.society.category, original_category)
        self.assertEqual(self.society.social_media_links["WhatsApp"], "https://wa.me/1234567890")
        self.assertEqual(self.society.membership_requirements, original_requirements)
        self.assertEqual(self.society.upcoming_projects_or_plans, original_plans)


class TestAdminSocietyDetailRequestViewAPITestCase(APITestCase):
    """Alternative implementation using APITestCase."""
    
    def setUp(self):
        self.super_admin = User.objects.create_user(
            username="superadmin",
            email="superadmin@example.com",
            password="superpass",
            role="admin",
            is_super_admin=True,
            is_staff=True
        )

        self.student = Student.objects.create_user(
            username="student1",
            email="student1@example.com",
            password="studentpass",
            role="student",
            major="Computer Science"
        )

        self.society = Society.objects.create(
            name="Original Name",
            description="Original description",
            president=self.student,
            approved_by=self.super_admin,
            status="Approved"
        )

        self.society_request = SocietyRequest.objects.create(
            intent="UpdateSoc",
            society=self.society,
            name="Updated Name",
            description="Updated description",
            category="Academic",
            social_media_links={"Instagram": "https://instagram.com/updated_society"},  
            membership_requirements="New criteria",
            upcoming_projects_or_plans="New projects",
            icon=None,
            from_student=self.student,
            approved=False  
        )

        self.client = APIClient()
        self.list_url = "/api/admin/society-detail-request/"
        self.detail_url = f"/api/admin/society-detail-request/{self.society_request.id}/"

    def test_get_pending_society_requests_authenticated_admin(self):
        self.client.force_authenticate(user=self.super_admin)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)  

    def test_get_pending_society_requests_unauthenticated(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_approve_society_detail_request(self):
        self.client.force_authenticate(user=self.super_admin)
        response = self.client.put(self.detail_url, {"status": "Approved"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.society.refresh_from_db()
        self.assertEqual(self.society.name, "Updated Name")
        self.assertEqual(self.society.description, "Updated description")

    def test_reject_society_detail_request(self):
        self.client.force_authenticate(user=self.super_admin)
        response = self.client.put(self.detail_url, {"status": "Rejected"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.society.refresh_from_db()
        self.assertNotEqual(self.society.name, "Updated Name")