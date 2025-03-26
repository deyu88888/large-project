import datetime
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from api.models import User, Student, Society, SocietyRequest
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()

class PendingMembersViewTest(APITestCase):
    def setUp(self):
        # Create a president student user.
        self.president_student = Student.objects.create_user(
            username="president_user",
            password="test1234",
            email="president@example.com",
            is_president=True,
            major="Test Major"
        )
        self.admin = User.objects.create(
            username='admin_user',
            first_name='John',
            last_name='Smith',
            email='admin@example.com',
            role='admin',
            password='adminpassword',
        )
        
        # Create a Society that the president manages.
        self.society = Society.objects.create(
            id=1,
            name="Test Society",
            status="Approved",
            president=self.president_student,
            approved_by=self.admin,
        )
        # Set the president_of field so that the president is linked to this society.
        self.president_student.president_of = self.society
        self.president_student.save()

        # Create an applicant (non-president) student.
        self.applicant_student = Student.objects.create_user(
            username="applicant_user",
            password="test1234",
            email="applicant@example.com",
            is_president=False,
            major="Test Major"
        )
        
        # Create a pending membership request for the applicant.
        self.pending_request = SocietyRequest.objects.create(
            intent="JoinSoc",
            approved=False,
            from_student=self.applicant_student,
            society=self.society
        )

        # Base URLs.
        self.get_url = f"/api/society/{self.society.id}/pending-members/"
        self.post_url = f"/api/society/{self.society.id}/pending-members/{self.pending_request.id}/"

        # Generate tokens.
        self.president_token = str(AccessToken.for_user(self.president_student))
        self.applicant_token = str(AccessToken.for_user(self.applicant_student))

    def test_get_no_auth(self):
        """GET without authentication should return 401 Unauthorized."""
        response = self.client.get(self.get_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_post_by_applicant(self):
        """
        POST by a non-president should return 403 Forbidden.
        """
        self.pending_request.approved = False
        self.pending_request.save()
        
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.applicant_token}")
        
        was_approved_before = self.pending_request.approved
        
        response = self.client.post(self.post_url, {"action": "approve"}, format="json")
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.pending_request.refresh_from_db()
        self.assertEqual(self.pending_request.approved, was_approved_before,
                        "Non-president should not be able to change approval status")
    
    def test_post_by_other_president(self):
        """
        POST by another president should return 403 Forbidden.
        """
        new_request = SocietyRequest.objects.create(
            intent="JoinSoc",
            approved=False,
            from_student=self.applicant_student,
            society=self.society
        )
        
        new_url = f"/api/society/{self.society.id}/pending-members/{new_request.id}/"
        
        other_president = Student.objects.create_user(
            username="other_post_president",
            password="test1234",
            email="other_post@example.com",
            is_president=True,
            major="Test Major"
        )
        
        other_society = Society.objects.create(
            name="Other Post Society",
            status="Approved",
            president=other_president,
            approved_by=self.admin
        )
        
        other_president.president_of = other_society
        other_president.save()
        
        other_token = str(AccessToken.for_user(other_president))
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {other_token}")
        
        was_approved_before = new_request.approved
        
        response = self.client.post(new_url, {"action": "approve"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        new_request.refresh_from_db()
        self.assertEqual(new_request.approved, was_approved_before,
                        "President of another society should not be able to change approval status")

    def test_get_success(self):
        """
        GET by the society's president should return the pending membership requests.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.president_token}")
        response = self.client.get(self.get_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertTrue(isinstance(response.data, list), "Response data should be a list")
        self.assertEqual(len(response.data), 1, "Should have one pending request")
        self.assertEqual(response.data[0]['id'], self.pending_request.id)

    def test_post_no_auth(self):
        """POST without authentication should return 401 Unauthorized."""
        response = self.client.post(self.post_url, {"action": "approve"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_post_request_not_found(self):
        """
        POST to process a membership request that doesn't exist should return 404 Not Found.
        """
        invalid_post_url = f"/api/society/{self.society.id}/pending-members/9999/"
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.president_token}")
        response = self.client.post(invalid_post_url, {"action": "approve"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        content = response.content.decode("utf-8")
        self.assertIn("Request not found", content)

    def test_post_invalid_action(self):
        """
        POST with an invalid action should return 400 Bad Request.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.president_token}")
        response = self.client.post(self.post_url, {"action": "invalid"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Invalid action", str(response.data))

    def test_post_approve_success(self):
        """
        POST with action "approve" should approve the membership request,
        add the applicant to the society, mark the request approved, and return 200 OK.
        """
        approve_request = SocietyRequest.objects.create(
            intent="JoinSoc",
            approved=False,
            from_student=self.applicant_student,
            society=self.society
        )
        
        approve_url = f"/api/society/{self.society.id}/pending-members/{approve_request.id}/"
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.president_token}")
        
        response = self.client.post(approve_url, {"action": "approve"}, format="json")        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("approved", str(response.data).lower())     
        self.applicant_student.refresh_from_db()
        self.assertIn(self.applicant_student, self.society.society_members.all())       
        approve_request.refresh_from_db()
        self.assertTrue(approve_request.approved)

    def test_post_reject_success(self):
        """
        POST with action "reject" should delete the membership request and return 200 OK.
        """
        reject_request = SocietyRequest.objects.create(
            intent="JoinSoc",
            approved=False,
            from_student=self.applicant_student,
            society=self.society
        )
        
        reject_url = f"/api/society/{self.society.id}/pending-members/{reject_request.id}/"  
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.president_token}")
        response = self.client.post(reject_url, {"action": "reject"}, format="json")     
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("rejected", str(response.data).lower())      
        with self.assertRaises(SocietyRequest.DoesNotExist):
            SocietyRequest.objects.get(id=reject_request.id)

    def test_get_no_pending_requests(self):
        """
        GET should return an empty list if there are no pending membership requests.
        """
        SocietyRequest.objects.all().delete()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.president_token}")
        response = self.client.get(self.get_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_post_missing_action(self):
        """
        POST without an "action" in the payload should return 400 Bad Request.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.president_token}")
        response = self.client.post(self.post_url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Invalid action", str(response.data))

    def test_post_already_approved_request(self):
        """
        POST on a membership request that has already been approved should return 404 Not Found.
        """
        self.pending_request.approved = True
        self.pending_request.save()
        
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.president_token}")
        response = self.client.post(self.post_url)