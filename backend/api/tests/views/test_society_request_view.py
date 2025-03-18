from rest_framework.test import APITestCase
from api.models import Student, Society, User
from rest_framework_simplejwt.tokens import AccessToken

class SocietyRequestViewTest(APITestCase):
    def setUp(self):
        # Create a regular (non-president) student user using create_user
        self.regular_student = Student.objects.create_user(
            username="regular_user",
            password="test1234",
            email="regular@example.com",  # unique email
            is_president=False,
            president_of=None,
            major="Test Major"
        )
        
        # Create a president student for the president field
        self.president_student = Student.objects.create_user(
            username="president_user",
            password="test1234",
            email="president@example.com",
            is_president=True,
            major="Test Major"
        )

        self.admin = User.objects.create_user(
            username="existing_admin",
            password="Password123",
            first_name="Admin",
            last_name="User",
            email="existing_email@example.com",
            role="admin",
        )
        
        # Explicitly set the ID of the society with a president
        self.society = Society.objects.create(
            id=1,
            name="Test Society",
            approved_by=self.admin,
            status="Approved",
            category="General",
            social_media_links={},
            president=self.president_student  # Add the president field
        )
        
        # Update the president's president_of field to point to this society
        self.president_student.president_of = self.society
        self.president_student.save()
        
        # Refresh from DB to ensure persistence
        self.society.refresh_from_db()
        
        # Base URL for society requests
        self.base_url = "/api/society/request/pending"

        # Generate tokens for authentication. 'same as access token on postman'
        self.regular_user_token = str(AccessToken.for_user(self.regular_student))
        
        # Create token for president user
        self.president_user_token = str(AccessToken.for_user(self.president_student))

        # generate a token for admin_user_token
        self.admin_user_token = str(AccessToken.for_user(self.admin))

    def test_society_request_by_student_user(self):
        """
        If a student user tries to access the society request endpoint, they should get a 403 Forbidden response.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.regular_user_token}")
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, 403)

    def test_society_request_view_by_admin_user(self):
        """
        If an admin user tries to access the society request endpoint, they should get a 200 OK response.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.admin_user_token}")
        response = self.client.get(self.base_url)
        print("xxx", response.data)
        self.assertEqual(response.status_code, 200)
    
    # test for put method
    def test_society_request_put_method_by_student_user(self):
        """
        Test that the PUT method is not allowed on the society request endpoint.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.regular_user_token}")
        response = self.client.put(self.base_url+"/1")
        self.assertEqual(response.status_code, 403)

    def test_society_request_put_404_by_admin_user(self):
        """
        Test that the PUT method is not allowed on the society request endpoint.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.admin_user_token}")
        response = self.client.put(self.base_url+"/9999999")
        self.assertEqual(response.status_code, 404)

    # def test_society_request_put_200_by_admin_user(self):
    #     """
    #     Test that the PUT method is not allowed on the society request endpoint.
    #     """
    #     self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.admin_user_token}")
    #     # update_data = {
    #     #     "status": "Pending"
    #     # }
    #     # response = self.client.put(self.base_url+"/2", update_data, format="json")
    #     # response = self.client.put(self.base_url+"/2",  {"status": "Pending"}, format="json")
    #     response = self.client.put(f"{self.base_url}/6",  {"status": "Pending"}, format="json")
    #     print("xxxxx", response.data)
    #     self.assertEqual(response.status_code, 200)
    
    def test_society_request_put_200(self):
        """
        Test that the PUT method is not allowed on the society request endpoint.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.admin_user_token}")
        # import json
        response = self.client.put(f"{self.base_url}/1",  {"status": "Pending"}, format="json")
        print()
        print("xxxxx", response.data)
        self.assertEqual(response.status_code, 200)