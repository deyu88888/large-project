from unittest.mock import patch
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase
from rest_framework import status
from api.models import Society, User, ActivityLog, Student
import uuid

class TestAdminSocietyRequestView(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username="admin",
            email=f"admin_{uuid.uuid4().hex}@example.com",
            password="adminpass",
            role="admin",
            is_super_admin=True,
            is_staff=True
        )
        self.regular_user = User.objects.create_user(
            username="student",
            email=f"student_{uuid.uuid4().hex}@example.com",
            password="studentpass",
            role="student"
        )
        self.president_user = Student.objects.create_user(
            username="president",
            email=f"president_{uuid.uuid4().hex}@example.com",
            password="presidentpass",
            role="student"
        )
        self.pending_society = Society.objects.create(
            name="Pending Society",
            description="Pending society",
            status="Pending",
            president=self.president_user,
            approved_by=self.admin_user
        )
        self.approved_society = Society.objects.create(
            name="Approved Society",
            description="Approved society",
            status="Approved",
            president=self.president_user,
            approved_by=self.admin_user
        )

    def test_admin_put_approve_society_request(self):
        self.client.force_authenticate(user=self.admin_user)
        update_data = {"status": "Approved"}
        response = self.client.put(
            f"/api/admin/society/request/pending/{self.pending_society.id}",
            update_data,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["status"], "Approved")
        self.assertTrue(ActivityLog.objects.filter(
            action_type="Approve",
            target_id=self.pending_society.id,
            performed_by=self.admin_user
        ).exists())

    def test_admin_put_reject_society_request(self):
        self.client.force_authenticate(user=self.admin_user)
        update_data = {"status": "Rejected"}
        response = self.client.put(
            f"/api/admin/society/request/pending/{self.pending_society.id}",
            update_data,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["status"], "Rejected")
        self.assertTrue(ActivityLog.objects.filter(
            action_type="Reject",
            target_id=self.pending_society.id,
            performed_by=self.admin_user
        ).exists())