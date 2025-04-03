import json
from django.urls import reverse
from unittest.mock import patch
from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from api.models import SocietyRequest, Society, Student

User = get_user_model()

class AdminSocietyRequestViewTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin",
            password="adminpass",
            role="admin",
            email="admin@example.com",
            is_staff=True,
            is_superuser=False
        )
        self.student = Student.objects.create_user(
            username="student",
            password="studentpass",
            email="student@example.com",
            major="CS"
        )
        self.pending_request = SocietyRequest.objects.create(
            name="New Society",
            description="test",
            from_student=self.student,
            intent="CreateSoc",
            approved=None,
            category="Test Category"
        )
        self.society = Society.objects.create(
            name="ApprovedSoc",
            description="desc",
            president=self.student,
            status="Approved",
            category="Existing Category",
            social_media_links={}
        )
        self.get_url = reverse("request_society", args=["Pending"])
        self.put_url = reverse("request_society", args=[self.pending_request.id])

    @patch("api.views_files.request_views.get_admin_if_user_is_admin")
    def test_get_pending_requests_as_admin(self, mock_get_admin):
        mock_get_admin.return_value = (self.admin, None)
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.get_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) >= 1)
        self.assertTrue(any(req['id'] == self.pending_request.id for req in response.data))

    @patch("api.views_files.request_views.get_admin_if_user_is_admin")
    def test_get_societies_by_status(self, mock_get_admin):
        approved_url = reverse("request_society", args=["Approved"])
        mock_get_admin.return_value = (self.admin, None)
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(approved_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) >= 1)
        self.assertTrue(any(soc['id'] == self.society.id for soc in response.data))

    @patch("api.views_files.request_views.get_admin_if_user_is_admin")
    def test_get_permission_denied(self, mock_get_admin):
        mock_get_admin.return_value = (None, Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN))
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.get_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["error"], "Unauthorized")

    @patch("api.views_files.request_views.get_admin_if_user_is_admin")
    def test_put_update_success(self, mock_get_admin):
        mock_get_admin.return_value = (self.admin, None)
        self.client.force_authenticate(user=self.admin)
        data = {"approved": True}
        response = self.client.put(self.put_url, data=json.dumps(data), content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Society request updated successfully.")
        self.assertEqual(response.data["data"]["approved"], True)
        self.pending_request.refresh_from_db()
        self.assertEqual(self.pending_request.approved, True)
        created_society_exists = Society.objects.filter(
            name=self.pending_request.name,
            president=self.student,
            category=self.pending_request.category
        ).exists()
        self.assertTrue(created_society_exists)

    @patch("api.views_files.request_views.get_admin_if_user_is_admin")
    def test_put_request_not_found(self, mock_get_admin):
        mock_get_admin.return_value = (self.admin, None)
        self.client.force_authenticate(user=self.admin)
        bad_url = reverse("request_society", args=[999999])
        data = {"approved": True}
        response = self.client.put(bad_url, data=json.dumps(data), content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["error"], "Society request not found.")

    @patch("api.views_files.request_views.get_admin_if_user_is_admin")
    def test_put_invalid_data(self, mock_get_admin):
        mock_get_admin.return_value = (self.admin, None)
        self.client.force_authenticate(user=self.admin)
        data = {"approved": "not_a_boolean"}
        response = self.client.put(self.put_url, data=json.dumps(data), content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('approved', response.data)

    @patch("api.views_files.request_views.get_admin_if_user_is_admin")
    def test_put_permission_denied(self, mock_get_admin):
        error_response = Response(
            {"error": "You are not authorized to approve."},
            status=status.HTTP_403_FORBIDDEN
        )
        mock_get_admin.return_value = (None, error_response)
        self.client.force_authenticate(user=self.admin)
        data = {"approved": True}
        response = self.client.put(self.put_url, data=json.dumps(data), content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["error"], "You are not authorized to approve.")