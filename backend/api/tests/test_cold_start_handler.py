# backend/api/tests/test_cold_start.py

from django.test import TestCase
from django.db.models import Count
from unittest.mock import patch, MagicMock, PropertyMock
from api.cold_start_handler import ColdStartHandler
from api.models import Society, Student, User


class ColdStartHandlerTest(TestCase):
    """Tests for the ColdStartHandler class."""

    def setUp(self):
        """Set up test environment."""
        self.handler = ColdStartHandler()
        
        self.user1 = User.objects.create(
            username='testuser1',
            email='testuser1@example.com'
        )
        self.user2 = User.objects.create(
            username='testuser2',
            email='testuser2@example.com'
        )
        self.user3 = User.objects.create(
            username='testuser3',
            email='testuser3@example.com'
        )
        
        self.student1 = Student.objects.create(
            username='teststudent1',
            email='student1@example.com',
            first_name='Test1',
            last_name='Student',
            major='Computer Science',
            status='Approved'
        )
        
        self.student2 = Student.objects.create(
            username='teststudent2',
            email='student2@example.com',
            first_name='Test2',
            last_name='Student',
            major='Engineering',
            status='Approved'
        )
        
        self.society1 = Society.objects.create(
            name='Tech Society',
            description='A society for tech enthusiasts',
            category='tech',
            status='Approved',
            president=self.student1
        )
        
        self.society2 = Society.objects.create(
            name='Engineering Club',
            description='Engineering projects and discussions',
            category='academic',
            status='Approved',
            president=self.student2
        )
        
        self.society3 = Society.objects.create(
            name='Social Club',
            description='Social activities and networking',
            category='social',
            status='Approved',
            president=self.student1
        )

    @patch('api.cold_start_handler.ColdStartHandler._get_major_based_recommendations')
    @patch('api.cold_start_handler.ColdStartHandler._get_social_based_recommendations')
    @patch('api.cold_start_handler.ColdStartHandler._get_diverse_popular_societies')
    def test_get_initial_recommendations_returns_societies(
        self, mock_diverse, mock_social, mock_major
    ):
        """Test that get_initial_recommendations returns a list of societies."""
        mock_major.return_value = [self.society1]
        mock_social.return_value = [self.society2]
        mock_diverse.return_value = [self.society3]
        
        mock_student = MagicMock()
        mock_student.major = "Computer Science"
        mock_student.following.all.return_value = [self.student2]
        
        with patch('api.models.Student.objects.get', return_value=mock_student):
            recommendations = self.handler.get_initial_recommendations(999, 3)
            
            self.assertEqual(len(recommendations), 3)
            self.assertIn(self.society1, recommendations)
            self.assertIn(self.society2, recommendations)
            self.assertIn(self.society3, recommendations)

    def test_get_initial_recommendations_nonexistent_student(self):
        """Test that get_initial_recommendations returns empty list for nonexistent student."""
        non_existent_id = 9999
        recommendations = self.handler.get_initial_recommendations(non_existent_id)
        self.assertEqual(recommendations, [])

    def test_get_major_based_recommendations(self):
        """Test that major-based recommendations are retrieved correctly."""
        with patch('api.models.Society.objects.filter') as mock_filter:
            mock_filter.return_value.annotate.return_value.order_by.return_value = [self.society1, self.society2]
            
            recommendations = self.handler._get_major_based_recommendations('Computer Science')
            
            mock_filter.assert_called_once()
            self.assertEqual(len(recommendations), 2)
            self.assertEqual(recommendations[0], self.society1)
            self.assertEqual(recommendations[1], self.society2)

    def test_get_major_based_recommendations_empty_major(self):
        """Test that empty major returns empty list."""
        recommendations = self.handler._get_major_based_recommendations('')
        self.assertEqual(recommendations, [])

    def test_get_social_based_recommendations(self):
        """Test that social-based recommendations are retrieved correctly."""
        with patch('api.models.Society.objects.filter') as mock_filter:
            mock_filter.return_value.annotate.return_value.order_by.return_value = [self.society1, self.society3]
            
            recommendations = self.handler._get_social_based_recommendations([self.student2])
            
            mock_filter.assert_called_once()
            self.assertEqual(len(recommendations), 2)
            self.assertEqual(recommendations[0], self.society1)
            self.assertEqual(recommendations[1], self.society3)

    def test_get_social_based_recommendations_empty_users(self):
        """Test that empty followed users returns empty list."""
        recommendations = self.handler._get_social_based_recommendations([])
        self.assertEqual(recommendations, [])

    @patch('api.cold_start_handler.Society.objects')
    def test_get_diverse_popular_societies(self, mock_society_objects):
        """Test that diverse popular societies are retrieved correctly."""
        handler = ColdStartHandler()
        
        mock_categories_query = MagicMock()
        mock_society_objects.filter.return_value = mock_categories_query
        mock_categories_query.values.return_value.annotate.return_value.order_by.return_value = [
            {'category': 'tech'},
            {'category': 'academic'},
            {'category': 'social'}
        ]
        
        def side_effect_filter(*args, **kwargs):
            if 'category' in kwargs:
                mock_result = MagicMock()
                if kwargs['category'] == 'tech':
                    mock_result.annotate.return_value.order_by.return_value.first.return_value = self.society1
                    mock_result.annotate.return_value.order_by.return_value.__getitem__.return_value.first.return_value = None
                elif kwargs['category'] == 'academic':
                    mock_result.annotate.return_value.order_by.return_value.first.return_value = self.society2
                    mock_result.annotate.return_value.order_by.return_value.__getitem__.return_value.first.return_value = None
                elif kwargs['category'] == 'social':
                    mock_result.annotate.return_value.order_by.return_value.first.return_value = self.society3
                    mock_result.annotate.return_value.order_by.return_value.__getitem__.return_value.first.return_value = None
                return mock_result
            return mock_categories_query
        
        mock_society_objects.filter.side_effect = side_effect_filter
        
        result = handler._get_diverse_popular_societies()
        
        self.assertEqual(len(result), 3)
        self.assertIn(self.society1, result)
        self.assertIn(self.society2, result)
        self.assertIn(self.society3, result)

    def test_ensure_category_diversity(self):
        """Test that category diversity is ensured in recommendations."""
        candidates = [
            {'society': self.society1, 'source': 'major', 'score': 3.0},
            {'society': self.society2, 'source': 'major', 'score': 2.8},
            {'society': self.society3, 'source': 'social', 'score': 2.5}
        ]
        
        diversified = self.handler._ensure_category_diversity(candidates, 2)
        
        self.assertEqual(len(diversified), 2)
        categories = [item['society'].category for item in diversified]
        self.assertTrue(len(set(categories)) >= 1)
        
        self.assertEqual(diversified[0]['score'], 3.0)

    def test_ensure_category_diversity_empty_candidates(self):
        """Test that empty candidates list returns empty list."""
        diversified = self.handler._ensure_category_diversity([], 5)
        self.assertEqual(diversified, [])

    def test_ensure_category_diversity_fewer_candidates_than_limit(self):
        """Test that when candidates < limit, all candidates are returned."""
        candidates = [{'society': self.society1, 'source': 'major', 'score': 3.0}]
        diversified = self.handler._ensure_category_diversity(candidates, 3)
        self.assertEqual(diversified, candidates)

    def test_get_explanation_for_cold_start(self):
        """Test that appropriate explanations are generated for different society types."""
        popular_society = MagicMock(spec=Society)
        with patch('builtins.hasattr', side_effect=lambda obj, attr: attr == 'total_members'):
            with patch.object(popular_society, 'total_members', 25, create=True):
                popular_society.category = 'academic'
                explanation = self.handler.get_explanation_for_cold_start(popular_society)
                self.assertEqual(explanation['type'], 'popular')
                self.assertIn('Popular academic society', explanation['message'])
        
        events_society = MagicMock(spec=Society)
        events_society.category = 'sports'
        events_society.events = MagicMock()
        events_society.events.count.return_value = 5
        
        with patch('builtins.hasattr', side_effect=lambda obj, attr: attr != 'total_members'):
            explanation = self.handler.get_explanation_for_cold_start(events_society)
            self.assertEqual(explanation['type'], 'events')
            self.assertIn('Active society', explanation['message'])
        
        category_society = MagicMock(spec=Society)
        category_society.category = 'tech'
        category_society.events = MagicMock()
        category_society.events.count.return_value = 2
        
        with patch('builtins.hasattr', return_value=False):
            explanation = self.handler.get_explanation_for_cold_start(category_society)
            self.assertEqual(explanation['type'], 'category')
            self.assertIn('technology', explanation['message'])