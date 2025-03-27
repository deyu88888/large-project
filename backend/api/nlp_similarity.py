# backend/api/nlp_similarity.py

import numpy as np
import re
import os
import pickle
import functools

from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from django.conf import settings

import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import word_tokenize

from .semantic_enhancer import semantic_enhancer

try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False

try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('corpora/stopwords')
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')
    nltk.download('wordnet')


class TextSimilarityAnalyzer:
    """
    Advanced text similarity analyzer using NLP techniques.
    Implements multiple similarity metrics with domain-specific knowledge.
    Now includes neural sentence embeddings for improved semantic understanding.
    """

    def __init__(self):
        self.tfidf_vectorizer = None
        self.count_vectorizer = None
        self.sentence_model = None
        self.corpus = []
        self.corpus_tfidf_vectors = None
        self.corpus_count_vectors = None
        self.embedding_cache = {}  # Cache for sentence embeddings

        # Paths to saved vectorizers
        self.model_path = os.path.join(
            getattr(settings, 'BASE_DIR', ''), 'api', 'ml_models', 'tfidf_vectorizer.pkl'
        )
        self.count_model_path = os.path.join(
            getattr(settings, 'BASE_DIR', ''), 'api', 'ml_models', 'count_vectorizer.pkl'
        )
        self.embed_model_path = os.path.join(
            getattr(settings, 'BASE_DIR', ''), 'api', 'ml_models', 'sentence_embeddings.pkl'
        )

        self.lemmatizer = WordNetLemmatizer()
        self.stop_words = set(stopwords.words('english'))

        # Initialize or load vectorizers
        self._load_or_create_vectorizers()
        
        # Initialize sentence transformer model if available
        self._initialize_sentence_model()

        # Define similarity weights (updated to include embeddings)
        self.weights = {
            'embedding': 0.35,  # Neural sentence embedding weight
            'tfidf': 0.25,      # TF-IDF cosine similarity weight
            'keyword': 0.15,    # Keyword overlap weight
            'jaccard': 0.05,    # Jaccard similarity weight
            'semantic': 0.2     # Domain-specific semantic boost weight
        }
        
        # If sentence embeddings are not available, redistribute weights
        if not SENTENCE_TRANSFORMERS_AVAILABLE or self.sentence_model is None:
            self.weights = {
                'tfidf': 0.4,     # TF-IDF cosine similarity weight
                'keyword': 0.2,   # Keyword overlap weight
                'jaccard': 0.1,   # Jaccard similarity weight
                'semantic': 0.3   # Domain-specific semantic boost weight
            }

    def _initialize_sentence_model(self):
        """Initialize the sentence transformer model for embeddings."""
        if not SENTENCE_TRANSFORMERS_AVAILABLE:
            self.sentence_model = None
            return
            
        try:
            self.sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
        except Exception:
            self.sentence_model = None

    def _load_or_create_vectorizers(self):
        """Load existing vectorizers if available, or create new ones."""
        # Ensure directory exists
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)

        # --- TF-IDF Vectorizer ---
        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, 'rb') as f:
                    self.tfidf_vectorizer = pickle.load(f)
            except Exception:
                self._create_new_tfidf_vectorizer()
        else:
            self._create_new_tfidf_vectorizer()

        # --- Count Vectorizer ---
        if os.path.exists(self.count_model_path):
            try:
                with open(self.count_model_path, 'rb') as f:
                    self.count_vectorizer = pickle.load(f)
            except Exception:
                self._create_new_count_vectorizer()
        else:
            self._create_new_count_vectorizer()

    def _create_new_tfidf_vectorizer(self):
        """Create a new TF-IDF vectorizer."""
        self.tfidf_vectorizer = TfidfVectorizer(
            min_df=1,
            max_df=0.95,
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 3)
        )

    def _create_new_count_vectorizer(self):
        """
        Create a new Count vectorizer for keyword extraction.
        Using min_df=0.0 and max_df=1.0 to avoid pruning in highly similar docs.
        """
        self.count_vectorizer = CountVectorizer(
            min_df=0.0,  
            max_df=1.0,
            max_features=500,
            stop_words='english'
        )

    def preprocess_text(self, text):
        """
        Clean and normalize text for better comparison.
        Uses lemmatization and removes stopwords for improved semantic matching.
        """
        if not text:
            return ""

        # Convert to lowercase
        text = text.lower()

        # Remove punctuation
        text = re.sub(r'[^\w\s]', ' ', text)

        # Tokenize
        tokens = word_tokenize(text)

        # Remove stopwords and lemmatize
        lemmatized_tokens = [
            self.lemmatizer.lemmatize(token)
            for token in tokens
            if token not in self.stop_words and len(token) > 2
        ]

        # Rejoin tokens
        processed_text = ' '.join(lemmatized_tokens)

        # Remove extra whitespace
        processed_text = re.sub(r'\s+', ' ', processed_text).strip()

        return processed_text

    @functools.lru_cache(maxsize=128)
    def get_embedding(self, text):
        """
        Get embedding for a text using sentence transformers.
        Uses a cache to avoid recomputing embeddings for the same text.
        """
        if not text or self.sentence_model is None:
            return None
            
        try:
            # Get embedding from model
            embedding = self.sentence_model.encode(text, convert_to_numpy=True)
            return embedding
        except Exception:
            return None

    def _calculate_embedding_similarity(self, text1, text2):
        """Calculate cosine similarity using neural sentence embeddings."""
        if self.sentence_model is None:
            return 0
            
        try:
            # For neural embeddings, we use the original text (not preprocessed)
            # as the models are trained on natural language
            embedding1 = self.get_embedding(text1)
            embedding2 = self.get_embedding(text2)
            
            if embedding1 is None or embedding2 is None:
                return 0
                
            # Calculate cosine similarity
            similarity = cosine_similarity(
                embedding1.reshape(1, -1), 
                embedding2.reshape(1, -1)
            )[0][0]
            
            return similarity
        except Exception:
            return 0

    def extract_keywords(self, text, top_n=10):
        """Extract the most important keywords from text."""
        if not text or not hasattr(self.count_vectorizer, 'vocabulary_'):
            return []

        # Transform the text
        vector = self.count_vectorizer.transform([text])
        feature_names = self.count_vectorizer.get_feature_names_out()

        # Get keyword frequencies
        frequencies = zip(feature_names, vector.toarray()[0])

        # Sort by frequency and take top N
        keywords = [
            word for word, freq in
            sorted(frequencies, key=lambda x: x[1], reverse=True)[:top_n]
            if freq > 0
        ]
        return keywords

    def update_corpus(self, society_descriptions):
        """
        Update the corpus with society descriptions and train the vectorizers.
        Removes duplicate descriptions and ensures enough variety for training.
        """
        # Remove duplicates
        unique_descriptions = list(set(society_descriptions))

        # Preprocess descriptions
        self.corpus = [
            self.preprocess_text(desc) for desc in unique_descriptions if desc
        ]

        # If corpus is empty or too small, add sample descriptions
        if len(self.corpus) < 3:
            self.corpus.extend([
                "This is a placeholder description about a student society.",
                "Our society organizes various activities, discussions, and events for students.",
                "A group of passionate individuals coming together to share knowledge and experiences."
            ])

        # Fit vectorizers
        try:
            self.tfidf_vectorizer.fit(self.corpus)
            self.count_vectorizer.fit(self.corpus)
        except ValueError:
            return

        # Transform the corpus
        self.corpus_tfidf_vectors = self.tfidf_vectorizer.transform(self.corpus)
        self.corpus_count_vectors = self.count_vectorizer.transform(self.corpus)

        # Save vectorizers
        try:
            with open(self.model_path, 'wb') as f:
                pickle.dump(self.tfidf_vectorizer, f)

            with open(self.count_model_path, 'wb') as f:
                pickle.dump(self.count_vectorizer, f)
        except Exception:
            pass
            
        # Pre-compute and cache embeddings for the original descriptions
        if self.sentence_model is not None:
            for desc in unique_descriptions:
                if desc:
                    self.get_embedding(desc)

    def calculate_similarity(self, text, comparison_texts):
        """
        Calculate similarity between a text and a list of comparison texts.
        Uses a weighted combination of multiple similarity metrics with domain knowledge.
        Now includes neural sentence embeddings for improved semantic understanding.
        Returns a similarity score from 0 to 5.
        """
        if not text or not comparison_texts or not any(comparison_texts):
            return 0

        # Check for exact matches
        for comp_text in comparison_texts:
            if text == comp_text:
                return 5.0  # Perfect similarity

        # Save originals for semantic enhancement and embeddings
        original_text = text
        original_comparison_texts = comparison_texts.copy()

        # Preprocess
        text = self.preprocess_text(text)
        comparison_texts = [self.preprocess_text(t) for t in comparison_texts if t]

        # Check if there's anything left after preprocessing
        if not text or not comparison_texts:
            return 0

        # If vectorizers aren't fit, attempt to fit them with these texts
        if (not hasattr(self.tfidf_vectorizer, 'vocabulary_') or
            not hasattr(self.count_vectorizer, 'vocabulary_')):
            all_texts = [text] + comparison_texts
            self.tfidf_vectorizer.fit(all_texts)
            self.count_vectorizer.fit(all_texts)

        try:
            # Calculate multiple similarity metrics
            similarities = []
            for comp_text, orig_comp_text in zip(comparison_texts, original_comparison_texts):
                similarity_components = {}
                
                # 1) Neural Sentence Embedding Similarity (if available)
                if self.sentence_model is not None:
                    embedding_similarity = self._calculate_embedding_similarity(
                        original_text, orig_comp_text
                    )
                    similarity_components['embedding'] = embedding_similarity
                
                # 2) TF-IDF Cosine Similarity
                tfidf_similarity = self._calculate_tfidf_similarity(text, comp_text)
                similarity_components['tfidf'] = tfidf_similarity

                # 3) Keyword Overlap
                keyword_similarity = self._calculate_keyword_overlap(text, comp_text)
                similarity_components['keyword'] = keyword_similarity

                # 4) Jaccard Similarity
                jaccard_similarity = self._calculate_jaccard_similarity_single(text, comp_text)
                similarity_components['jaccard'] = jaccard_similarity

                # 5) Semantic Boost
                semantic_boost = semantic_enhancer.calculate_semantic_boost(
                    original_text, orig_comp_text
                )
                similarity_components['semantic'] = semantic_boost

                # Combine with weights
                weighted_similarity = sum(
                    self.weights[key] * similarity_components.get(key, 0)
                    for key in self.weights
                )
                
                similarities.append(weighted_similarity)

            # Max similarity
            max_similarity = max(similarities) if similarities else 0

            # Non-linear transform
            transformed_similarity = self._transform_similarity_score(max_similarity)

            # Scale to 0-5
            result = round(transformed_similarity * 5, 2)

            return result

        except Exception:
            # Fallback to Jaccard
            return self._calculate_jaccard_similarity(text, comparison_texts)

    def _calculate_tfidf_similarity(self, text1, text2):
        """Calculate cosine similarity using TF-IDF vectors."""
        try:
            vector1 = self.tfidf_vectorizer.transform([text1])
            vector2 = self.tfidf_vectorizer.transform([text2])
            similarity = cosine_similarity(vector1, vector2)[0][0]
            return similarity
        except Exception:
            return 0

    def _calculate_keyword_overlap(self, text1, text2):
        """Calculate similarity based on important keyword overlap."""
        try:
            keywords1 = set(self.extract_keywords(text1, top_n=15))
            keywords2 = set(self.extract_keywords(text2, top_n=15))

            if not keywords1 and not keywords2:
                return 0

            intersection = len(keywords1.intersection(keywords2))
            union = len(keywords1.union(keywords2))
            similarity = intersection / union if union else 0

            return similarity

        except Exception:
            return 0

    def _calculate_jaccard_similarity_single(self, text1, text2):
        """Calculate Jaccard similarity between two texts."""
        words1 = set(text1.split())
        words2 = set(text2.split())
        if not words1 and not words2:
            return 0

        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        return intersection / union if union else 0

    def _transform_similarity_score(self, similarity):
        """
        Apply a non-linear transformation to boost medium similarities.
        Uses an improved sigmoid function for better distribution of scores.
        """
        # High similarity
        if similarity >= 0.9:
            return 1.0

        # Very low similarity
        if similarity <= 0.2:
            return similarity * 1.5

        # Medium range - improved sigmoid function for smoother transition
        transformed = 0.2 + (0.8 * (1 / (1 + np.exp(-12 * (similarity - 0.5)))))
        return min(transformed, 1.0)

    def _calculate_jaccard_similarity(self, text, comparison_texts):
        """
        Calculate Jaccard similarity as a fallback. 
        Returns the max Jaccard similarity with any comparison text.
        """
        words_main = set(text.split())
        max_similarity = 0

        for comp_text in comparison_texts:
            words_comp = set(comp_text.split())
            if not words_main and not words_comp:
                similarity = 0
            else:
                intersection = len(words_main.intersection(words_comp))
                union = len(words_main.union(words_comp))
                similarity = intersection / union if union else 0
            max_similarity = max(max_similarity, similarity)

        # Non-linear transform
        max_similarity = self._transform_similarity_score(max_similarity)

        # Scale to 0-5
        result = round(max_similarity * 5, 2)
        return result


# Create a singleton instance for reuse
text_similarity_analyzer = TextSimilarityAnalyzer()