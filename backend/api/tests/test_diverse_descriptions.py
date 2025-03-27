from tests.nltk_setup import ensure_punkt_downloaded
ensure_punkt_downloaded()

from django.test import TestCase
from api.nlp_similarity import TextSimilarityAnalyzer

class TestDiverseDescriptions(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.analyzer = TextSimilarityAnalyzer()
        cls.descriptions = [
            "Chess Club: We promote the game of chess through regular tournaments, casual play sessions, and lessons for all skill levels. Join us to improve your strategic thinking!",
            "Coding Society: A community for programmers, developers, and tech enthusiasts. We host hackathons, workshops on various languages, and networking events with industry professionals.",
            "Debate Team: Sharpen your public speaking and critical thinking through competitive debate. We participate in local and national tournaments across various formats.",
            "Film Club: For cinema lovers! We watch and discuss classic and contemporary films, organize movie marathons, and even create our own short films.",
            "Hiking Association: Explore the great outdoors through our weekly hiking trips. All fitness levels welcome as we discover local trails and occasionally venture further afield.",
            "Photography Society: Capture the beauty around you! We hold workshops on techniques, equipment reviews, photo walks, and seasonal exhibitions of members' work.",
            "Art Collective: A space for artists to collaborate, share techniques, and exhibit their work. All mediums welcome, from painting to digital art.",
            "Music Ensemble: From classical to contemporary, we bring musicians together to perform, compose, and share their passion for creating music.",
            "Environmental Club: Taking action for our planet through campus initiatives, community clean-ups, and educational workshops on sustainability.",
            "International Students Association: Celebrating cultural diversity through food festivals, language exchanges, and support networks for students from around the world."
        ]
        cls.analyzer.update_corpus(cls.descriptions)

    def test_similarity_cases(self):
        test_cases = [
            # (text1, text2, expected_similarity)
            (self.descriptions[0], self.descriptions[0], 5.0),  # Same
            (self.descriptions[0], "A club for chess players of all levels seeking to improve their game through practice and tournaments.", 4.0),
            (self.descriptions[1], self.descriptions[2], 2.0),  # Coding vs Debate
            (self.descriptions[4], self.descriptions[8], 2.5),  # Hiking vs Environmental
            (self.descriptions[0], self.descriptions[7], 0.5),  # Chess vs Music
            (self.descriptions[3], self.descriptions[9], 0.5),  # Film vs International
        ]
        
        for i, (text1, text2, expected) in enumerate(test_cases, 1):
            with self.subTest(i=i):
                similarity = self.analyzer.calculate_similarity(text1, [text2])
                self.assertIsInstance(similarity, float)
                self.assertGreaterEqual(similarity, 0.0)
                self.assertLessEqual(similarity, 5.0)
                self.assertLessEqual(abs(similarity - expected), 1.5, msg=f"Test {i} failed: expected ≈{expected}, got {similarity:.2f}")