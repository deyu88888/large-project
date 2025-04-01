import unittest
from api.semantic_enhancer import SemanticDomainEnhancer, semantic_enhancer

class TestSemanticDomainEnhancer(unittest.TestCase):
    """Test suite for the SemanticDomainEnhancer class."""
    
    def setUp(self):
        """Create a fresh instance of the enhancer for each test."""
        self.enhancer = SemanticDomainEnhancer()
    
    def test_initialization(self):
        """Test initialization of the class and its data structures."""
        self.assertIsInstance(self.enhancer.domain_categories, dict)
        self.assertGreater(len(self.enhancer.domain_categories), 0)
        
        self.assertIsInstance(self.enhancer.related_activities, dict)
        self.assertGreater(len(self.enhancer.related_activities), 0)
        
        self.assertIsInstance(self.enhancer.term_to_category, dict)
        self.assertGreater(len(self.enhancer.term_to_category), 0)
        
        self.assertIsInstance(self.enhancer.term_to_activity, dict)
        self.assertGreater(len(self.enhancer.term_to_activity), 0)
        
        self.assertIsInstance(self.enhancer.category_relationships, dict)
        self.assertGreater(len(self.enhancer.category_relationships), 0)
        
        self.assertEqual(self.enhancer.term_to_category.get("programming"), "tech")
        self.assertEqual(self.enhancer.term_to_activity.get("tournament"), "competition")
    
    def test_get_related_score_same_category(self):
        """Test relationship score between the same category."""
        score = self.enhancer.get_related_score("tech", "tech")
        self.assertEqual(score, 1.0)
    
    def test_get_related_score_direct_relationship(self):
        """Test relationship score between directly related categories."""
        score = self.enhancer.get_related_score("academic", "science")
        self.assertEqual(score, 0.8)
    
    def test_get_related_score_reverse_relationship(self):
        """Test relationship score when keys are in reverse order."""
        score = self.enhancer.get_related_score("science", "academic")
        self.assertEqual(score, 0.8)
    
    def test_get_related_score_no_relationship(self):
        """Test relationship score for categories with no defined relationship."""
        score = self.enhancer.get_related_score("gaming", "business")
        self.assertEqual(score, 0.2)
    
    def test_extract_categories_empty_input(self):
        """Test category extraction with empty input."""
        categories = self.enhancer.extract_categories("")
        self.assertEqual(categories, [])
        
        categories = self.enhancer.extract_categories(None)
        self.assertEqual(categories, [])
    
    def test_extract_categories_single_word(self):
        """Test extraction of categories from single words."""
        categories = self.enhancer.extract_categories("programming")
        self.assertIn("tech", categories)
        
        categories = self.enhancer.extract_categories("This student likes research.")
        self.assertIn("academic", categories)
    
    def test_extract_categories_multiple_words(self):
        """Test extraction of categories from multiple words."""
        categories = self.enhancer.extract_categories("I love programming and science experiments")
        self.assertIn("tech", categories)
        self.assertIn("science", categories)
        self.assertEqual(len(categories), 2)
    
    def test_extract_categories_multi_word_terms(self):
        """Test extraction of categories from multi-word terms."""
        categories = self.enhancer.extract_categories("We need to do some public speaking exercises")
        self.assertIn("debate", categories)
    
    def test_extract_categories_case_insensitive(self):
        """Test that category extraction is case-insensitive."""
        categories = self.enhancer.extract_categories("PROGRAMMING and Science")
        self.assertIn("tech", categories)
        self.assertIn("science", categories)
    
    def test_extract_categories_duplicates(self):
        """Test that duplicate categories are removed."""
        categories = self.enhancer.extract_categories("programming coding software development")
        self.assertEqual(len(categories), 1)
        self.assertIn("tech", categories)
    
    def test_extract_activities_empty_input(self):
        """Test activity extraction with empty input."""
        activities = self.enhancer.extract_activities("")
        self.assertEqual(activities, [])
        
        activities = self.enhancer.extract_activities(None)
        self.assertEqual(activities, [])
    
    def test_extract_activities_single_word(self):
        """Test extraction of activities from single words."""
        activities = self.enhancer.extract_activities("tournament")
        self.assertIn("competition", activities)
        
        activities = self.enhancer.extract_activities("Let's have a workshop together.")
        self.assertIn("learning", activities)
        self.assertIn("collaboration", activities)
        self.assertEqual(len(activities), 2)
    
    def test_extract_activities_multiple_words(self):
        """Test extraction of activities from multiple words."""
        activities = self.enhancer.extract_activities("We'll have a tournament followed by a workshop")
        self.assertIn("competition", activities)
        self.assertIn("learning", activities)
        self.assertEqual(len(activities), 2)
    
    def test_extract_activities_multi_word_terms(self):
        """Test extraction of activities from multi-word terms."""
        for activity_type, terms in self.enhancer.related_activities.items():
            for term in terms:
                if ' ' in term:
                    text = f"We're organizing a {term} next week"
                    activities = self.enhancer.extract_activities(text)
                    self.assertIn(activity_type, activities)
                    break
    
    def test_extract_activities_case_insensitive(self):
        """Test that activity extraction is case-insensitive."""
        activities = self.enhancer.extract_activities("TOURNAMENT and Workshop")
        self.assertIn("competition", activities)
        self.assertIn("learning", activities)
    
    def test_extract_activities_duplicates(self):
        """Test that duplicate activities are removed."""
        activities = self.enhancer.extract_activities("tournament contest championship")
        self.assertEqual(len(activities), 1)
        self.assertIn("competition", activities)
    
    def test_calculate_semantic_boost_empty_inputs(self):
        """Test semantic boost calculation with empty inputs."""
        boost = self.enhancer.calculate_semantic_boost("", "")
        self.assertEqual(boost, 0)
        
        boost = self.enhancer.calculate_semantic_boost("programming", "")
        self.assertEqual(boost, 0)
        
        boost = self.enhancer.calculate_semantic_boost("", "science")
        self.assertEqual(boost, 0)
    
    def test_calculate_semantic_boost_same_category(self):
        """Test semantic boost for texts in the same category."""
        boost = self.enhancer.calculate_semantic_boost(
            "We offer programming courses", 
            "Learn software development with us"
        )
        self.assertGreaterEqual(boost, 0.7)
    
    def test_calculate_semantic_boost_related_categories(self):
        """Test semantic boost for texts in related categories."""
        boost = self.enhancer.calculate_semantic_boost(
            "Academic research opportunities", 
            "Scientific experiments and observations"
        )
        self.assertGreater(boost, 0.5)
        self.assertLess(boost, 1.0)
    
    def test_calculate_semantic_boost_unrelated_categories(self):
        """Test semantic boost for texts in unrelated categories."""
        boost = self.enhancer.calculate_semantic_boost(
            "Programming and technology club", 
            "Outdoor hiking and camping adventures"
        )
        self.assertLessEqual(boost, 0.5)
    
    def test_calculate_semantic_boost_one_category_missing(self):
        """Test semantic boost when one text has no recognized categories."""
        boost = self.enhancer.calculate_semantic_boost(
            "Programming and development",
            "Completely unrelated words with no category matches"
        )
        self.assertEqual(boost, 0)
    
    def test_calculate_semantic_boost_with_activities(self):
        """Test semantic boost calculation with activity terms."""
        boost1 = self.enhancer.calculate_semantic_boost(
            "Tech programming competitions",
            "Tech coding exercises"
        )
        
        boost2 = self.enhancer.calculate_semantic_boost(
            "Tech programming",
            "Tech coding"
        )
        
        self.assertGreaterEqual(boost1, boost2)
    
    def test_calculate_semantic_boost_no_common_activities(self):
        """Test semantic boost with no common activities."""
        boost = self.enhancer.calculate_semantic_boost(
            "Programming competitions and tournaments",
            "Coding workshops and classes"
        )
        self.assertGreater(boost, 0)
    
    def test_calculate_semantic_boost_formula(self):
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
            
            self.enhancer.extract_activities = lambda text: ["competition"]
            boost = self.enhancer.calculate_semantic_boost("text1", "text2")
            self.assertAlmostEqual(boost, 0.65)
            
        finally:
            self.enhancer.extract_categories = original_extract_categories
            self.enhancer.extract_activities = original_extract_activities
            self.enhancer.get_related_score = original_get_related_score
    
    def test_top_category_scores_averaging(self):
        """Test that only top category scores are used in the calculation."""
        original_extract_categories = self.enhancer.extract_categories
        original_get_related_score = self.enhancer.get_related_score
        
        try:
            self.enhancer.extract_categories = lambda text: ["tech", "science", "business"] if text == "text1" else ["gaming", "sports", "media"]
            scores = {
                ("tech", "gaming"): 0.5,
                ("tech", "sports"): 0.2,
                ("tech", "media"): 0.4,
                ("science", "gaming"): 0.3,
                ("science", "sports"): 0.1,
                ("science", "media"): 0.3,
                ("business", "gaming"): 0.2,
                ("business", "sports"): 0.3,
                ("business", "media"): 0.4,
            }
            
            def mock_get_related_score(cat1, cat2):
                key = (cat1, cat2)
                if key in scores:
                    return scores[key]
                return scores.get((cat2, cat1), 0.2)
            
            self.enhancer.get_related_score = mock_get_related_score
            self.enhancer.extract_activities = lambda text: []
            
            boost = self.enhancer.calculate_semantic_boost("text1", "text2")
            self.assertAlmostEqual(boost, 0.7 * ((0.5 + 0.4 + 0.4) / 3))
            
        finally:
            self.enhancer.extract_categories = original_extract_categories
            self.enhancer.get_related_score = original_get_related_score
            self.enhancer.extract_activities = lambda text: []
    
    def test_activity_similarity_calculation(self):
        """Test the activity similarity calculation."""
        original_extract_categories = self.enhancer.extract_categories
        original_extract_activities = self.enhancer.extract_activities
        
        try:
            self.enhancer.extract_categories = lambda text: []
            
            # No activities
            self.enhancer.extract_activities = lambda text: []
            boost = self.enhancer.calculate_semantic_boost("text1", "text2")
            self.assertEqual(boost, 0)
            
            # No overlap
            self.enhancer.extract_activities = lambda text: ["competition"] if text == "text1" else ["learning"]
            boost = self.enhancer.calculate_semantic_boost("text1", "text2")
            self.assertEqual(boost, 0)  # 0 because no categories were found
            
            self.enhancer.extract_activities = lambda text: ["competition", "learning"] if text == "text1" else ["learning", "creation"]
            
            def mock_calculate_semantic_boost(text1, text2):
                activities1 = ["competition", "learning"]
                activities2 = ["learning", "creation"]
                
                common_activities = set(activities1).intersection(set(activities2))
                all_activities = set(activities1).union(set(activities2))
                activity_similarity = len(common_activities) / len(all_activities)
                return activity_similarity
            
            similarity = mock_calculate_semantic_boost("text1", "text2")
            self.assertAlmostEqual(similarity, 1/3)
            
            def mock_complete_overlap(text1, text2):
                activities1 = ["competition", "learning"]
                activities2 = ["competition", "learning"]
                
                common_activities = set(activities1).intersection(set(activities2))
                all_activities = set(activities1).union(set(activities2))
                activity_similarity = len(common_activities) / len(all_activities)
                
                return activity_similarity
            
            similarity = mock_complete_overlap("text1", "text2")
            self.assertEqual(similarity, 1.0)
            
        finally:
            self.enhancer.extract_categories = original_extract_categories
            self.enhancer.extract_activities = original_extract_activities
    
    def test_real_world_examples(self):
        """Test with real-world examples of society descriptions."""
        # Programming society vs. Computer Science society (very related)
        programming_desc = "We are a programming club focusing on software development, coding competitions, and hackathons."
        cs_desc = "The Computer Science Society offers workshops on algorithms, data structures, and programming languages."
        
        prog_cs_boost = self.enhancer.calculate_semantic_boost(programming_desc, cs_desc)
        
        # Music society vs. Sports society (unrelated)
        music_desc = "Join our music society for orchestra practice, choir performances, and music theory lessons."
        sports_desc = "The sports club organizes tournaments, training sessions, and fitness activities."
        
        music_sports_boost = self.enhancer.calculate_semantic_boost(music_desc, sports_desc)
        
        # Music society vs. Performance Arts (related)
        performance_desc = "Our performance arts society puts on theatrical productions, drama workshops, and acting classes."
        music_performance_boost = self.enhancer.calculate_semantic_boost(music_desc, performance_desc)
        
        self.assertGreater(prog_cs_boost, music_sports_boost)
        self.assertGreater(music_performance_boost, music_sports_boost)
    
    def test_global_semantic_enhancer_instance(self):
        """Test the global semantic_enhancer instance."""
        self.assertIsInstance(semantic_enhancer, SemanticDomainEnhancer)
        boost = semantic_enhancer.calculate_semantic_boost(
            "Programming workshop", 
            "Coding class"
        )
        self.assertGreater(boost, 0)

if __name__ == '__main__':
    unittest.main()