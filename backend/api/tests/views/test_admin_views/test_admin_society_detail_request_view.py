from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from api.models import User, Student, Society, SocietyRequest
from django.urls import reverse


class TestAdminSocietyDetailRequestView(APITestCase):
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