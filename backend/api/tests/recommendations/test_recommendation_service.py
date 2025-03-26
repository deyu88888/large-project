import unittest.mock
import uuid
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password

from api.models import Society, Student, User
from api.recommendation_service import SocietyRecommender

User = get_user_model()


class RecommendationServiceTestCase(TestCase):
    """Test the core recommendation service functionality"""

    def setUp(self):
        # Create a test admin user for approved_by field
        self.admin = User.objects.create(
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
            president=self.leader1,
            approved_by=self.admin
        )

        self.chess_society = Society.objects.create(
            name=f"Chess Club {uuid.uuid4().hex[:5]}",
            description="A society for chess players",
            category="Games",
            status="Approved",
            tags=["Strategy", "Games", "Competition"],
            president=self.leader2,
            approved_by=self.admin
        )

        self.debate_society = Society.objects.create(
            name=f"Debate Society {uuid.uuid4().hex[:5]}",
            description="A society for debate enthusiasts",
            category="Academic",
            status="Approved",
            tags=["Speaking", "Argument", "Critical Thinking"],
            president=self.leader3,
            approved_by=self.admin
        )

        self.art_society = Society.objects.create(
            name=f"Art Society {uuid.uuid4().hex[:5]}",
            description="A society for art lovers",
            category="Creative",
            status="Approved",
            tags=["Painting", "Drawing", "Creativity"],
            president=self.leader4,
            approved_by=self.admin
        )

        self.student1.societies.add(self.tech_society)
        self.student1.societies.add(self.chess_society)
        self.recommender = SocietyRecommender()
        
        text_similarity_patcher = unittest.mock.patch('api.recommendation_service.text_similarity_analyzer')
        self.mock_text_similarity = text_similarity_patcher.start()
        self.mock_text_similarity.calculate_similarity.return_value = 0.75
        self.addCleanup(text_similarity_patcher.stop)
        
        semantic_enhancer_patcher = unittest.mock.patch('api.recommendation_service.semantic_enhancer')
        self.mock_semantic_enhancer = semantic_enhancer_patcher.start()
        self.mock_semantic_enhancer.calculate_semantic_boost.return_value = 0.5
        self.addCleanup(semantic_enhancer_patcher.stop)

    def test_get_recommendations_for_student_with_memberships(self):
        """Test that recommendations are provided for students with existing memberships"""
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
            president=leader_extra,
            approved_by=self.admin
        )

        recommendations = self.recommender.get_recommendations_for_student(self.student1.id, limit=5)
        self.assertTrue(len(recommendations) > 0)

        joined_societies = self.student1.societies.all()
        joined_society_ids = {society.id for society in joined_societies}

        non_member_recommendations = [s for s in recommendations if s.id not in joined_society_ids]
        self.assertTrue(
            len(non_member_recommendations) > 0,
            f"Expected at least one recommendation not in {joined_society_ids}"
        )

    def test_balance_across_categories(self):
        """Test that recommendations are balanced across different categories"""
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
            president=leader_ds,
            approved_by=self.admin
        )

        Society.objects.create(
            name=f"Board Games Society {uuid.uuid4().hex[:5]}",
            description="A society for board game enthusiasts",
            category="Games",
            status="Approved",
            tags=["Games", "Strategy", "Fun"],
            president=leader_bg,
            approved_by=self.admin
        )

        recommendations = self.recommender.get_recommendations_for_student(self.student1.id, limit=4)
        categories = [society.category for society in recommendations]

        self.assertTrue(
            len(set(categories)) >= 2,
            f"Expected recommendations from at least 2 categories, got {set(categories)}"
        )


    def test_recommendation_explanation(self):
        """Test that explanations are properly generated for recommendations"""
        student2 = Student.objects.create(
            username=f"testuser2_{uuid.uuid4().hex}",
            email=f"test2_{uuid.uuid4().hex}@example.com",
            password=make_password("password123"),
            first_name="Another",
            last_name="Student",
            major="Another Major"
        )

        student2.societies.add(self.debate_society)

        with unittest.mock.patch.object(
            SocietyRecommender, 
            '_get_recommendation_explanation_details',
            return_value={
                'type': 'similarity',
                'message': 'This society has similar interests to ones you have already joined.',
                'similarity_score': 0.75
            }
        ):
            explanation = self.recommender.get_recommendation_explanation(
                student2.id, self.art_society.id
            )

            self.assertIn('type', explanation)
            self.assertIn('message', explanation)
            self.assertTrue(len(explanation['message']) > 0)

    def test_identical_descriptions_handled_properly(self):
        """
        Test that the system handles identical descriptions well by isolating these two societies.
        We delete all other societies so we aren't 'fooled' by other higher-scoring societies.
        """
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
            president=leader_a,
            approved_by=self.admin
        )

        society2 = Society.objects.create(
            name=f"Society B {uuid.uuid4().hex[:5]}",
            description=identical_desc,
            category="Music",
            status="Approved",
            tags=["Singing", "Band", "Performance"],
            president=leader_b,
            approved_by=self.admin
        )

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

        student3.societies.add(society1)
        recommendations = self.recommender.get_recommendations_for_student(student3.id, limit=5)
        self.assertTrue(len(recommendations) > 0)

        society_ids = [s.id for s in recommendations]
        self.assertIn(
            society2.id,
            society_ids,
            "Society with identical description but different category should be recommended"
        )
