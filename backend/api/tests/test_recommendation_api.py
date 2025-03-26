import unittest.mock
import uuid
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password

from ..models import Society, Student, User
from ..recommendation_service import SocietyRecommender

User = get_user_model()


class RecommendationAPITestCase(TestCase):
    """Test the recommendation API endpoints"""

    def setUp(self):
        self.client = APIClient()

        # Create an admin for society approval
        self.admin = User.objects.create(
            username=f"admin_{uuid.uuid4().hex[:8]}",
            email=f"admin_{uuid.uuid4().hex[:8]}@example.com",
            password=make_password("adminpassword"),
            first_name="Admin",
            last_name="User"
        )

        # Create a Student (subclass of User) with a unique email
        self.student = Student.objects.create(
            username=f"testuser_{uuid.uuid4().hex[:8]}",
            email=f"test_{uuid.uuid4().hex[:8]}@example.com",
            password=make_password("password123"),
            first_name="Test",
            last_name="User",
            major="Test Major"
        )
        
        # Create leaders for societies
        self.leaders = []
        for i in range(5):
            leader = Student.objects.create(
                username=f"leader_{i}_{uuid.uuid4().hex[:8]}",
                email=f"leader_{i}_{uuid.uuid4().hex[:8]}@example.com",
                password=make_password("password123"),
                first_name=f"Leader {i}",
                last_name="User",
                major=f"Leadership {i}"
            )
            self.leaders.append(leader)

        # Create some test societies
        self.societies = []
        categories = ["Technology", "Arts", "Sports", "Academic", "Gaming"]
        for i in range(5):
            society = Society.objects.create(
                name=f"Test Society {i+1} {uuid.uuid4().hex[:5]}",
                description=f"Description for Test Society {i+1}",
                category=categories[i],
                status="Approved",
                tags=[f"Tag{i*3+1}", f"Tag{i*3+2}", f"Tag{i*3+3}"],
                president=self.leaders[i],
                approved_by=self.admin
            )
            self.societies.append(society)

        self.student.societies.add(self.societies[0])

        # "Force" authenticate the API client with the Student (who is also a User)
        self.client.force_authenticate(user=self.student)
        
        # Mock NLP components
        self.text_similarity_patcher = unittest.mock.patch('api.recommendation_service.text_similarity_analyzer')
        self.mock_text_similarity = self.text_similarity_patcher.start()
        self.mock_text_similarity.calculate_similarity.return_value = 0.75
        
        self.semantic_enhancer_patcher = unittest.mock.patch('api.recommendation_service.semantic_enhancer')
        self.mock_semantic_enhancer = self.semantic_enhancer_patcher.start()
        self.mock_semantic_enhancer.calculate_semantic_boost.return_value = 0.5
        
        self.explanation_patcher = unittest.mock.patch.object(
            SocietyRecommender, 
            '_get_recommendation_explanation_details',
            return_value={
                'type': 'similarity',
                'message': 'This society has similar interests to ones you have already joined.',
                'similarity_score': 0.75
            }
        )
        self.mock_explanation = self.explanation_patcher.start()

    def tearDown(self):
        # Stop all patches
        self.text_similarity_patcher.stop()
        self.semantic_enhancer_patcher.stop()
        self.explanation_patcher.stop()
        
    def test_recommended_societies_endpoint(self):
        """Test that the recommended societies endpoint works properly"""
        response = self.client.get(reverse('recommended_societies'))

        self.assertEqual(response.status_code, 200)
        self.assertTrue(isinstance(response.data, list))
        self.assertTrue(len(response.data) > 0)

        recommendation = response.data[0]
        self.assertIn('society', recommendation)
        self.assertIn('explanation', recommendation)

        society = recommendation['society']
        self.assertIn('id', society)
        self.assertIn('name', society)
        self.assertIn('category', society)

        explanation = recommendation['explanation']
        self.assertIn('type', explanation)
        self.assertIn('message', explanation)

    def test_explanation_endpoint(self):
        """Test that the explanation endpoint works properly"""
        non_member_society = self.societies[1]

        response = self.client.get(
            reverse('society_recommendation_explanation', kwargs={'society_id': non_member_society.id})
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn('type', response.data)
        self.assertIn('message', response.data)

    def test_feedback_endpoint(self):
        """Test that the feedback endpoint works properly"""
        non_member_society = self.societies[1]

        feedback_data = {
            'rating': 4,
            'relevance': 5,
            'comment': 'This is a great recommendation!',
            'is_joined': True,
            'society_id': non_member_society.id
        }

        response = self.client.post(
            reverse('recommendation_feedback_detail', kwargs={'society_id': non_member_society.id}),
            feedback_data,
            format='json'
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn('message', response.data)
        self.assertIn('society_id', response.data)
        self.assertIn('timestamp', response.data)
        
        self.assertEqual(response.data['society_id'], non_member_society.id)

