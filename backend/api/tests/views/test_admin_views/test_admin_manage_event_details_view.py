from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from api.models import User, Student, Society, Event
from django.utils import timezone
from datetime import timedelta, date, time


class TestAdminManageEventDetailsView(APITestCase):
    def setUp(self):
        self.super_admin = User.objects.create_user(
            username="superadmin",
            email="superadmin@example.com",
            password="superpass",
            role="admin",
            is_super_admin=True,
            is_staff=True,
        )

        self.student_president = Student.objects.create_user(
            username="president",
            email="president@example.com",
            password="prespass",
            major="CS"
        )

        self.society = Society.objects.create(
            name="Test Society",
            description="A test society",
            president=self.student_president,
            approved_by=self.super_admin,
            status="Approved"
        )

        self.event = Event.objects.create(
            title="Test Event",
            main_description="Event Description",
            date=timezone.now().date(),
            start_time=timezone.now().time(),
            duration=timedelta(hours=2),
            hosted_by=self.society,
            location="Test Location",
            max_capacity=100,
            status="Approved"
        )

        self.client = APIClient()
        self.url = f"/api/admin/manage-event/{self.event.id}"

    def test_get_event_authenticated_admin(self):
        self.client.force_authenticate(user=self.super_admin)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.event.id)

    def test_get_event_unauthenticated(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_nonexistent_event(self):
        self.client.force_authenticate(user=self.super_admin)
        response = self.client.get("/api/admin/manage-event/99999")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["error"], "Event not found.")

    def test_patch_event_details(self):
        self.client.force_authenticate(user=self.super_admin)
        response = self.client.patch(self.url, {
            "title": "Updated Event Title",
            "reason": "Fixing typo"
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['title'], "Updated Event Title")
