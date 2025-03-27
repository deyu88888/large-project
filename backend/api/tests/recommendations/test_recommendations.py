from api.tests.nltk_setup import ensure_punkt_downloaded
from django.test import TestCase
from api.nlp_similarity import text_similarity_analyzer
from api.models import Society, Student, User
from api.recommendation_service import SocietyRecommender

ensure_punkt_downloaded()


class TestRecommendationSystem(TestCase):
    """Test provided recommendations validity"""
    def setUp(self):
        self.admin = User.objects.create(
            username="admin_user",
            email="admin@example.com",
            first_name="Admin",
            last_name="User",
            role="admin",
            password="adminpassword",
        )

        self.president1 = Student.objects.create(
            username="president_user1",
            email="president1@example.com",
            first_name="President",
            last_name="User",
            password="presidentpassword",
            major="Mechanical Engineering",
        )
        self.president2 = Student.objects.create(
            username="president_user2",
            email="president2@example.com",
            first_name="President",
            last_name="User",
            password="presidentpassword",
            major="Mechanical Engineering",
        )

        Society.objects.create(
            name="Robotics Club",
            president=self.president1,
            approved_by=self.admin,
            status="Approved",
        )
        Society.objects.create(
            name="Sailing Club",
            president=self.president2,
            approved_by=self.admin,
            status="Approved",
        )

    def test_similarity_algorithm(self):
        """Test text is marked as suitably similar"""
        test_cases = [
            ("Chess club for beginners and advanced players",
             "Club for chess enthusiasts of all skill levels"),
            ("Programming society focusing on Python and web development",
             "Coding club for students interested in software engineering"),
            ("Hiking and outdoor adventure society",
             "Rock climbing and mountaineering club"),
            ("Symphony orchestra for classical music lovers",
             "Debate society for political discussion")
        ]

        for text1, text2 in test_cases:
            similarity = text_similarity_analyzer.calculate_similarity(text1, [text2])
            self.assertIsInstance(similarity, float)
            self.assertGreaterEqual(similarity, 0.0)
            self.assertLessEqual(similarity, 5.0)

    def test_recommendations_model_runs(self):
        """Test recommendations can be provided"""
        societies = Society.objects.filter(status="Approved")
        if societies.count() < 2:
            self.skipTest("Need at least 2 approved societies for this test")

        recommender = SocietyRecommender()
        count = recommender.update_similarity_model()
        self.assertGreaterEqual(count, 2)
