import datetime
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from api.models import Admin, Student, Society, UserRequest
from api.serializers import PendingMemberSerializer
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
        self.admin = Admin(
            username='admin_user',
            first_name='John',
            last_name='Smith',
            email='admin@example.com',
            role='admin',
            password='adminpassword',
        )
        self.admin.save()
        # Create a Society that the president manages.
        self.society = Society.objects.create(
            id=1,
            name="Test Society",
            status="Approved",
            leader=self.president_student,
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
        # **Important:** To satisfy the filter in the view, the pending request must match
        # from_student__societies_belongs_to=society. That means the applicant must already be
        # associated with the society's members (even if the request is pending).
        self.applicant_student.societies_belongs_to.add(self.society)
        self.applicant_student.save()

        # Create a pending membership request for the applicant.
        # Make sure to create it after adding the society to the applicant,
        # so the join condition in the filter can pick it up.
        self.pending_request = UserRequest.objects.create(
            intent="JoinSoc",
            approved=False,
            from_student=self.applicant_student
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

    def test_get_not_president(self):
        """GET by a non-president should return 403 Forbidden."""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.applicant_token}")
        response = self.client.get(self.get_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Only the society president or vice president can manage members.", str(response.data))

    def test_get_not_leader(self):
        """
        GET by a president who does not own this society should return 403 Forbidden.
        We'll create another president who is not linked to this society.
        """
        other_president = Student.objects.create_user(
            username="other_president",
            password="test1234",
            email="otherpresident@example.com",
            is_president=True,
            major="Test Major"
        )
        # other_president is not assigned to our society.
        other_token = str(AccessToken.for_user(other_president))
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {other_token}")
        response = self.client.get(self.get_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Only the society president or vice president can manage members.", str(response.data))

    def test_get_success(self):
        """
        GET by the society's president should return the pending membership requests.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.president_token}")
        response = self.client.get(self.get_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_data = PendingMemberSerializer([self.pending_request], many=True).data
        self.assertEqual(response.data, expected_data)

    def test_post_no_auth(self):
        """POST without authentication should return 401 Unauthorized."""
        response = self.client.post(self.post_url, {"action": "approve"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_post_not_president(self):
        """POST by a non-president should return 403 Forbidden."""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.applicant_token}")
        response = self.client.post(self.post_url, {"action": "approve"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Only the society president or vice president can manage members.", str(response.data))

    def test_post_society_not_leader(self):
    # Create a student who will serve as the actual leader.
        leader_student = Student.objects.create_user(
            username="leader_user",
            password="test1234",
            email="leader@example.com",
            is_president=True,
            major="Test Major"
        )
        admin = Admin.objects.create_user(
            username="admin_for_approval",
            password="admin1234",
            email="admin_approval@example.com",
            first_name="Admin",
            last_name="Approver"
        )
        # Create a society with leader_student as the leader.
        society = Society.objects.create(
            name="Society Not Led by President",
            status="Approved",
            leader=leader_student,
            approved_by=admin
        )
        
        # Create a pending membership request for the society.
        pending_request = UserRequest.objects.create(
            intent="JoinSoc",
            approved=False,
            from_student=self.applicant_student
        )
        
        # Build the URL based on the PendingMembersView URL pattern.
        url = f"/api/society/{society.id}/pending-members/{pending_request.id}/"
        
        # Use the token for the president user from setUp (whose student id is different from leader_student).
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.president_token}")
        response = self.client.post(url, {"action": "approve"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


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
        # Ensure the pending request is not already approved.
        self.pending_request.approved = False
        self.pending_request.save()

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.president_token}")
        response = self.client.post(self.post_url, {"action": "approve"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("has been approved", str(response.data))
        # Check that the applicant is now a member of the society.
        self.applicant_student.refresh_from_db()
        self.assertIn(self.society, self.applicant_student.societies_belongs_to.all())
        # Check that the pending request's approved field is now True.
        self.pending_request.refresh_from_db()
        self.assertTrue(self.pending_request.approved)

    def test_post_reject_success(self):
        """
        POST with action "reject" should delete the membership request and return 200 OK.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.president_token}")
        response = self.client.post(self.post_url, {"action": "reject"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Request has been rejected", str(response.data))
        with self.assertRaises(UserRequest.DoesNotExist):
            UserRequest.objects.get(id=self.pending_request.id)

    def test_get_no_pending_requests(self):
        """
        GET should return an empty list if there are no pending membership requests.
        """
        # Remove the existing pending request.
        self.pending_request.delete()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.president_token}")
        response = self.client.get(self.get_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # The expected data is an empty list.
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
        # First, approve the pending request.
        self.pending_request.approved = True
        self.pending_request.save()
        
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.president_token}")
        response = self.client.post(self.post_url, {"action": "approve"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("Request not found", response.content.decode("utf-8"))
