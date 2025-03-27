# backend/api/semantic_enhancer.py
import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class SemanticDomainEnhancer:
    """
    Enhances text similarity with domain-specific knowledge about student societies.
    Understands relationships between different types of societies and activities.
    """
    
    def __init__(self):
        # Define domain categories with related terms
        self.domain_categories = {
            "academic": [
                "study", "academic", "education", "learning", "research", "knowledge", 
                "university", "college", "school", "lecture", "seminar", "course",
                "professor", "teacher", "student", "class", "subject", "discipline"
            ],
            "arts": [
                "art", "creative", "painting", "drawing", "sculpture", "craft", "design",
                "artist", "exhibition", "gallery", "studio", "visual", "aesthetic",
                "creation", "creativity", "artistic", "expression"
            ],
            "music": [
                "music", "instrument", "play", "band", "orchestra", "concert", "performance",
                "song", "melody", "rhythm", "harmony", "musician", "singer", "composer", 
                "classical", "jazz", "rock", "pop", "guitar", "piano", "violin", "drum"
            ],
            "performance": [
                "performance", "theater", "theatre", "drama", "acting", "actor", "stage",
                "play", "show", "production", "rehearsal", "script", "costume", "audience",
                "director", "scene", "character", "role", "perform", "cast"
            ],
            "debate": [
                "debate", "speech", "public speaking", "argument", "discussion", "rhetoric",
                "persuasion", "critical thinking", "logic", "reasoning", "perspective", 
                "viewpoint", "opinion", "position", "competitive", "tournament", "judge"
            ],
            "tech": [
                "technology", "programming", "coding", "software", "computer", "digital",
                "developer", "engineer", "web", "app", "application", "data", "algorithm",
                "system", "hardware", "internet", "online", "cyber", "tech", "hackathon"
            ],
            "outdoors": [
                "outdoors", "nature", "hiking", "climbing", "trail", "adventure", "exploration",
                "mountain", "forest", "river", "lake", "camping", "backpacking", "wilderness",
                "expedition", "terrain", "landscape", "wildlife", "environment"
            ],
            "sports": [
                "sport", "game", "athlete", "team", "competition", "tournament", "match",
                "player", "coach", "training", "practice", "fitness", "exercise", "physical",
                "championship", "league", "score", "win", "play", "ball", "field", "court"
            ],
            "gaming": [
                "game", "gaming", "video game", "board game", "card game", "tabletop", "roleplay",
                "player", "strategy", "console", "pc", "virtual", "digital", "competitive", 
                "cooperative", "multiplayer", "esports", "tournament"
            ],
            "social": [
                "social", "community", "club", "society", "group", "member", "friendship",
                "network", "connection", "relationship", "gathering", "meeting", "event",
                "party", "celebration", "interact", "communicate", "share", "participate"
            ],
            "culture": [
                "culture", "tradition", "heritage", "history", "language", "international",
                "global", "foreign", "ethnic", "diversity", "identity", "background", "origin",
                "custom", "practice", "celebration", "festival", "cuisine", "food", "dance"
            ],
            "activism": [
                "activism", "advocacy", "campaign", "cause", "change", "reform", "rights",
                "justice", "equality", "protest", "demonstration", "awareness", "volunteer",
                "service", "community", "social", "political", "policy", "impact", "movement"
            ],
            "environment": [
                "environment", "sustainability", "eco", "green", "conservation", "preservation",
                "climate", "pollution", "waste", "recycling", "renewable", "organic", "natural",
                "planet", "earth", "biodiversity", "ecosystem", "resource", "energy", "nature"
            ],
            "science": [
                "science", "scientific", "experiment", "laboratory", "research", "discovery",
                "investigation", "theory", "hypothesis", "evidence", "observation", "analysis",
                "biology", "chemistry", "physics", "astronomy", "mathematics", "engineering"
            ],
            "business": [
                "business", "entrepreneurship", "startup", "company", "corporate", "finance",
                "marketing", "management", "investment", "economics", "commerce", "trade",
                "industry", "market", "enterprise", "strategy", "innovation", "leadership"
            ],
            "media": [
                "media", "journalism", "news", "reporting", "publication", "broadcast", 
                "film", "movie", "documentary", "photography", "radio", "television", "tv",
                "podcast", "print", "digital", "content", "production", "storytelling"
            ]
        }
        
        # Define related activity types
        self.related_activities = {
            "competition": ["tournament", "contest", "championship", "match", "game", "challenge"],
            "learning": ["workshop", "class", "lecture", "seminar", "tutorial", "training", "lesson"],
            "creation": ["make", "build", "design", "create", "develop", "produce", "craft"],
            "performance": ["show", "concert", "recital", "play", "exhibition", "showcase", "display"],
            "discussion": ["talk", "debate", "conversation", "forum", "panel", "discourse", "dialogue"],
            "collaboration": ["team", "group", "partner", "together", "collective", "joint", "cooperative"]
        }
        
        # Create a mapping from terms to their categories
        self.term_to_category = {}
        for category, terms in self.domain_categories.items():
            for term in terms:
                self.term_to_category[term] = category
                
        # Create a mapping from activity terms to their type
        self.term_to_activity = {}
        for activity_type, terms in self.related_activities.items():
            for term in terms:
                self.term_to_activity[term] = activity_type
                
        # Define category relationships (how related different categories are)
        # Higher value means more related
        self.category_relationships = {
            ("academic", "science"): 0.8,
            ("academic", "debate"): 0.6,
            ("academic", "tech"): 0.5,
            ("academic", "business"): 0.5,
            ("arts", "music"): 0.7,
            ("arts", "performance"): 0.7,
            ("arts", "media"): 0.6,
            ("music", "performance"): 0.6,
            ("debate", "activism"): 0.5,
            ("tech", "gaming"): 0.5,
            ("tech", "science"): 0.5,
            ("tech", "media"): 0.4,
            ("outdoors", "sports"): 0.6,
            ("outdoors", "environment"): 0.7,
            ("sports", "gaming"): 0.3,
            ("culture", "social"): 0.6,
            ("culture", "arts"): 0.5,
            ("culture", "music"): 0.5,
            ("activism", "environment"): 0.6,
            ("activism", "social"): 0.5,
            ("environment", "science"): 0.5,
            ("business", "media"): 0.4,
            ("social", "sports"): 0.4,
        }
    
    def get_related_score(self, category1, category2):
        """Get relationship score between two categories."""
        if category1 == category2:
            return 1.0
            
        key = (category1, category2)
        reverse_key = (category2, category1)
        
        if key in self.category_relationships:
            return self.category_relationships[key]
        elif reverse_key in self.category_relationships:
            return self.category_relationships[reverse_key]
        else:
            return 0.2  # Default low relationship for unspecified pairs
    
    def extract_categories(self, text):
        """Extract domain categories from text."""
        if not text:
            return []
            
        text = text.lower()
        words = re.findall(r'\b\w+\b', text)
        
        # Get categories for individual words
        categories = []
        for word in words:
            if word in self.term_to_category:
                categories.append(self.term_to_category[word])
                
        # Look for multi-word terms
        for term in self.term_to_category:
            if ' ' in term and term in text:
                categories.append(self.term_to_category[term])
                
        # Return unique categories
        return list(set(categories))
    
    def extract_activities(self, text):
        """Extract activity types from text."""
        if not text:
            return []
            
        text = text.lower()
        words = re.findall(r'\b\w+\b', text)
        
        # Get activity types for individual words
        activities = []
        for word in words:
            if word in self.term_to_activity:
                activities.append(self.term_to_activity[word])
                
        # Look for multi-word terms
        for term in self.term_to_activity:
            if ' ' in term and term in text:
                activities.append(self.term_to_activity[term])
                
        # Return unique activity types
        return list(set(activities))
    
    def calculate_semantic_boost(self, text1, text2):
        """
        Calculate a semantic similarity boost based on domain knowledge.
        Returns a value between 0 and 1 to enhance base similarity.
        """
        # Extract categories
        categories1 = self.extract_categories(text1)
        categories2 = self.extract_categories(text2)
        
        # Extract activities
        activities1 = self.extract_activities(text1)
        activities2 = self.extract_activities(text2)
        
        # If no categories or activities found, return 0
        if not categories1 or not categories2:
            return 0
            
        # Calculate category relationship score
        category_scores = []
        for cat1 in categories1:
            for cat2 in categories2:
                category_scores.append(self.get_related_score(cat1, cat2))
                
        # Take the average of the top 3 relationships or all if fewer than 3
        if category_scores:
            category_scores.sort(reverse=True)
            top_category_score = sum(category_scores[:min(3, len(category_scores))]) / min(3, len(category_scores))
        else:
            top_category_score = 0
            
        # Calculate activity similarity
        activity_similarity = 0
        if activities1 and activities2:
            common_activities = set(activities1).intersection(set(activities2))
            all_activities = set(activities1).union(set(activities2))
            
            if all_activities:
                activity_similarity = len(common_activities) / len(all_activities)
        
        # Combine scores with weights (categories matter more)
        boost = (0.7 * top_category_score) + (0.3 * activity_similarity)
        
        
        return boost

# Create a singleton instance for reuse
semantic_enhancer = SemanticDomainEnhancer()