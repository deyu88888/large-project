from rest_framework.test import APITestCase
from rest_framework import status
from api.models import User, Society, Event, Student, Admin
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
        
        # Create an admin user for society approval
        self.admin = Admin.objects.create_user(
            username="admin_user",
            password="adminpassword",
            email="admin@example.com",
            first_name="Admin",
            last_name="User",
        )
        
        # Create student users that will be society leaders
        self.student1 = Student.objects.create_user(
            username="student1",
            password="password123",
            email="student1@example.com",
            first_name="Test",
            last_name="User",
            major="Computer Science",
        )
        
        self.student2 = Student.objects.create_user(
            username="student2",
            password="password123",
            email="student2@example.com",
            first_name="Test2",
            last_name="User2",
            major="Mathematics",
        )

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
                "active_members": 2,  # We have 2 students created in setUp
            },
        )

    def test_dashboard_stats_success(self):
        # Create some test data with proper admin approval
        Society.objects.create(
            name="Society 1", 
            status="Approved", 
            leader=self.student1,
            approved_by=self.admin,  # Add required admin approval
            social_media_links={"Email": "society1@example.com"}  # Add required social media links
        )
        
        Society.objects.create(
            name="Society 2", 
            status="Pending", 
            leader=self.student2,
            approved_by=self.admin,  # Add required admin approval
            social_media_links={"Email": "society2@example.com"}  # Add required social media links
        )
        
        # Create a society for the event
        society = Society.objects.get(name="Society 1")
        
        Event.objects.create(
            title="Event 1", 
            location="Test Location",
            hosted_by=society  # Add the required hosted_by field
        )

        response = self.client.get("/api/dashboard/stats/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data,
            {
                "total_societies": 2,
                "total_events": 1,
                "pending_approvals": 1,
                "active_members": 2,
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