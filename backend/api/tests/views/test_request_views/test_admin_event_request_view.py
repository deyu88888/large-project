from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from api.models import Event, Society, Student
import uuid
from datetime import datetime, time, timedelta
from django.utils import timezone

User = get_user_model()

class AdminEventRequestViewTests(APITestCase):
    def setUp(self):
        unique_id = uuid.uuid4().hex[:8]
        
        self.admin_user = User.objects.create_user(
            username=f"admin_{unique_id}",
            email=f"admin_{unique_id}@example.com",
            password="adminpassword",
            role="admin"
        )
        
        self.student = Student()
        self.student.username = f"student_user_{unique_id}"
        self.student.email = f"student_{unique_id}@example.com"
        self.student.set_password("testpassword123")
        self.student.role = "student"
        self.student.first_name = "Test"
        self.student.last_name = "Student"
        self.student.save()
        
        self.president_student = Student()
        self.president_student.username = f"president_{unique_id}"
        self.president_student.email = f"president_{unique_id}@example.com"
        self.president_student.set_password("presidentpassword")
        self.president_student.role = "student"
        self.president_student.first_name = "President"
        self.president_student.last_name = "Student"
        self.president_student.save()
        
        self.society = Society.objects.create(
            name=f"Test Society {unique_id}",
            description="A test society",
            president=self.president_student,
            approved_by=self.admin_user,
            status="Approved"
        )
        
        today = timezone.now().date()
        start_time = time(hour=18, minute=0)
        
        self.event = Event.objects.create(
            title=f"Test Event {unique_id}",
            main_description="Test event description",
            date=today,
            start_time=start_time,
            duration=timedelta(hours=2),
            hosted_by=self.society,
            location="Test Location",
            status="Pending"
        )

    def test_admin_approve_event_success(self):
        """Test admin can approve an event"""
        self.client.force_authenticate(user=self.admin_user)
        
        update_data = {"status": "Approved"}
        
        response = self.client.put(f"/api/admin/society/event/request/{self.event.id}", update_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Event request updated successfully.")
        self.assertEqual(response.data["data"]["status"], "Approved")
        
        self.event.refresh_from_db()
        self.assertEqual(self.event.status, "Approved")

    def test_admin_reject_event_success(self):
        """Test admin can reject an event"""
        self.client.force_authenticate(user=self.admin_user)
        
        update_data = {"status": "Rejected"}
        
        response = self.client.put(f"/api/admin/society/event/request/{self.event.id}", update_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Event request updated successfully.")
        self.assertEqual(response.data["data"]["status"], "Rejected")
        
        self.event.refresh_from_db()
        self.assertEqual(self.event.status, "Rejected")

    def test_event_not_found(self):
        """Test handling of non-existent event"""
        self.client.force_authenticate(user=self.admin_user)
        
        response = self.client.put("/api/admin/society/event/request/99999", {"status": "Approved"}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["error"], "Event request not found.")

    def test_non_admin_cannot_update_event(self):
        """Test that non-admin users cannot update events"""
        isolated_event = Event.objects.create(
            title=f"Isolated Test Event {uuid.uuid4().hex[:8]}",
            main_description="Isolated test event description",
            date=timezone.now().date(),
            start_time=time(hour=19, minute=0),
            duration=timedelta(hours=2),
            hosted_by=self.society,
            location="Isolated Test Location",
            status="Pending"
        )
        
        self.client.force_authenticate(user=self.student)
        
        update_data = {"status": "Approved"}
        
        response = self.client.put(
            f"/api/admin/society/event/request/{isolated_event.id}", 
            update_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        isolated_event.refresh_from_db()
        self.assertNotEqual(isolated_event.status, "Approved")

    def test_invalid_data_returns_400(self):
        """Test that invalid data returns a 400 response"""
        self.client.force_authenticate(user=self.admin_user)
        
        update_data = {"status": "InvalidStatus"}
        
        response = self.client.put(f"/api/admin/society/event/request/{self.event.id}", update_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)