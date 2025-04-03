from unittest.mock import patch

from rest_framework.response import Response
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from api.models import Society, Student, SocietyRequest
import uuid

User = get_user_model()

class RequestJoinSocietyViewTests(APITestCase):
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

        
        self.society1 = Society.objects.create(
            name=f"Chess Club {unique_id}",
            description="A club for chess enthusiasts.",
            president=self.president_student,
            approved_by=self.admin_user,
            status="Approved"
        )
        self.society2 = Society.objects.create(
            name=f"Art Club {unique_id}",
            description="A club for art lovers.",
            president=self.president_student,
            approved_by=self.admin_user,
            status="Approved"
        )

        
        self.client.force_authenticate(user=self.student)

    def test_get_joinable_societies(self):
        
        
        self.society1.society_members.add(self.student)
        response = self.client.get("/api/society/join/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        society_names = [society["name"] for society in response.data]
        self.assertIn(self.society2.name, society_names)
        self.assertNotIn(self.society1.name, society_names)

    def test_post_join_society_success(self):
        response = self.client.post(f"/api/society/join/{self.society1.id}/")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("submitted for approval", response.data["message"])

    def test_post_join_society_already_member(self):
        
        
        
        
        self.society1.society_members.add(self.student)
        response = self.client.post(f"/api/society/join/{self.society1.id}/")
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("submitted for approval", response.data["message"])

    def test_post_join_society_already_requested(self):
        existing_request = SocietyRequest.objects.create(
            from_student=self.student,
            society=self.society1,
            intent="JoinSoc",
            approved=False
        )
        response = self.client.post(f"/api/society/join/{self.society1.id}/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already have a pending request", response.data["message"])
        self.assertEqual(response.data["request_id"], existing_request.id)

    def test_post_join_society_no_id_provided(self):
        response = self.client.post("/api/society/join/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Society ID is required", response.data["error"])

    def test_post_join_nonexistent_society(self):
        response = self.client.post("/api/society/join/9999/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("does not exist", response.data["error"])

    def test_get_joinable_societies_not_authenticated(self):
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/society/join/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_post_join_society_not_authenticated(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(f"/api/society/join/{self.society1.id}/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch("api.views_files.request_views.get_student_if_user_is_student")
    def test_get_joinable_societies_student_check_failed(self, mock_get_student):
        mock_response = Response(
            {"error": "You must be a student to join."},
            status=status.HTTP_403_FORBIDDEN
        )
        mock_response.__bool__ = lambda self: True
        mock_get_student.return_value = (None, mock_response)

        self.client.force_authenticate(user=self.student)
        response = self.client.get("/api/society/join/")

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data["error"], "You must be a student to join.")

    @patch("api.views_files.request_views.get_student_if_user_is_student")
    def test_post_join_society_student_check_failed(self, mock_get_student):
        error_response = Response(
            {"error": "You must be a student to join."},
            status=status.HTTP_403_FORBIDDEN
        )
        error_response.__bool__ = lambda self: True
        mock_get_student.return_value = (None, error_response)

        self.client.force_authenticate(user=self.student)
        response = self.client.post(f"/api/society/join/{self.society1.id}/")

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data["error"], "You must be a student to join.")

    def test_post_join_society_already_member_returns_400(self):
        self.society1.members.add(self.student)

        self.client.force_authenticate(user=self.student)
        response = self.client.post(f"/api/society/join/{self.society1.id}/")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["error"], "You are already a member of this society.")
