import unittest
from unittest.mock import patch, Mock, MagicMock
import numpy as np
import nltk
from api.nlp_similarity import text_similarity_analyzer as tsa2

from api.nlp_similarity import TextSimilarityAnalyzer, text_similarity_analyzer


class TestTextSimilarityAnalyzer(unittest.TestCase):
    """Test suite for TextSimilarityAnalyzer class."""

    @classmethod
    def setUpClass(cls):
        """Set up class-level fixtures. Download NLTK resources."""
        try:
            nltk.download('punkt')
            nltk.download('stopwords')
            nltk.download('wordnet')
        except Exception as e:
            print(f"Warning: Could not download NLTK resources: {e}")

    def setUp(self):
        """Set up test fixtures."""
        self.analyzer = TextSimilarityAnalyzer()
        
        self.text1 = "The Computer Science Society organizes programming competitions and tech talks."
        self.text2 = "Our CS club holds coding contests and technology presentations regularly."
        self.text3 = "The Photography Club offers workshops on digital and film photography techniques."
        
        self.mock_embedding1 = np.array([0.1, 0.2, 0.3, 0.4])
        self.mock_embedding2 = np.array([0.15, 0.25, 0.35, 0.45])
        self.mock_embedding3 = np.array([0.8, 0.7, 0.6, 0.5])

    def test_initialization(self):
        """Test the initialization of TextSimilarityAnalyzer."""
        self.assertIsNotNone(self.analyzer.tfidf_vectorizer)
        self.assertIsNotNone(self.analyzer.count_vectorizer)
        self.assertIsNotNone(self.analyzer.lemmatizer)
        self.assertIsNotNone(self.analyzer.stop_words)
        
        self.assertEqual(sum(self.analyzer.weights.values()), 1.0)

    def test_preprocess_text(self):
        """Test text preprocessing functionality."""
        with patch('api.nlp_similarity.word_tokenize') as mock_tokenize:
            # Configure mock to return simple tokens
            mock_tokenize.return_value = ["this", "is", "a", "test", "sentence", "with", "punctuation"]
            
            raw_text = "This is a TEST sentence with Punctuation!!"
            processed = self.analyzer.preprocess_text(raw_text)
            
            # Basic verification that preprocessing was called
            mock_tokenize.assert_called_once()
            
            self.assertEqual(self.analyzer.preprocess_text(""), "")
            self.assertEqual(self.analyzer.preprocess_text(None), "")

    def test_get_embedding(self):
        """Test embedding generation with mocked SentenceTransformer."""
        mock_model = Mock()
        mock_model.encode.return_value = np.array([0.1, 0.2, 0.3])
        
        # Create analyzer and set the mock model
        analyzer = TextSimilarityAnalyzer()
        analyzer.sentence_model = mock_model
        
        # Test embedding generation
        embedding = analyzer.get_embedding("Test text")
        self.assertIsNotNone(embedding)
        self.assertEqual(embedding.shape, (3,))
        mock_model.encode.assert_called_once()
        
        analyzer.get_embedding("Test text")
        self.assertEqual(mock_model.encode.call_count, 1)
        
        # Test with None
        self.assertIsNone(analyzer.get_embedding(None))
        
        # Test with exception
        mock_model.encode.side_effect = Exception("Model error")
        self.assertIsNone(analyzer.get_embedding("Error text"))

    @patch.object(TextSimilarityAnalyzer, 'get_embedding')
    def test_calculate_embedding_similarity(self, mock_get_embedding):
        """Test embedding similarity calculation."""
        mock_get_embedding.side_effect = lambda text: {
            self.text1: self.mock_embedding1,
            self.text2: self.mock_embedding2,
            self.text3: self.mock_embedding3,
        }.get(text)
        
        self.analyzer.sentence_model = Mock()
        
        # Test similarity between similar texts
        similarity1 = self.analyzer._calculate_embedding_similarity(self.text1, self.text2)
        self.assertGreater(similarity1, 0.95)
        
        # Test similarity between different texts
        similarity2 = self.analyzer._calculate_embedding_similarity(self.text1, self.text3)
        self.assertLess(similarity2, 0.9)
        
        # Test when one embedding is None
        mock_get_embedding.side_effect = lambda text: None if text == self.text3 else self.mock_embedding1
        similarity3 = self.analyzer._calculate_embedding_similarity(self.text1, self.text3)
        self.assertEqual(similarity3, 0)
        
        # Test when sentence_model is None
        self.analyzer.sentence_model = None
        similarity4 = self.analyzer._calculate_embedding_similarity(self.text1, self.text2)
        self.assertEqual(similarity4, 0)
        
        mock_get_embedding.side_effect = Exception("Error")
        similarity5 = self.analyzer._calculate_embedding_similarity(self.text1, self.text2)
        self.assertEqual(similarity5, 0)

    def test_extract_keywords(self):
        """Test keyword extraction functionality."""
        self.analyzer.count_vectorizer.fit([self.text1, self.text2, self.text3])
        
        keywords = self.analyzer.extract_keywords(self.text1)
        self.assertIsInstance(keywords, list)
        self.assertIn("computer", keywords)
        self.assertIn("science", keywords)
        self.assertIn("programming", keywords)
        
        self.assertEqual(self.analyzer.extract_keywords(""), [])
        self.assertEqual(self.analyzer.extract_keywords(None), [])

    def test_update_corpus(self):
        """Test corpus update functionality."""
        descriptions = [self.text1, self.text2, self.text3, self.text1]
        
        with patch.object(self.analyzer, 'preprocess_text') as mock_preprocess, \
             patch('builtins.open', MagicMock()), \
             patch('pickle.dump', MagicMock()):
            
            mock_preprocess.side_effect = lambda x: f"processed_{x[:10].lower()}" if x else ""
            
            self.analyzer.update_corpus(descriptions)
            self.assertIsInstance(self.analyzer.corpus, list)
            self.assertEqual(mock_preprocess.call_count, 3)
    
    def test_update_corpus_with_empty_list(self):
        """Test that update_corpus adds placeholder descriptions when list is empty."""
        original_corpus_length = len(self.analyzer.corpus)
        
        with patch('nltk.tokenize.word_tokenize', return_value=["mocked", "tokens"]), \
             patch('builtins.open', MagicMock()), \
             patch('pickle.dump', MagicMock()):
            
            self.analyzer.update_corpus([])
            self.assertGreaterEqual(len(self.analyzer.corpus), 3, 
                "Corpus should have at least 3 entries after update_corpus with empty list")

    def test_calculate_similarity(self):
        """Test the main similarity calculation function."""
        with patch.object(self.analyzer, 'preprocess_text') as mock_preprocess, \
             patch.object(self.analyzer, '_calculate_tfidf_similarity') as mock_tfidf, \
             patch.object(self.analyzer, '_calculate_keyword_overlap') as mock_keyword, \
             patch.object(self.analyzer, '_calculate_jaccard_similarity_single') as mock_jaccard, \
             patch('api.nlp_similarity.semantic_enhancer.calculate_semantic_boost') as mock_semantic, \
             patch.object(self.analyzer, '_calculate_embedding_similarity') as mock_embedding:
            
            mock_preprocess.side_effect = lambda x: f"processed_{x[:10].lower()}" if x else ""
            mock_embedding.return_value = 0.9
            mock_tfidf.return_value = 0.8
            mock_keyword.return_value = 0.7
            mock_jaccard.return_value = 0.6
            mock_semantic.return_value = 0.5
            
            self.analyzer.sentence_model = Mock()
            
            # Set vectorizer attributes to avoid fit calls
            self.analyzer.tfidf_vectorizer.vocabulary_ = {"dummy": 0}
            self.analyzer.count_vectorizer.vocabulary_ = {"dummy": 0}
            
            # Test similarity calculation
            similarity = self.analyzer.calculate_similarity(self.text1, [self.text2])
            self.assertGreater(similarity, 0)
            self.assertLessEqual(similarity, 5.0)
            
            # Test exact match
            similarity_exact = self.analyzer.calculate_similarity(self.text1, [self.text1])
            self.assertEqual(similarity_exact, 5.0)
            
            similarity_empty = self.analyzer.calculate_similarity("", [self.text2])
            self.assertEqual(similarity_empty, 0)
            
            similarity_empty_comp = self.analyzer.calculate_similarity(self.text1, [])
            self.assertEqual(similarity_empty_comp, 0)
            
            similarity_none = self.analyzer.calculate_similarity(None, [self.text2])
            self.assertEqual(similarity_none, 0)
            
            mock_tfidf.side_effect = Exception("TF-IDF error")
            with patch.object(self.analyzer, '_calculate_jaccard_similarity') as mock_jaccard_fallback:
                mock_jaccard_fallback.return_value = 2.5
                similarity_fallback = self.analyzer.calculate_similarity(self.text1, [self.text2])
                self.assertEqual(similarity_fallback, 2.5)
                mock_jaccard_fallback.assert_called_once()

    def test_transform_similarity_score(self):
        """Test the non-linear transformation of similarity scores."""
        high = self.analyzer._transform_similarity_score(0.95)
        self.assertEqual(high, 1.0)
        
        very_low = self.analyzer._transform_similarity_score(0.1)
        self.assertEqual(very_low, 0.1 * 1.5)
        
        medium = self.analyzer._transform_similarity_score(0.5)
        self.assertGreater(medium, 0.5)
        self.assertLess(medium, 1.0)
        
        for input_val in np.linspace(0, 1, 10):
            output = self.analyzer._transform_similarity_score(input_val)
            self.assertGreaterEqual(output, 0)
            self.assertLessEqual(output, 1.0)

    def test_calculate_jaccard_similarity(self):
        """Test the Jaccard similarity calculation."""
        similarity1 = self.analyzer._calculate_jaccard_similarity(
            "computer science programming",
            ["computer science coding", "programming contest"]
        )
        self.assertGreater(similarity1, 0)
        self.assertLessEqual(similarity1, 5.0)
        
        similarity2 = self.analyzer._calculate_jaccard_similarity("", [""])
        self.assertEqual(similarity2, 0)
        
        similarity3 = self.analyzer._calculate_jaccard_similarity("test", [])
        self.assertEqual(similarity3, 0)


class TestSingleton(unittest.TestCase):
    """Test the singleton instance."""
    
    def test_singleton_instance(self):
        """Test that text_similarity_analyzer is a singleton instance."""
        self.assertIsInstance(text_similarity_analyzer, TextSimilarityAnalyzer)
        self.assertIs(text_similarity_analyzer, tsa2)


if __name__ == '__main__':
    unittest.main()