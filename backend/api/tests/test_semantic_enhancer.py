import unittest
from api.semantic_enhancer import SemanticDomainEnhancer

class TestSemanticDomainEnhancer(unittest.TestCase):
    def setUp(self):
        self.enhancer = SemanticDomainEnhancer()

    def test_initialization(self):
        """Test that the enhancer initializes properly with all required dictionaries."""
        self.assertIsInstance(self.enhancer.domain_categories, dict)
        self.assertIsInstance(self.enhancer.related_activities, dict)
        self.assertIsInstance(self.enhancer.term_to_category, dict)
        self.assertIsInstance(self.enhancer.term_to_activity, dict)
        self.assertIsInstance(self.enhancer.category_relationships, dict)
        self.assertTrue(len(self.enhancer.term_to_category) > 0)
        
        for activity, terms in self.enhancer.related_activities.items():
            for term in terms:
                self.assertEqual(self.enhancer.term_to_activity[term], activity)
    
    def test_get_related_score(self):
        """Test relationship scoring between categories."""
        # Test same category returns 1.0
        self.assertEqual(self.enhancer.get_related_score("tech", "tech"), 1.0)
        
        # Test existing relationships in both directions
        self.assertEqual(self.enhancer.get_related_score("academic", "science"), 0.8)
        self.assertEqual(self.enhancer.get_related_score("science", "academic"), 0.8)
        
        self.assertEqual(self.enhancer.get_related_score("gaming", "business"), 0.2)
    
    def test_extract_categories_empty(self):
        """Test category extraction with empty text."""
        self.assertEqual(self.enhancer.extract_categories(""), [])
        self.assertEqual(self.enhancer.extract_categories(None), [])
    
    def test_extract_categories_single_word(self):
        """Test category extraction with single matching words."""
        self.assertIn("tech", self.enhancer.extract_categories("programming"))
        self.assertIn("sports", self.enhancer.extract_categories("athlete"))
        self.assertIn("music", self.enhancer.extract_categories("guitar"))
    
    def test_extract_categories_multi_word(self):
        """Test category extraction with multi-word terms."""
        categories = self.enhancer.extract_categories("I enjoy public speaking and debate")
        self.assertIn("debate", categories)
    
    def test_extract_categories_multiple(self):
        """Test extraction of multiple categories from text."""
        categories = self.enhancer.extract_categories("I enjoy programming and playing the guitar")
        self.assertIn("tech", categories)
        self.assertIn("music", categories)
        self.assertEqual(len(categories), 2)
    
    def test_extract_activities_empty(self):
        """Test activity extraction with empty text."""
        self.assertEqual(self.enhancer.extract_activities(""), [])
        self.assertEqual(self.enhancer.extract_activities(None), [])
    
    def test_extract_activities_single_word(self):
        """Test activity extraction with single matching words."""
        self.assertIn("competition", self.enhancer.extract_activities("tournament"))
        self.assertIn("learning", self.enhancer.extract_activities("workshop"))
        self.assertIn("creation", self.enhancer.extract_activities("design"))
    
    def test_extract_activities_multi_word(self):
        """Test activity extraction with multi-word terms."""
        for activity_type, terms in self.enhancer.related_activities.items():
            for term in terms:
                if " " in term:
                    activities = self.enhancer.extract_activities(f"I enjoy {term}")
                    self.assertIn(activity_type, activities)
                    break
    
    def test_extract_activities_multiple(self):
        """Test extraction of multiple activities from text."""
        activities = self.enhancer.extract_activities("Let's have a workshop and then a tournament")
        self.assertIn("learning", activities)
        self.assertIn("competition", activities)
        self.assertEqual(len(activities), 2)
    
    def test_calculate_semantic_boost_empty(self):
        """Test semantic boost calculation with empty texts."""
        self.assertEqual(self.enhancer.calculate_semantic_boost("", ""), 0)
        self.assertEqual(self.enhancer.calculate_semantic_boost("programming", ""), 0)
        self.assertEqual(self.enhancer.calculate_semantic_boost("", "music"), 0)
    
    def test_calculate_semantic_boost_same_category(self):
        """Test semantic boost for texts in the same category."""
        boost = self.enhancer.calculate_semantic_boost("programming computers", "software development")
        self.assertGreaterEqual(boost, 0.7)
    
    def test_calculate_semantic_boost_related_categories(self):
        """Test semantic boost for texts in related categories."""
        boost = self.enhancer.calculate_semantic_boost("academic research", "scientific experiments")
        self.assertGreater(boost, 0.5)
        self.assertLess(boost, 1.0)
    
    def test_calculate_semantic_boost_unrelated_categories(self):
        """Test semantic boost for texts in unrelated categories."""
        boost = self.enhancer.calculate_semantic_boost("computer programming", "outdoor hiking")
        self.assertLess(boost, 0.5)
    
    def test_calculate_semantic_boost_with_activities(self):
        """Test semantic boost with activity terms."""
        boost = self.enhancer.calculate_semantic_boost(
            "computer programming contest", 
            "soccer tournament"
        )
        self.assertGreater(boost, 0.0)
    
    def test_boost_calculation_formula(self):
        """Test that the boost calculation follows the expected formula."""
        original_extract_categories = self.enhancer.extract_categories
        original_extract_activities = self.enhancer.extract_activities
        original_get_related_score = self.enhancer.get_related_score
        
        try:
            self.enhancer.extract_categories = lambda text: ["tech"] if text == "text1" else ["science"]
            self.enhancer.extract_activities = lambda text: ["competition"] if text == "text1" else ["learning"]
            self.enhancer.get_related_score = lambda cat1, cat2: 0.5
            
            boost = self.enhancer.calculate_semantic_boost("text1", "text2")
            self.assertAlmostEqual(boost, 0.35)
            
            self.enhancer.extract_activities = lambda text: ["competition"]  # Same for both
            boost = self.enhancer.calculate_semantic_boost("text1", "text2")
            
            # Expected: (0.7 * 0.5) + (0.3 * 1.0) = 0.65
            self.assertAlmostEqual(boost, 0.65)
            
        finally:
            self.enhancer.extract_categories = original_extract_categories
            self.enhancer.extract_activities = original_extract_activities
            self.enhancer.get_related_score = original_get_related_score
    
    def test_integration(self):
        """Integration test with real examples from student societies."""
        # Tech society vs Gaming society (related)
        tech_desc = "Programming club for students interested in software development and coding competitions."
        gaming_desc = "Gaming society that hosts tournaments for various video games and board games."
        
        tech_gaming_boost = self.enhancer.calculate_semantic_boost(tech_desc, gaming_desc)
        
        # Music society vs Debate society (unrelated)
        music_desc = "Orchestra and choir performances, music lessons and instrument practice."
        debate_desc = "Public speaking events, critical thinking workshops and debate tournaments."
        
        music_debate_boost = self.enhancer.calculate_semantic_boost(music_desc, debate_desc)
        
        self.assertGreater(tech_gaming_boost, music_debate_boost)

if __name__ == '__main__':
    unittest.main()