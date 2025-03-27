from tests.nltk_setup import ensure_punkt_downloaded
ensure_punkt_downloaded()

from django.test import TestCase
from api.nlp_similarity import text_similarity_analyzer
from api.models import Society
from api.recommendation_service import SocietyRecommender

class TestRecommendationSystem(TestCase):

    def test_similarity_algorithm(self):
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
        societies = Society.objects.filter(status="Approved")
        if societies.count() < 2:
            self.skipTest("Need at least 2 approved societies for this test")

        recommender = SocietyRecommender()
        count = recommender.update_similarity_model()
        self.assertGreaterEqual(count, 2)