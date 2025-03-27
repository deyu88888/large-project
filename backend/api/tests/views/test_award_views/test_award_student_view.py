import json
from unittest.mock import patch, Mock
from django.urls import reverse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from api.models import Award, Student
from api.serializers import AwardStudentSerializer

User = get_user_model()


class AwardStudentViewTest(APITestCase):
    """Test cases for AwardStudentView"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpassword"
        )

        self.award1 = Award.objects.create(
            rank="Gold",
            is_custom=False,
            title="Academic Excellence",
            description="Award for outstanding academic performance"
        )

        self.award2 = Award.objects.create(
            rank="Silver",
            is_custom=True,
            title="Leadership Award",
            description="Award for exceptional leadership skills"
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.list_create_url = reverse('award_students')

        self.student = Student.objects.create(
            username='QWERTY',
            first_name='QWE',
            last_name='RTY',
            email='qwerty@gmail.com',
            role='student',
            major='CompSci',
        )

        self.student_id = self.student.id
        self.detail_url = reverse('award_student_detail', args=[1])

        self.valid_assignment_data = {
            "award_id": self.award2.id,
            "student_id": self.student_id
        }

        self.invalid_assignment_data = {
            "award_id": 9999,
            "student_id": self.student_id
        }

        self.update_data = {
            "award_id": self.award1.id,
            "student_id": self.student_id
        }

    @patch('api.models.Student.objects.get')
    def test_list_nonexistent_student(self, mock_student_get):
        """Test attempting to list awards for a non-existent student"""

        mock_student_get.side_effect = Student.DoesNotExist

        response = self.client.get(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data, {"error": "Invalid student id."})

    @patch('api.views_files.award_views.serializer_is_valid_and_save')
    def test_create_assignment_exception(self, mock_serializer_valid):
        """Test exception handling when creating an award assignment"""
        mock_serializer_valid.side_effect = Exception("Test exception")

        response = self.client.post(
            self.list_create_url,
            data=json.dumps(self.valid_assignment_data),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data, {"error": "Test exception"})

    @patch('api.views_files.award_views.get_award_student_if_exists')
    def test_delete_assignment(self, mock_get_award_student):
        """Test deleting an award assignment"""

        mock_award_student = Mock()
        mock_award_student.delete = Mock()

        mock_get_award_student.return_value = (mock_award_student, None)

        response = self.client.delete(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        mock_award_student.delete.assert_called_once()

    @patch('api.views_files.award_views.get_award_student_if_exists')
    def test_delete_nonexistent_assignment(self, mock_get_award_student):
        """Test attempting to delete a non-existent award assignment"""

        mock_error_response = Response(
            {"error": "Award assignment not found"},
            status=status.HTTP_404_NOT_FOUND
        )

        mock_get_award_student.return_value = (None, mock_error_response)

        response = self.client.delete(reverse('award_student_detail', args=[999]))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data, {"error": "Award assignment not found"})

    def test_unauthenticated_access(self):
        """Test that unauthenticated users cannot access the endpoints"""

        self.client.force_authenticate(user=None)

        list_response = self.client.get(self.list_create_url)
        detail_response = self.client.get(self.detail_url)
        create_response = self.client.post(
            self.list_create_url,
            data=json.dumps(self.valid_assignment_data),
            content_type='application/json'
        )
        update_response = self.client.put(
            self.detail_url,
            data=json.dumps(self.update_data),
            content_type='application/json'
        )
        delete_response = self.client.delete(self.detail_url)

        self.assertEqual(list_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(detail_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(create_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(update_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(delete_response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_valid_assignment_integration(self):
        """Test creating a valid award assignment - integration style test"""
        response = self.client.post(
            self.list_create_url,
            data=json.dumps(self.valid_assignment_data),
            content_type='application/json'
        )

        self.assertIn("id", response.data)
        self.assertEqual(response.data["award"]["id"], self.award2.id)
        self.assertEqual(response.data["award"]["rank"], self.award2.rank)

        student = Student.objects.get(id=self.valid_assignment_data["student_id"])
        award_student = student.award_students.get(id=response.data["id"])
        self.assertEqual(award_student.award.title, self.award2.title)
        self.assertEqual(award_student.award.rank, self.award2.rank)

    def test_update_assignment_valid_data_integration(self):
        """Test updating an award assignment with valid data - integration style test"""
        self.client.post(
            self.list_create_url,
            data=json.dumps(self.valid_assignment_data),
            content_type='application/json'
        )
        update_response = self.client.put(
            self.detail_url,
            data=json.dumps(self.update_data),
            content_type='application/json'
        )

        self.assertIn("id", update_response.data)
        self.assertEqual(update_response.data["award"]["id"], self.award1.id)
        self.assertEqual(update_response.data["award"]["rank"], self.award1.rank)

        student = Student.objects.get(id=self.update_data["student_id"])
        award_student = student.award_students.get(id=update_response.data["id"])
        self.assertEqual(award_student.award.title, self.award1.title)
        self.assertEqual(award_student.award.rank, self.award1.rank)
