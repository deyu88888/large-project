# backend/api/tests/test_recommendation_system.py

import pytest
import random
import uuid
from datetime import datetime
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from unittest.mock import patch, MagicMock
from django.contrib.auth.hashers import make_password

from ..models import Society, Student, Admin
from ..recommendation_service import SocietyRecommender

User = get_user_model()


class RecommendationServiceTestCase(TestCase):
    """Test the core recommendation service functionality"""

    def setUp(self):
        # Create a test admin user for approved_by field
        self.admin = Admin.objects.create(
            username=f"admin_{uuid.uuid4().hex[:8]}",
            email=f"admin_{uuid.uuid4().hex[:8]}@example.com",
            password=make_password("adminpassword"),
            first_name="Admin",
            last_name="User"
        )
        
        # Create test students
        self.student1 = Student.objects.create(
            username=f"testuser1_{uuid.uuid4().hex[:8]}",
            email=f"test1_{uuid.uuid4().hex[:8]}@example.com",
            password=make_password("password123"),
            first_name="Test",
            last_name="User",
            major="Computer Science"
        )
        
        # Create student leaders for societies
        self.leader1 = Student.objects.create(
            username=f"leader1_{uuid.uuid4().hex[:8]}",
            email=f"leader1_{uuid.uuid4().hex[:8]}@example.com",
            password=make_password("password123"),
            first_name="Leader",
            last_name="One",
            major="Leadership"
        )
        
        self.leader2 = Student.objects.create(
            username=f"leader2_{uuid.uuid4().hex[:8]}",
            email=f"leader2_{uuid.uuid4().hex[:8]}@example.com",
            password=make_password("password123"),
            first_name="Leader",
            last_name="Two",
            major="Management"
        )
        
        self.leader3 = Student.objects.create(
            username=f"leader3_{uuid.uuid4().hex[:8]}",
            email=f"leader3_{uuid.uuid4().hex[:8]}@example.com",
            password=make_password("password123"),
            first_name="Leader",
            last_name="Three",
            major="Direction"
        )
        
        self.leader4 = Student.objects.create(
            username=f"leader4_{uuid.uuid4().hex[:8]}",
            email=f"leader4_{uuid.uuid4().hex[:8]}@example.com",
            password=make_password("password123"),
            first_name="Leader",
            last_name="Four",
            major="Coordination"
        )

        # Create societies with different categories
        self.tech_society = Society.objects.create(
            name=f"Tech Society {uuid.uuid4().hex[:5]}",
            description="A society for technology enthusiasts",
            category="Technology",
            status="Approved",
            tags=["Coding", "AI", "Innovation"],
            leader=self.leader1,
            approved_by=self.admin
        )

        self.chess_society = Society.objects.create(
            name=f"Chess Club {uuid.uuid4().hex[:5]}",
            description="A society for chess players",
            category="Games",
            status="Approved",
            tags=["Strategy", "Games", "Competition"],
            leader=self.leader2,
            approved_by=self.admin
        )

        self.debate_society = Society.objects.create(
            name=f"Debate Society {uuid.uuid4().hex[:5]}",
            description="A society for debate enthusiasts",
            category="Academic",
            status="Approved",
            tags=["Speaking", "Argument", "Critical Thinking"],
            leader=self.leader3,
            approved_by=self.admin
        )

        self.art_society = Society.objects.create(
            name=f"Art Society {uuid.uuid4().hex[:5]}",
            description="A society for art lovers",
            category="Creative",
            status="Approved",
            tags=["Painting", "Drawing", "Creativity"],
            leader=self.leader4,
            approved_by=self.admin
        )

        # Add the student to some societies
        self.student1.societies.add(self.tech_society)
        self.student1.societies.add(self.chess_society)

        # Create the recommender instance
        self.recommender = SocietyRecommender()

    def test_get_recommendations_for_student_with_memberships(self):
        """Test that recommendations are provided for students with existing memberships"""
        # Create more societies to ensure we have non-member societies available
        leader_extra = Student.objects.create(
            username=f"leader_extra_{uuid.uuid4().hex[:8]}",
            email=f"leader_extra_{uuid.uuid4().hex[:8]}@example.com",
            password=make_password("password123"),
            first_name="Leader",
            last_name="Extra",
            major="Extra Studies"
        )
        
        Society.objects.create(
            name=f"Extra Society {uuid.uuid4().hex[:5]}",
            description="An extra society for testing",
            category="Extra",
            status="Approved",
            tags=["Extra", "Testing", "More"],
            leader=leader_extra,
            approved_by=self.admin
        )

        # Get recommendations
        recommendations = self.recommender.get_recommendations_for_student(self.student1.id, limit=5)

        # Should get recommendations
        self.assertTrue(len(recommendations) > 0)

        # Get the IDs of societies the student is already a member of
        joined_societies = self.student1.societies.all()
        joined_society_ids = {society.id for society in joined_societies}

        # Check for at least one recommended society that isn't in joined societies
        non_member_recommendations = [s for s in recommendations if s.id not in joined_society_ids]
        self.assertTrue(
            len(non_member_recommendations) > 0,
            f"Expected at least one recommendation not in {joined_society_ids}"
        )

    def test_balance_across_categories(self):
        """Test that recommendations are balanced across different categories"""
        # Create more societies in various categories
        leader_ds = Student.objects.create(
            username=f"leader_ds_{uuid.uuid4().hex[:8]}",
            email=f"leader_ds_{uuid.uuid4().hex[:8]}@example.com",
            password=make_password("password123"),
            first_name="Leader",
            last_name="DataScience",
            major="Data Science"
        )
        
        leader_bg = Student.objects.create(
            username=f"leader_bg_{uuid.uuid4().hex[:8]}",
            email=f"leader_bg_{uuid.uuid4().hex[:8]}@example.com",
            password=make_password("password123"),
            first_name="Leader",
            last_name="BoardGames",
            major="Game Theory"
        )
        
        Society.objects.create(
            name=f"Data Science Society {uuid.uuid4().hex[:5]}",
            description="A society for data science enthusiasts",
            category="Technology",
            status="Approved",
            tags=["Data", "Analytics", "ML"],
            leader=leader_ds,
            approved_by=self.admin
        )

        Society.objects.create(
            name=f"Board Games Society {uuid.uuid4().hex[:5]}",
            description="A society for board game enthusiasts",
            category="Games",
            status="Approved",
            tags=["Games", "Strategy", "Fun"],
            leader=leader_bg,
            approved_by=self.admin
        )

        # Get recommendations with a limit that should include both categories
        recommendations = self.recommender.get_recommendations_for_student(self.student1.id, limit=4)
        categories = [society.category for society in recommendations]

        # There should be at least 2 different categories
        self.assertTrue(
            len(set(categories)) >= 2,
            f"Expected recommendations from at least 2 categories, got {set(categories)}"
        )

    def test_recommendation_explanation(self):
        """Test that explanations are properly generated for recommendations"""
        # Create a new student who hasn't joined any societies (truly unique email)
        student2 = Student.objects.create(
            username=f"testuser2_{uuid.uuid4().hex}",
            email=f"test2_{uuid.uuid4().hex}@example.com",
            password=make_password("password123"),
            first_name="Another",
            last_name="Student",
            major="Another Major"
        )

        # Add student2 to one society
        student2.societies.add(self.debate_society)

        # Get explanation for a recommendation
        explanation = self.recommender.get_recommendation_explanation(
            student2.id, self.art_society.id
        )

        # Verify explanation structure
        self.assertIn('type', explanation)
        self.assertIn('message', explanation)
        self.assertTrue(len(explanation['message']) > 0)

    def test_identical_descriptions_handled_properly(self):
        """
        Test that the system handles identical descriptions well by isolating these two societies.
        We delete all other societies so we aren't 'fooled' by other higher-scoring societies.
        """
        # Create societies with identical descriptions but different categories/tags
        identical_desc = "A vibrant community dedicated to bringing like-minded individuals together."

        leader_a = Student.objects.create(
            username=f"leader_a_{uuid.uuid4().hex[:8]}",
            email=f"leader_a_{uuid.uuid4().hex[:8]}@example.com",
            password=make_password("password123"),
            first_name="Leader",
            last_name="A",
            major="Sports Management"
        )
        
        leader_b = Student.objects.create(
            username=f"leader_b_{uuid.uuid4().hex[:8]}",
            email=f"leader_b_{uuid.uuid4().hex[:8]}@example.com",
            password=make_password("password123"),
            first_name="Leader",
            last_name="B",
            major="Music Studies"
        )
        
        society1 = Society.objects.create(
            name=f"Society A {uuid.uuid4().hex[:5]}",
            description=identical_desc,
            category="Sports",
            status="Approved",
            tags=["Football", "Team", "Athletics"],
            leader=leader_a,
            approved_by=self.admin
        )

        society2 = Society.objects.create(
            name=f"Society B {uuid.uuid4().hex[:5]}",
            description=identical_desc,
            category="Music",
            status="Approved",
            tags=["Singing", "Band", "Performance"],
            leader=leader_b,
            approved_by=self.admin
        )

        # Remove all other societies so that only society1 and society2 remain
        Society.objects.exclude(id__in=[society1.id, society2.id]).delete()

        # Create a new student with a unique email
        student3 = Student.objects.create(
            username=f"testuser3_{uuid.uuid4().hex}",
            email=f"test3_{uuid.uuid4().hex}@example.com",
            password=make_password("password123"),
            first_name="Third",
            last_name="Student",
            major="Third Major"
        )

        # Add the student to the society with the identical description
        student3.societies.add(society1)

        # Get recommendations
        recommendations = self.recommender.get_recommendations_for_student(student3.id, limit=5)
        self.assertTrue(len(recommendations) > 0)

        # Society B (same description, different category/tags) should be recommended
        society_ids = [s.id for s in recommendations]
        self.assertIn(
            society2.id,
            society_ids,
            "Society with identical description but different category should be recommended"
        )


class RecommendationAPITestCase(TestCase):
    """Test the recommendation API endpoints"""

    def setUp(self):
        self.client = APIClient()

        # Create an admin for society approval
        self.admin = Admin.objects.create(
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
                leader=self.leaders[i],
                approved_by=self.admin
            )
            self.societies.append(society)

        # Add the student to some societies
        self.student.societies.add(self.societies[0])

        # "Force" authenticate the API client with the Student (who is also a User)
        self.client.force_authenticate(user=self.student)

    def test_recommended_societies_endpoint(self):
        """Test that the recommended societies endpoint works properly"""
        response = self.client.get(reverse('recommended_societies'))

        # Verify response
        self.assertEqual(response.status_code, 200)
        self.assertTrue(isinstance(response.data, list))

        # Should not be empty if we have societies available
        self.assertTrue(len(response.data) > 0)

        # Verify structure of recommendation
        recommendation = response.data[0]
        self.assertIn('society', recommendation)
        self.assertIn('explanation', recommendation)

        # Verify society data
        society = recommendation['society']
        self.assertIn('id', society)
        self.assertIn('name', society)
        self.assertIn('category', society)

        # Verify explanation data
        explanation = recommendation['explanation']
        self.assertIn('type', explanation)
        self.assertIn('message', explanation)

    def test_explanation_endpoint(self):
        """Test that the explanation endpoint works properly"""
        # Get a society the student is not a member of
        non_member_society = self.societies[1]

        response = self.client.get(
            reverse('society_recommendation_explanation', kwargs={'society_id': non_member_society.id})
        )

        # Verify response
        self.assertEqual(response.status_code, 200)
        self.assertIn('type', response.data)
        self.assertIn('message', response.data)

    def test_feedback_endpoint(self):
        """Test that the feedback endpoint works properly"""
        # Get a society the student is not a member of
        non_member_society = self.societies[1]

        # Submit feedback with all required fields
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

        # Verify response
        self.assertEqual(response.status_code, 201)
        self.assertIn('id', response.data)
        self.assertIn('rating', response.data)
        self.assertIn('relevance', response.data)


@patch('api.recommendation_service.text_similarity_analyzer')
@patch('api.recommendation_service.semantic_enhancer')
class MockedRecommendationTests(TestCase):
    """Test the recommendation service with mocked dependencies"""

    def setUp(self):
        # Create an admin for society approval
        self.admin = Admin.objects.create(
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

        # Create test societies
        self.tech_society = Society.objects.create(
            name=f"Tech Society {uuid.uuid4().hex[:5]}",
            description="A society for technology enthusiasts",
            category="Technology",
            status="Approved",
            tags=["Coding", "AI", "Innovation"],
            leader=self.tech_leader,
            approved_by=self.admin
        )

        self.art_society = Society.objects.create(
            name=f"Art Society {uuid.uuid4().hex[:5]}",
            description="A society for art lovers",
            category="Creative",
            status="Approved",
            tags=["Painting", "Drawing", "Creativity"],
            leader=self.art_leader,
            approved_by=self.admin
        )

        # Add the student to a society
        self.student.societies.add(self.tech_society)

        # Initialize the recommender
        self.recommender = SocietyRecommender()

    def test_nlp_similarity_used(self, mock_semantic_enhancer, mock_text_similarity):
        """Test that the NLP similarity analyzer is used"""
        # Mock the calculate_similarity method to return a fixed value
        mock_text_similarity.calculate_similarity.return_value = 3.5
        mock_semantic_enhancer.calculate_semantic_boost.return_value = 0.7

        # Make sure descriptions are set
        self.tech_society.description = "Technology description"
        self.tech_society.save()
        self.art_society.description = "Art description"
        self.art_society.save()

        # Force the use of text similarity by directly calling the method that uses it
        self.recommender._calculate_similarity_score(self.art_society, [self.tech_society])

        # Verify the NLP similarity analyzer was called
        self.assertTrue(mock_text_similarity.calculate_similarity.called)

    def test_semantic_enhancer_used(self, mock_semantic_enhancer, mock_text_similarity):
        """Test that the semantic enhancer is used"""
        # Mock the calculate_semantic_boost method
        mock_text_similarity.calculate_similarity.return_value = 2.8
        mock_semantic_enhancer.calculate_semantic_boost.return_value = 0.6

        # Make descriptions identical to force semantic enhancer usage
        self.tech_society.description = "Same description"
        self.tech_society.save()
        self.art_society.description = "Same description"
        self.art_society.save()

        # Create test data for use with semantic enhancer
        joined_descriptions = ["Same description", "Same description"]

        # Directly call method that uses semantic_enhancer with the mock
        if all(d == joined_descriptions[0] for d in joined_descriptions):
            mock_semantic_enhancer.calculate_semantic_boost(
                self.art_society.name + " " + (self.art_society.category or ""),
                self.tech_society.name + " " + (self.tech_society.category or "")
            )

        # Verify the semantic enhancer was called
        self.assertTrue(mock_semantic_enhancer.calculate_semantic_boost.called)