import json
from unittest.mock import patch
from django.urls import reverse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from api.models import Award

User = get_user_model()


class AwardViewTest(APITestCase):
    """Test cases for AwardView"""

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
        
        
        self.list_create_url = reverse('awards')
        self.detail_url = reverse('award_detail', args=[self.award1.id])
        
        
        self.valid_award_data = {
            "rank": "Bronze",
            "is_custom": False,
            "title": "Community Service",
            "description": "Award for community service contribution"
        }
        
        self.invalid_award_data = {
            "rank": "Invalid",  
            "is_custom": False,
            "title": "Test Award",
            "description": "Test Description"
        }
        
        self.update_data = {
            "rank": "Silver",
            "is_custom": True,
            "title": "Updated Award",
            "description": "Updated Description"
        }

    def test_list_awards(self):
        """Test listing all awards"""
        response = self.client.get(self.list_create_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  

    def test_retrieve_award(self):
        """Test retrieving a specific award"""
        response = self.client.get(self.detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], self.award1.title)
        self.assertEqual(response.data['rank'], self.award1.rank)

    @patch('api.views_files.award_views.get_award_if_exists')
    def test_retrieve_nonexistent_award(self, mock_get_award):
        """Test attempting to retrieve a non-existent award"""
        
        mock_error_response = Response(
            {"error": "Award not found"},
            status=status.HTTP_404_NOT_FOUND
        )
        mock_get_award.return_value = (None, mock_error_response)
        
        
        url = reverse('award_detail', args=[999])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data, {"error": "Award not found"})

    def test_create_award_valid_data(self):
        """Test creating an award with valid data"""
        response = self.client.post(
            self.list_create_url,
            data=json.dumps(self.valid_award_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Award.objects.count(), 3)  
        self.assertEqual(response.data['title'], self.valid_award_data['title'])
        self.assertEqual(response.data['rank'], self.valid_award_data['rank'])

    def test_create_award_invalid_data(self):
        """Test creating an award with invalid data"""
        response = self.client.post(
            self.list_create_url,
            data=json.dumps(self.invalid_award_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Award.objects.count(), 2)  

    def test_update_award_valid_data(self):
        """Test updating an award with valid data"""
        response = self.client.put(
            self.detail_url,
            data=json.dumps(self.update_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.award1.refresh_from_db()
        self.assertEqual(self.award1.title, self.update_data['title'])
        self.assertEqual(self.award1.rank, self.update_data['rank'])

    def test_update_award_invalid_data(self):
        """Test updating an award with invalid data"""
        response = self.client.put(
            self.detail_url,
            data=json.dumps(self.invalid_award_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.award1.refresh_from_db()
        self.assertNotEqual(self.award1.title, self.invalid_award_data['title'])

    @patch('api.views_files.award_views.get_award_if_exists')
    def test_update_nonexistent_award(self, mock_get_award):
        """Test attempting to update a non-existent award"""
        
        mock_error_response = Response(
            {"error": "Award not found"},
            status=status.HTTP_404_NOT_FOUND
        )
        mock_get_award.return_value = (None, mock_error_response)
        
        url = reverse('award_detail', args=[999])
        response = self.client.put(
            url,
            data=json.dumps(self.update_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data, {"error": "Award not found"})

    def test_delete_award(self):
        """Test deleting an award"""
        response = self.client.delete(self.detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Award.objects.count(), 1)  

    @patch('api.views_files.award_views.get_award_if_exists')
    def test_delete_nonexistent_award(self, mock_get_award):
        """Test attempting to delete a non-existent award"""
        
        mock_error_response = Response(
            {"error": "Award not found"},
            status=status.HTTP_404_NOT_FOUND
        )
        mock_get_award.return_value = (None, mock_error_response)
        
        url = reverse('award_detail', args=[999])
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data, {"error": "Award not found"})

    def test_unauthenticated_access(self):
        """Test that unauthenticated users cannot access the endpoints"""
        
        self.client.force_authenticate(user=None)
        
        
        list_response = self.client.get(self.list_create_url)
        detail_response = self.client.get(self.detail_url)
        create_response = self.client.post(
            self.list_create_url,
            data=json.dumps(self.valid_award_data),
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