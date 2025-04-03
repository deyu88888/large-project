from django.test import TestCase
from django.core.management import call_command
from io import StringIO
from unittest.mock import patch, MagicMock


class RunEvaluationTest(TestCase):
    """Tests for the run_evaluation management command."""

    def setUp(self):
        """Set up test environment."""
        self.out = StringIO()
    
    @patch('api.management.commands.run_evaluation.SocietyRecommender')
    @patch('api.management.commands.run_evaluation.recommendation_evaluator')
    def test_standard_mode(self, mock_evaluator, mock_recommender_class):
        """Test that standard evaluation mode works correctly."""
        mock_recommender_instance = MagicMock()
        mock_recommender_class.return_value = mock_recommender_instance
        
        mock_results = {
            'num_test_users': 50,
            'metrics': {
                'precision': {'mean': 0.75},
                'recall': {'mean': 0.82},
                'ndcg': {'mean': 0.68}
            }
        }
        mock_evaluator.evaluate_recommender.return_value = mock_results
        
        call_command('run_evaluation', mode='standard', k=5, stdout=self.out)
        
        mock_recommender_class.assert_called_once()
        mock_evaluator.evaluate_recommender.assert_called_once_with(mock_recommender_instance, k=5)
        
        output = self.out.getvalue()
        self.assertIn('Running standard evaluation', output)
        self.assertIn('Test users: 50', output)
        self.assertIn('precision: 0.7500', output)
        self.assertIn('recall: 0.8200', output)
        self.assertIn('ndcg: 0.6800', output)
    
    @patch('api.management.commands.run_evaluation.SocietyRecommender')
    @patch('api.management.commands.run_evaluation.recommendation_evaluator')
    @patch('api.management.commands.run_evaluation.cold_start_handler')
    def test_cold_start_mode(self, mock_handler, mock_evaluator, mock_recommender_class):
        """Test that cold start evaluation mode works correctly."""
        mock_recommender_instance = MagicMock()
        mock_recommender_class.return_value = mock_recommender_instance
        
        mock_results = {
            'num_test_users': 30,
            'cold_start_metrics': {
                'cold_start_precision': {'mean': 0.62},
                'popular_precision': {'mean': 0.48},
                'precision_improvement': {'mean': 0.29},
                'cold_start_diversity': {'mean': 0.85},
                'popular_diversity': {'mean': 0.45}
            }
        }
        mock_evaluator.evaluate_cold_start.return_value = mock_results
        
        call_command('run_evaluation', mode='cold_start', k=10, stdout=self.out)
        
        # Verify mocks were called correctly
        mock_recommender_class.assert_called_once()
        mock_evaluator.evaluate_cold_start.assert_called_once_with(
            mock_recommender_instance, mock_handler, k=10
        )
        
        output = self.out.getvalue()
        self.assertIn('Running cold start evaluation', output)
        self.assertIn('Test users: 30', output)
        self.assertIn('Cold Start Precision: 0.6200', output)
        self.assertIn('Popularity Precision: 0.4800', output)
        self.assertIn('Improvement: 0.2900 (29.0%)', output)
        self.assertIn('Cold Start Diversity: 0.8500', output)
        self.assertIn('Popularity Diversity: 0.4500', output)
    
    @patch('api.management.commands.run_evaluation.SocietyRecommender')
    @patch('api.management.commands.run_evaluation.recommendation_evaluator')
    def test_diversity_mode(self, mock_evaluator, mock_recommender_class):
        """Test that diversity evaluation mode works correctly."""
        mock_recommender_instance = MagicMock()
        mock_recommender_class.return_value = mock_recommender_instance
        
        mock_results = {
            'num_test_users': 40,
            'aggregate_metrics': {
                'low': {
                    'precision_avg': 0.82,
                    'diversity_avg': 0.41
                },
                'medium': {
                    'precision_avg': 0.74,
                    'diversity_avg': 0.65
                },
                'high': {
                    'precision_avg': 0.59,
                    'diversity_avg': 0.88
                }
            }
        }
        mock_evaluator.evaluate_diverstity_vs_relevance.return_value = mock_results
        call_command('run_evaluation', mode='diversity', k=8, stdout=self.out)
        
        mock_recommender_class.assert_called_once()
        mock_evaluator.evaluate_diverstity_vs_relevance.assert_called_once_with(
            mock_recommender_instance, k=8
        )
        
        output = self.out.getvalue()
        self.assertIn('Running diversity vs. relevance evaluation', output)
        self.assertIn('Test users: 40', output)
        self.assertIn('LOW diversity setting', output)
        self.assertIn('Precision: 0.8200', output)
        self.assertIn('Diversity: 0.4100', output)
        self.assertIn('MEDIUM diversity setting', output)
        self.assertIn('Precision: 0.7400', output)
        self.assertIn('Diversity: 0.6500', output)
        self.assertIn('HIGH diversity setting', output)
        self.assertIn('Precision: 0.5900', output)
        self.assertIn('Diversity: 0.8800', output)
    
    @patch('api.management.commands.run_evaluation.SocietyRecommender')
    @patch('api.management.commands.run_evaluation.recommendation_evaluator')
    @patch('api.management.commands.run_evaluation.cold_start_handler')
    def test_all_modes(self, mock_handler, mock_evaluator, mock_recommender_class):
        """Test that 'all' mode runs all evaluation types."""
        mock_recommender_instance = MagicMock()
        mock_recommender_class.return_value = mock_recommender_instance
        
        mock_standard_results = {
            'num_test_users': 50,
            'metrics': {'precision': {'mean': 0.75}}
        }
        mock_cold_start_results = {
            'num_test_users': 30,
            'cold_start_metrics': {
                'cold_start_precision': {'mean': 0.62},
                'popular_precision': {'mean': 0.48},
                'precision_improvement': {'mean': 0.29},
                'cold_start_diversity': {'mean': 0.85},
                'popular_diversity': {'mean': 0.45}
            }
        }
        mock_diversity_results = {
            'num_test_users': 40,
            'aggregate_metrics': {
                'low': {'precision_avg': 0.82, 'diversity_avg': 0.41},
                'medium': {'precision_avg': 0.74, 'diversity_avg': 0.65},
                'high': {'precision_avg': 0.59, 'diversity_avg': 0.88}
            }
        }
        
        mock_evaluator.evaluate_recommender.return_value = mock_standard_results
        mock_evaluator.evaluate_cold_start.return_value = mock_cold_start_results
        mock_evaluator.evaluate_diverstity_vs_relevance.return_value = mock_diversity_results
        
        call_command('run_evaluation', mode='all', k=5, stdout=self.out)
        
        # Verify all evaluation methods were called
        mock_recommender_class.assert_called_once()
        mock_evaluator.evaluate_recommender.assert_called_once()
        mock_evaluator.evaluate_cold_start.assert_called_once()
        mock_evaluator.evaluate_diverstity_vs_relevance.assert_called_once()
        
        # Check output includes all modes
        output = self.out.getvalue()
        self.assertIn('standard evaluation', output)
        self.assertIn('cold start evaluation', output)
        self.assertIn('diversity vs. relevance evaluation', output)
    
    @patch('api.management.commands.run_evaluation.SocietyRecommender')
    @patch('api.management.commands.run_evaluation.recommendation_evaluator')
    def test_error_handling(self, mock_evaluator, mock_recommender_class):
        """Test that errors in evaluation are properly handled."""
        mock_recommender_instance = MagicMock()
        mock_recommender_class.return_value = mock_recommender_instance
        
        mock_results = {
            'error': 'Not enough test data available'
        }
        mock_evaluator.evaluate_recommender.return_value = mock_results
        
        call_command('run_evaluation', mode='standard', stdout=self.out)
        output = self.out.getvalue()
        self.assertIn('Error: Not enough test data available', output)