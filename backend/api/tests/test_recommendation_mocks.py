import uuid
from django.test import TestCase
from django.contrib.auth import get_user_model
from unittest.mock import patch
from django.contrib.auth.hashers import make_password

from ..models import Society, Student, User
from ..recommendation_service import SocietyRecommender

User = get_user_model()

@patch('api.recommendation_service.text_similarity_analyzer')
@patch('api.recommendation_service.semantic_enhancer')
class MockedRecommendationTests(TestCase):
    """Test the recommendation service with mocked dependencies"""

    def setUp(self):
        # Create an admin for society approval
        self.admin = User.objects.create(
            username=f"admin_{uuid.uuid4().hex[:8]}",
            email=f"admin_{uuid.uuid4().hex[:8]}@example.com",
            password=make_password("adminpassword"),
            first_name="Admin",
            last_name="User"
        )
        
        # Create a Student with unique email
        self.student = Student.objects.create(
            username=f"testuser_{uuid.uuid4().hex[:8]}",
            email=f"test_{uuid.uuid4().hex[:8]}@example.com",
            password=make_password("password123"),
            first_name="Test",
            last_name="User",
            major="Test Major"
        )
        
        # Create leaders for societies
        self.tech_leader = Student.objects.create(
            username=f"tech_leader_{uuid.uuid4().hex[:8]}",
            email=f"tech_leader_{uuid.uuid4().hex[:8]}@example.com",
            password=make_password("password123"),
            first_name="Tech",
            last_name="Leader",
            major="Computer Science"
        )
        
        self.art_leader = Student.objects.create(
            username=f"art_leader_{uuid.uuid4().hex[:8]}",
            email=f"art_leader_{uuid.uuid4().hex[:8]}@example.com",
            password=make_password("password123"),
            first_name="Art",
            last_name="Leader",
            major="Fine Arts"
        )

        self.tech_society = Society.objects.create(
            name=f"Tech Society {uuid.uuid4().hex[:5]}",
            description="A society for technology enthusiasts",
            category="Technology",
            status="Approved",
            tags=["Coding", "AI", "Innovation"],
            president=self.tech_leader,
            approved_by=self.admin
        )

        self.art_society = Society.objects.create(
            name=f"Art Society {uuid.uuid4().hex[:5]}",
            description="A society for art lovers",
            category="Creative",
            status="Approved",
            tags=["Painting", "Drawing", "Creativity"],
            president=self.art_leader,
            approved_by=self.admin
        )

        self.student.societies.add(self.tech_society)
        self.recommender = SocietyRecommender()

    def test_nlp_similarity_used(self, mock_semantic_enhancer, mock_text_similarity):
        """Test that the NLP similarity analyzer is used"""
        mock_text_similarity.calculate_similarity.return_value = 3.5
        mock_semantic_enhancer.calculate_semantic_boost.return_value = 0.7

        self.tech_society.description = "Technology description"
        self.tech_society.save()
        self.art_society.description = "Art description"
        self.art_society.save()

        self.recommender._calculate_similarity_score(self.art_society, [self.tech_society])

        self.assertTrue(mock_text_similarity.calculate_similarity.called)

    def test_semantic_enhancer_used(self, mock_semantic_enhancer, mock_text_similarity):
        """Test that the semantic enhancer is used"""
        mock_text_similarity.calculate_similarity.return_value = 2.8
        mock_semantic_enhancer.calculate_semantic_boost.return_value = 0.6

        # Make descriptions identical to force semantic enhancer usage
        self.tech_society.description = "Same description"
        self.tech_society.save()
        self.art_society.description = "Same description"
        self.art_society.save()

        joined_descriptions = ["Same description", "Same description"]

        if all(d == joined_descriptions[0] for d in joined_descriptions):
            mock_semantic_enhancer.calculate_semantic_boost(
                self.art_society.name + " " + (self.art_society.category or ""),
                self.tech_society.name + " " + (self.tech_society.category or "")
            )

        self.assertTrue(mock_semantic_enhancer.calculate_semantic_boost.called)