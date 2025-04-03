from django.test import TestCase
from django.core.management import call_command
from io import StringIO
from unittest.mock import patch, MagicMock


class InitializeNLPModelTest(TestCase):
    """Tests for the initialize_nlp_model management command."""

    def setUp(self):
        """Set up test environment."""
        self.out = StringIO()

    @patch('api.management.commands.initialize_nlp_model.SocietyRecommender')
    def test_initialize_model(self, mock_recommender_class):
        """Test that the NLP model is initialized correctly."""
        mock_recommender_instance = MagicMock()
        mock_recommender_instance.update_similarity_model.return_value = 15
        mock_recommender_class.return_value = mock_recommender_instance

        call_command('initialize_nlp_model', stdout=self.out)

        mock_recommender_class.assert_called_once()
        mock_recommender_instance.update_similarity_model.assert_called_once()
        
        output = self.out.getvalue()
        self.assertIn('Starting NLP model initialization', output)
        self.assertIn('Successfully initialized NLP model with 15 society descriptions', output)

    @patch('api.management.commands.initialize_nlp_model.SocietyRecommender')
    def test_initialize_model_empty(self, mock_recommender_class):
        """Test initialization with no society descriptions."""
        mock_recommender_instance = MagicMock()
        mock_recommender_instance.update_similarity_model.return_value = 0
        mock_recommender_class.return_value = mock_recommender_instance

        call_command('initialize_nlp_model', stdout=self.out)

        mock_recommender_class.assert_called_once()
        mock_recommender_instance.update_similarity_model.assert_called_once()
        
        output = self.out.getvalue()
        self.assertIn('Successfully initialized NLP model with 0 society descriptions', output)

    @patch('api.management.commands.initialize_nlp_model.SocietyRecommender')
    def test_handles_exceptions(self, mock_recommender_class):
        """Test that exceptions during initialization are handled properly."""
        mock_recommender_instance = MagicMock()
        mock_recommender_instance.update_similarity_model.side_effect = Exception("NLP initialization error")
        mock_recommender_class.return_value = mock_recommender_instance

        with self.assertRaises(Exception) as context:
            call_command('initialize_nlp_model', stdout=self.out)
        
        self.assertEqual(str(context.exception), "NLP initialization error")
        mock_recommender_class.assert_called_once()
        mock_recommender_instance.update_similarity_model.assert_called_once()