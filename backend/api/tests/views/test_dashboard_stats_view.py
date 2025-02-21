from rest_framework.test import APITestCase
from rest_framework import status
from api.models import User, Society, Event, Student
from api.tests.file_deletion import delete_file

class TestDashboardStatsView(APITestCase):
    def setUp(self):
        # Create and authenticate a user with the custom User model
        self.user = User.objects.create_user(
            username="testuser",
            first_name="Test",
            last_name="User",
            password="testpassword",
            email="testuser@example.com",
            role="admin",
        )
        self.client.force_authenticate(user=self.user)

    def test_dashboard_stats_no_data(self):
        # Test with no data
        response = self.client.get("/api/dashboard/stats/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data,
            {
                "total_societies": 0,
                "total_events": 0,
                "pending_approvals": 0,
                "active_members": 0,
            },
        )

    def test_dashboard_stats_success(self):
        # Create some test data
        Society.objects.create(name="Society 1", status="Approved")
        Society.objects.create(name="Society 2", status="Pending")
        Event.objects.create(title="Event 1", location="Test Location")
        Student.objects.create(
            username="student1",
            password="password123",
            email="student1@example.com",
            first_name="Test",
            last_name="User",
        )

        response = self.client.get("/api/dashboard/stats/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data,
            {
                "total_societies": 2,
                "total_events": 1,
                "pending_approvals": 1,
                "active_members": 1,
            },
        )

    def test_dashboard_stats_unauthenticated(self):
        self.client.logout()
        response = self.client.get("/api/dashboard/stats/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def tearDown(self):
        for society in Society.objects.all():
            if society.icon:
                delete_file(society.icon.path)
        for student in Student.objects.all():
            if student.icon:
                delete_file(student.icon.path)
