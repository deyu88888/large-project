import json
from django.urls import reverse
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from api.models import Student, Event, Society, User


class SearchViewTestCase(TestCase):
    """Test case for the SearchView API endpoint"""

    def setUp(self):
        """Set up test data"""
        
        self.client = APIClient()
        
        
        self.admin_user = User.objects.create(
            username="adminuser",
            email="admin@example.com",
            first_name="Admin",
            last_name="User",
            role="admin",
            is_staff=True
        )
        
        
        self.student1 = Student.objects.create(
            username="student1",
            email="student1@example.com",
            first_name="Test",
            last_name="Student1",
            major="Computer Science",
            password="password123",
            status="Approved"
        )
        
        self.student2 = Student.objects.create(
            username="teststudent2",
            email="student2@example.com",
            first_name="Test",
            last_name="Student2",
            major="Engineering",
            password="password123",
            status="Approved"
        )
        
        
        self.society1 = Society.objects.create(
            name="Test Society",
            description="A test society",
            category="Academic",
            status="Approved",
            president=self.student1,
            approved_by=self.admin_user
        )
        
        self.society2 = Society.objects.create(
            name="Another Society",
            description="Another test society",
            category="Cultural",
            status="Approved",
            president=self.student2,
            approved_by=self.admin_user
        )
        
        
        self.event1 = Event.objects.create(
            title="Test Event",
            main_description="A test event",
            location="Test Location",
            status="Approved",
            hosted_by=self.society1
        )
        
        self.event2 = Event.objects.create(
            title="Another Test Event",
            main_description="Another test event",
            location="Another Test Location",
            status="Pending",  
            hosted_by=self.society2
        )
        
        self.event3 = Event.objects.create(
            title="Test Workshop",
            main_description="A test workshop",
            location="Test Lab",
            status="Approved",
            hosted_by=self.society2
        )
        
        
        self.url = reverse('search')

    def test_search_view_with_empty_query(self):
        """Test search view with empty query - should return 400"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {"error": "No search query provided."})
        
        
        response = self.client.get(f"{self.url}?q=")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {"error": "No search query provided."})
        
        
        response = self.client.get(f"{self.url}?q=   ")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {"error": "No search query provided."})

    def test_search_view_with_valid_query_students(self):
        """Test search view with a query that matches students"""
        response = self.client.get(f"{self.url}?q=student")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("students", response.data)
        self.assertIn("events", response.data)
        self.assertIn("societies", response.data)
        
        
        self.assertEqual(len(response.data["students"]), 2)
        
        
        usernames = [s["username"] for s in response.data["students"]]
        self.assertIn("student1", usernames)
        self.assertIn("teststudent2", usernames)

    def test_search_view_with_valid_query_societies(self):
        """Test search view with a query that matches societies"""
        response = self.client.get(f"{self.url}?q=society")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        
        self.assertEqual(len(response.data["societies"]), 2)
        
        
        society_names = [s["name"] for s in response.data["societies"]]
        self.assertIn("Test Society", society_names)
        self.assertIn("Another Society", society_names)

    def test_search_view_with_valid_query_events(self):
        """Test search view with a query that matches events"""
        response = self.client.get(f"{self.url}?q=event")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        
        self.assertEqual(len(response.data["events"]), 1)
        
        
        event_titles = [e["title"] for e in response.data["events"]]
        self.assertIn("Test Event", event_titles)
        self.assertNotIn("Another Test Event", event_titles)  

    def test_search_view_with_partial_match(self):
        """Test search view with a partial match"""
        response = self.client.get(f"{self.url}?q=test")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        
        self.assertEqual(len(response.data["students"]), 1)
        self.assertEqual(response.data["students"][0]["username"], "teststudent2")
        
        
        self.assertEqual(len(response.data["societies"]), 1)
        self.assertEqual(response.data["societies"][0]["name"], "Test Society")
        
        
        self.assertEqual(len(response.data["events"]), 2)  
        
        
        event_titles = [e["title"] for e in response.data["events"]]
        self.assertIn("Test Event", event_titles)
        self.assertIn("Test Workshop", event_titles)
        self.assertNotIn("Another Test Event", event_titles)  

    def test_search_view_with_case_insensitive_match(self):
        """Test search view with case-insensitive matching"""
        response = self.client.get(f"{self.url}?q=TEST")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        
        self.assertEqual(len(response.data["students"]), 1)
        self.assertEqual(response.data["students"][0]["username"], "teststudent2")
        
        
        self.assertEqual(len(response.data["societies"]), 1)
        self.assertEqual(response.data["societies"][0]["name"], "Test Society")
        
        self.assertEqual(len(response.data["events"]), 2)  

    def test_search_view_with_no_results(self):
        """Test search view with a query that returns no results"""
        response = self.client.get(f"{self.url}?q=nonexistent")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        
        self.assertEqual(len(response.data["students"]), 0)
        self.assertEqual(len(response.data["societies"]), 0)
        self.assertEqual(len(response.data["events"]), 0)

    def test_search_view_serializes_correctly(self):
        """Test that the search view correctly serializes results"""
        response = self.client.get(f"{self.url}?q=test")
        
        
        student = response.data["students"][0]
        self.assertIn("username", student)
        self.assertIn("first_name", student)
        self.assertIn("last_name", student)
        self.assertIn("major", student)
        self.assertIn("icon", student)
        
        
        society = response.data["societies"][0]
        self.assertIn("name", society)
        self.assertIn("description", society)
        self.assertIn("category", society)
        self.assertIn("icon", society)
        
        
        event = response.data["events"][0]
        self.assertIn("title", event)
        self.assertIn("main_description", event)
        self.assertIn("location", event)
        self.assertIn("status", event)
        self.assertIn("hosted_by", event)

    def test_context_passes_to_serializers(self):
        """Test that the request context is passed to serializers"""
        
        self.client.force_authenticate(user=self.student1)
        
        response = self.client.get(f"{self.url}?q=test")
        
        
        
        event = response.data["events"][0]
        self.assertIn("is_member", event)