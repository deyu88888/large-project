from django.test import TestCase
from django.utils import timezone
from unittest.mock import patch, MagicMock
import datetime

from api.models import Student, Society, User, Event
from api.recommendation_service import SocietyRecommender
from api.nlp_similarity import text_similarity_analyzer
from api.semantic_enhancer import semantic_enhancer

class SocietyRecommenderTests(TestCase):
    def setUp(self):
        """Set up test environment with necessary data."""
        # Patch NLTK dependencies globally
        self.nltk_patcher = patch.dict('sys.modules', {
            'nltk': MagicMock(),
            'nltk.tokenize': MagicMock(),
            'nltk.data': MagicMock()
        })
        self.nltk_patcher.start()

        self.admin_user = User.objects.create_user(
            username='admin123', 
            email='admin@example.com', 
            password='password',
            role='admin'
        )
        
        self.student1 = Student.objects.create(
            username='student1', 
            email='student1@example.com', 
            password='password',
            first_name='John',
            last_name='Doe'
        )
        
        self.student2 = Student.objects.create(
            username='student2', 
            email='student2@example.com', 
            password='password',
            first_name='Jane',
            last_name='Smith'
        )
        
        self.tech_society = Society.objects.create(
            name='Tech Society',
            description='A society for technology enthusiasts',
            category='Technology',
            status='Approved',
            tags=['programming', 'coding', 'software'],
            president=self.student1,
            approved_by=self.admin_user
        )
        
        self.art_society = Society.objects.create(
            name='Art Society',
            description='A society for art lovers and creators',
            category='Arts',
            status='Approved',
            tags=['painting', 'drawing', 'creativity'],
            president=self.student2,
            approved_by=self.admin_user
        )
        
        self.sports_society = Society.objects.create(
            name='Sports Club',
            description='For sports enthusiasts and athletes',
            category='Sports',
            status='Approved',
            tags=['fitness', 'athletics', 'team sports'],
            president=self.student2,
            approved_by=self.admin_user
        )
        
        self.recent_event = Event.objects.create(
            title='Tech Workshop',
            hosted_by=self.tech_society,
            date=timezone.now() - datetime.timedelta(days=15)
        )
        self.recent_event.current_attendees.set([self.student1, self.student2])
        self.student1.societies.add(self.tech_society)

        # Globally mock NLP dependencies
        self.text_similarity_patcher = patch.object(text_similarity_analyzer, 'calculate_similarity', return_value=3.0)
        self.text_preprocess_patcher = patch.object(text_similarity_analyzer, 'preprocess_text', side_effect=lambda x: x.split())
        self.semantic_boost_patcher = patch.object(semantic_enhancer, 'calculate_semantic_boost', return_value=1.0)
        
        self.text_similarity_patcher.start()
        self.text_preprocess_patcher.start()
        self.semantic_boost_patcher.start()
    
    def tearDown(self):
        """Clean up patches after each test."""
        self.nltk_patcher.stop()
        
        self.text_similarity_patcher.stop()
        self.text_preprocess_patcher.stop()
        self.semantic_boost_patcher.stop()
    
    def test_get_popular_societies(self):
        """Test retrieving popular societies."""
        recommender = SocietyRecommender()
        
        with patch.object(recommender, 'get_popular_societies', return_value=[
            self.tech_society, 
            self.sports_society, 
            self.art_society
        ]):
            popular_societies = recommender.get_popular_societies()
            
            self.assertEqual(len(popular_societies), 3)
            self.assertIn(self.tech_society, popular_societies)
            self.assertIn(self.sports_society, popular_societies)
            self.assertIn(self.art_society, popular_societies)
    
    def test_get_recommendations_for_student(self):
        """Test getting recommendations for a student."""
        recommender = SocietyRecommender()
        recommendations = recommender.get_recommendations_for_student(self.student1.id)
        
        self.assertTrue(len(recommendations) > 0)
        self.assertNotIn(self.tech_society, recommendations)
    
    def test_recommendations_with_no_societies(self):
        """Test recommendations for a student with no societies."""
        recommender = SocietyRecommender()
        
        new_student = Student.objects.create(
            username='newstudent', 
            email='new@example.com', 
            password='password'
        )
        
        recommendations = recommender.get_recommendations_for_student(new_student.id)
        
        # Should return popular societies
        self.assertTrue(len(recommendations) > 0)
    
    def test_recommendation_diversity_levels(self):
        """Test recommendation diversity levels."""
        recommender = SocietyRecommender()
        
        # Low diversity recommendations
        low_diversity_recs = recommender.get_recommendations_for_student(
            self.student1.id, 
            diversity_level='low'
        )
        
        # High diversity recommendations
        high_diversity_recs = recommender.get_recommendations_for_student(
            self.student1.id, 
            diversity_level='high'
        )
        
        # Balanced diversity recommendations
        balanced_diversity_recs = recommender.get_recommendations_for_student(
            self.student1.id, 
            diversity_level='balanced'
        )
        
        self.assertTrue(len(low_diversity_recs) > 0)
        self.assertTrue(len(high_diversity_recs) > 0)
        self.assertTrue(len(balanced_diversity_recs) > 0)
    
    def test_recommendation_explanation(self):
        """Test generating recommendation explanation."""
        recommender = SocietyRecommender()
        
        explanation = recommender.get_recommendation_explanation(
            self.student1.id, 
            self.sports_society.id
        )
        
        self.assertIn('type', explanation)
        self.assertIn('message', explanation)
        self.assertTrue(explanation['type'] in [
            'general', 'category', 'tags', 'content', 'diversity', 'popular'
        ])
        self.assertTrue(len(explanation['message']) > 0)
    
    def test_update_similarity_model(self):
        """Test updating the similarity model."""
        recommender = SocietyRecommender()
        
        with patch.object(text_similarity_analyzer, 'update_corpus') as mock_update:
            updated_count = recommender.update_similarity_model()
            mock_update.assert_called_once()
            self.assertGreater(updated_count, 0)
    
    def test_similarity_score_calculation(self):
        """Test similarity score calculation."""
        recommender = SocietyRecommender()
        
        similarity_score = recommender._calculate_similarity_score(
            self.sports_society, 
            self.student1.societies.all(),
            self.student1
        )
        
        self.assertIsInstance(similarity_score, float)
        self.assertGreater(similarity_score, 0)
    
    def test_recommendation_for_nonexistent_student(self):
        """Test recommendations for a nonexistent student."""
        recommender = SocietyRecommender()
        recommendations = recommender.get_recommendations_for_student(9999)
        self.assertTrue(len(recommendations) > 0)

if __name__ == '__main__':
    import unittest
    unittest.main()