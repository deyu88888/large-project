# backend/api/nlp_similarity.py

import numpy as np
import re
import os
import pickle

from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from django.conf import settings

import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import word_tokenize

from .semantic_enhancer import semantic_enhancer

# Ensure NLTK resources are downloaded
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
    """

    def __init__(self):
        self.tfidf_vectorizer = None
        self.count_vectorizer = None
        self.corpus = []
        self.corpus_tfidf_vectors = None
        self.corpus_count_vectors = None

        # Paths to saved vectorizers
        self.model_path = os.path.join(
            getattr(settings, 'BASE_DIR', ''), 'api', 'ml_models', 'tfidf_vectorizer.pkl'
        )
        self.count_model_path = os.path.join(
            getattr(settings, 'BASE_DIR', ''), 'api', 'ml_models', 'count_vectorizer.pkl'
        )

        self.lemmatizer = WordNetLemmatizer()
        self.stop_words = set(stopwords.words('english'))

        # Initialize or load vectorizers
        self._load_or_create_vectorizers()

        # Define similarity weights
        self.weights = {
            'tfidf': 0.4,    # TF-IDF cosine similarity weight
            'keyword': 0.2,  # Keyword overlap weight
            'jaccard': 0.1,  # Jaccard similarity weight
            'semantic': 0.3  # Domain-specific semantic boost weight
        }

    def _load_or_create_vectorizers(self):
        """Load existing vectorizers if available, or create new ones."""
        # Ensure directory exists
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)

        # --- TF-IDF Vectorizer ---
        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, 'rb') as f:
                    self.tfidf_vectorizer = pickle.load(f)
                print("Loaded existing TF-IDF vectorizer")
            except Exception as e:
                print(f"Error loading TF-IDF vectorizer: {e}")
                self._create_new_tfidf_vectorizer()
        else:
            self._create_new_tfidf_vectorizer()

        # --- Count Vectorizer ---
        if os.path.exists(self.count_model_path):
            try:
                with open(self.count_model_path, 'rb') as f:
                    self.count_vectorizer = pickle.load(f)
                print("Loaded existing Count vectorizer")
            except Exception as e:
                print(f"Error loading Count vectorizer: {e}")
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
        print("Created new TF-IDF vectorizer")

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
        print("Created new Count vectorizer with min_df=0.0 and max_df=1.0")

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

        # Debug print
        if len(processed_text) > 100:
            print(f"Preprocessed text sample: {processed_text[:100]}...")
        else:
            print(f"Preprocessed text: {processed_text}")

        return processed_text

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

        print(f"Corpus length after removing duplicates: {len(self.corpus)}")

        if self.corpus:
            print("First 3 corpus documents:")
            for doc in self.corpus[:3]:
                snippet = doc[:200] + ("..." if len(doc) > 200 else "")
                print(f" - {snippet}")

        # If corpus is empty or too small, add sample descriptions
        if len(self.corpus) < 3:
            print("Corpus too small, adding sample descriptions for training...")
            self.corpus.extend([
                "This is a placeholder description about a student society.",
                "Our society organizes various activities, discussions, and events for students.",
                "A group of passionate individuals coming together to share knowledge and experiences."
            ])
            print(f"New corpus size after adding samples: {len(self.corpus)}")

        # Fit vectorizers
        try:
            self.tfidf_vectorizer.fit(self.corpus)
            self.count_vectorizer.fit(self.corpus)
        except ValueError as e:
            print(f"Error fitting vectorizers: {e}")
            print("Try adjusting min_df/max_df or ensuring your corpus has variety.")
            return

        # Transform the corpus
        self.corpus_tfidf_vectors = self.tfidf_vectorizer.transform(self.corpus)
        self.corpus_count_vectors = self.count_vectorizer.transform(self.corpus)

        # Save vectorizers
        try:
            with open(self.model_path, 'wb') as f:
                pickle.dump(self.tfidf_vectorizer, f)
            print(f"TF-IDF vectorizer saved to {self.model_path}")

            with open(self.count_model_path, 'wb') as f:
                pickle.dump(self.count_vectorizer, f)
            print(f"Count vectorizer saved to {self.count_model_path}")
        except Exception as e:
            print(f"Error saving vectorizers: {e}")

    def calculate_similarity(self, text, comparison_texts):
        """
        Calculate similarity between a text and a list of comparison texts.
        Uses a weighted combination of multiple similarity metrics with domain knowledge.
        Returns a similarity score from 0 to 5.
        """
        if not text or not comparison_texts or not any(comparison_texts):
            return 0

        # Check for exact matches
        for comp_text in comparison_texts:
            if text == comp_text:
                return 5.0  # Perfect similarity

        # Save originals for semantic enhancement
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
            print("Vectorizers not fit yet, fitting with current texts...")
            all_texts = [text] + comparison_texts
            self.tfidf_vectorizer.fit(all_texts)
            self.count_vectorizer.fit(all_texts)

        try:
            # Calculate multiple similarity metrics
            similarities = []
            for comp_text, orig_comp_text in zip(comparison_texts, original_comparison_texts):
                # 1) TF-IDF Cosine Similarity
                tfidf_similarity = self._calculate_tfidf_similarity(text, comp_text)

                # 2) Keyword Overlap
                keyword_similarity = self._calculate_keyword_overlap(text, comp_text)

                # 3) Jaccard Similarity
                jaccard_similarity = self._calculate_jaccard_similarity_single(text, comp_text)

                # 4) Semantic Boost
                semantic_boost = semantic_enhancer.calculate_semantic_boost(
                    original_text, orig_comp_text
                )

                # Combine with weights
                weighted_similarity = (
                    self.weights['tfidf'] * tfidf_similarity +
                    self.weights['keyword'] * keyword_similarity +
                    self.weights['jaccard'] * jaccard_similarity +
                    self.weights['semantic'] * semantic_boost
                )

                print(
                    f"TF-IDF: {tfidf_similarity:.4f}, Keyword: {keyword_similarity:.4f}, "
                    f"Jaccard: {jaccard_similarity:.4f}, Semantic: {semantic_boost:.4f}"
                )
                print(
                    f"Weighted similarity: {weighted_similarity:.4f} "
                    f"between '{text[:30]}...' and '{comp_text[:30]}...'"
                )
                similarities.append(weighted_similarity)

            # Max similarity
            max_similarity = max(similarities) if similarities else 0

            # Non-linear transform
            transformed_similarity = self._transform_similarity_score(max_similarity)

            # Scale to 0-5
            result = round(transformed_similarity * 5, 2)
            print(f"Final similarity score: {result}/5.00")

            return result

        except Exception as e:
            print(f"Error calculating similarity: {e}")
            # Fallback to Jaccard
            return self._calculate_jaccard_similarity(text, comparison_texts)

    def _calculate_tfidf_similarity(self, text1, text2):
        """Calculate cosine similarity using TF-IDF vectors."""
        try:
            vector1 = self.tfidf_vectorizer.transform([text1])
            vector2 = self.tfidf_vectorizer.transform([text2])
            similarity = cosine_similarity(vector1, vector2)[0][0]
            return similarity
        except Exception as e:
            print(f"Error in TF-IDF similarity: {e}")
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

            print(f"Keyword overlap: {intersection}/{union} = {similarity:.4f}")
            return similarity

        except Exception as e:
            print(f"Error in keyword overlap: {e}")
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
        """
        # High similarity
        if similarity >= 0.9:
            return 1.0

        # Very low similarity
        if similarity <= 0.2:
            return similarity * 1.5

        # Medium range
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
                print(
                    f"Jaccard similarity: {similarity} "
                    f"(Intersection: {intersection}, Union: {union})"
                )
            max_similarity = max(max_similarity, similarity)

        # Non-linear transform
        max_similarity = self._transform_similarity_score(max_similarity)

        # Scale to 0-5
        result = round(max_similarity * 5, 2)
        print(f"Jaccard result: {result}")
        return result


# Create a singleton instance for reuse
text_similarity_analyzer = TextSimilarityAnalyzer()