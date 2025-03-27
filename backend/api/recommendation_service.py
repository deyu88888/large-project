# backend/api/recommendation_service.py
from django.db.models import Count, Sum, Q, Case, When, Value, IntegerField, F
from collections import Counter, defaultdict
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
import numpy as np
import datetime

from .models import Society, Student
from .nlp_similarity import text_similarity_analyzer
from .semantic_enhancer import semantic_enhancer

class SocietyRecommender:
    """
    Advanced service for recommending societies to students based on their interests,
    using state-of-the-art NLP and multi-dimensional interest profiling.
    Now enhanced with diversity-aware recommendations and temporal relevance.
    """
    
    def __init__(self):
        # MMR parameters
        self.mmr_lambda = 0.7  # Balance between relevance and diversity (higher means more relevance)
        self.max_category_boost = 1.5  # Maximum category boost multiplier
        
        # Temporal decay parameters
        self.activity_half_life = 90  # Days after which activity weight is halved
        
        # Cached society similarity matrix
        self.society_similarities = {}
    
    def get_popular_societies(self, limit=5, with_recent_boost=True):
        """
        Get the most popular societies based on membership count, event count, and 
        event attendance. Now includes a recency boost factor for recent activities.
        """
        base_query = Society.objects.filter(status="Approved")
        
        # Base popularity metrics
        societies = base_query.annotate(
            total_members=Count("society_members"),
            total_events=Count("events"),
            total_event_attendance=Sum("events__current_attendees")
        )
        
        if with_recent_boost:
            # Calculate recent activity (events in the last 30 days)
            thirty_days_ago = timezone.now() - datetime.timedelta(days=30)
            societies = societies.annotate(
                recent_events=Count(
                    'events', 
                    filter=Q(events__date__gte=thirty_days_ago)
                ),
                recent_members=Count(
                    'society_members',
                    filter=Q(society_members__date_joined__gte=thirty_days_ago)
                )
            )
            
            # Calculate popularity score with recent activity boost
            popular_societies = societies.annotate(
                popularity_score=(
                    (2 * F('total_members')) +
                    (3 * F('total_events')) +
                    (4 * F('total_event_attendance')) +
                    (5 * F('recent_events')) +  # Higher weight for recent events
                    (3 * F('recent_members'))   # Boost for recent members
                )
            )
        else:
            # Original popularity calculation
            popular_societies = societies.annotate(
                popularity_score=(
                    (2 * F('total_members')) +
                    (3 * F('total_events')) +
                    (4 * F('total_event_attendance'))
                )
            )
        
        return popular_societies.order_by("-popularity_score")[:limit]
    
    def get_recommendations_for_student(self, student_id, limit=5, diversity_level='balanced'):
        """
        Get society recommendations for a specific student using a multi-dimensional approach.
        Balances recommendations across different interest categories.
        
        Arguments:
            student_id: ID of the student
            limit: Maximum number of recommendations to return
            diversity_level: 'low', 'balanced', or 'high' to control recommendation diversity
        """
        try:
            student = Student.objects.get(id=student_id)
            
            # Set diversity parameters based on requested level
            if diversity_level == 'low':
                self.mmr_lambda = 0.9  # More relevance, less diversity
            elif diversity_level == 'high':
                self.mmr_lambda = 0.5  # More diversity, less relevance
            else:  # 'balanced'
                self.mmr_lambda = 0.7  # Default balance
            
            # If student hasn't joined any societies, return popular ones
            if not student.societies.exists():
                return self.get_popular_societies(limit)
            
            # Get societies the student has already joined
            joined_societies = student.societies.all()
            
            # Extract categories the student is interested in
            joined_categories = set(joined_societies.values_list('category', flat=True))
            
            # Get all approved societies the student has not joined yet
            available_societies = Society.objects.filter(
                status="Approved"
            ).exclude(
                id__in=joined_societies.values_list('id', flat=True)
            )
            
            # If no available societies, return empty list
            if not available_societies.exists():
                return []
            
            # Calculate similarity scores for each available society
            society_scores = []
            
            for society in available_societies:
                # Calculate similarity score based on multiple factors
                score = self._calculate_similarity_score(society, joined_societies, student)
                society_scores.append({
                    'society': society,
                    'score': score,
                    'category': society.category
                })
            
            # First approach: Category-aware MMR for balanced recommendations
            selected_societies = self._mmr_selection(society_scores, joined_societies, limit)
            
            # Generate explanations for the selected recommendations
            for item in selected_societies:
                explanation = self._get_recommendation_explanation_details(
                    item['society'], joined_societies
                )
                item['explanation'] = explanation
                setattr(item['society'], '_recommendation_explanation', explanation)
            
            return [item['society'] for item in selected_societies]
            
        except Student.DoesNotExist:
            # If student doesn't exist, return popular societies
            return self.get_popular_societies(limit)
    
    def _mmr_selection(self, society_scores, joined_societies, limit):
        """
        Selects recommendations using Maximal Marginal Relevance algorithm,
        which balances relevance with diversity.
        """
        if not society_scores:
            return []
            
        # Sort by initial score
        society_scores = sorted(society_scores, key=lambda x: x['score'], reverse=True)
        
        # Extract categories the student is interested in
        joined_categories = set(s.category for s in joined_societies)
        
        # Dynamic category weights: less represented categories get higher weights
        category_counts = Counter(s.category for s in joined_societies)
        total_societies = len(joined_societies)
        
        # Normalize category weights (inverse of frequency)
        category_weights = {}
        for category in joined_categories:
            count = category_counts.get(category, 0)
            if count > 0:
                # Less common categories get higher weight (up to max_category_boost)
                weight = 1 + (self.max_category_boost - 1) * (1 - (count / total_societies))
                category_weights[category] = weight
            else:
                category_weights[category] = 1.0
                
        
        # Initialize MMR
        selected = []
        remaining = society_scores.copy()
        
        # Helper function to compute similarity between two societies
        def compute_society_similarity(society1, society2):
            # Use cached similarity if available
            pair_key = tuple(sorted([society1.id, society2.id]))
            if pair_key in self.society_similarities:
                return self.society_similarities[pair_key]
                
            # Calculate description similarity if both have descriptions
            if (hasattr(society1, 'description') and society1.description and 
                hasattr(society2, 'description') and society2.description):
                
                similarity = text_similarity_analyzer.calculate_similarity(
                    society1.description, [society2.description]
                ) / 5.0  # Normalize to 0-1
            else:
                # Fallback to tag and category similarity
                s1_tags = set(society1.tags or [])
                s2_tags = set(society2.tags or [])
                tag_sim = len(s1_tags.intersection(s2_tags)) / max(1, len(s1_tags.union(s2_tags)))
                cat_sim = 1.0 if society1.category == society2.category else 0.0
                similarity = 0.6 * cat_sim + 0.4 * tag_sim
                
            # Cache for future use
            self.society_similarities[pair_key] = similarity
            return similarity
        
        # MMR algorithm
        while len(selected) < limit and remaining:
            # Find society with highest MMR score
            max_mmr = -1
            max_idx = -1
            
            for i, item in enumerate(remaining):
                society = item['society']
                score = item['score']
                
                # Apply category weight if it's a category the student is interested in
                if society.category in category_weights:
                    score *= category_weights[society.category]
                
                # Relevance component
                relevance = score
                
                if not selected:
                    # First selection is based only on relevance
                    mmr_score = relevance
                else:
                    # Calculate diversity penalty
                    max_similarity = max(
                        compute_society_similarity(society, sel['society'])
                        for sel in selected
                    )
                    
                    # MMR formula: λ * relevance - (1-λ) * max_similarity_to_selected
                    mmr_score = (self.mmr_lambda * relevance) - ((1 - self.mmr_lambda) * max_similarity)
                
                if mmr_score > max_mmr:
                    max_mmr = mmr_score
                    max_idx = i
            
            if max_idx >= 0:
                selected.append(remaining.pop(max_idx))
            else:
                # Fallback (shouldn't happen)
                break
        
        return selected
    
    def _calculate_similarity_score(self, society, joined_societies, student=None):
        """
        Calculate similarity score between a society and the societies a student has joined.
        Now includes temporal weighting and event attendance.
        Higher score means more similar/relevant.
        """
        total_score = 0
        
        # Extract features from joined societies
        joined_categories = [s.category for s in joined_societies]
        joined_tags = []
        for s in joined_societies:
            if s.tags:
                joined_tags.extend(s.tags)
        
        # 1. Category similarity (exact match)
        if society.category in joined_categories:
            total_score += 3
        
        # 2. Tag similarity (count matching tags)
        society_tags = society.tags or []
        matching_tags = sum(1 for tag in society_tags if tag in joined_tags)
        total_score += matching_tags * 2
        
        # 3. Text similarity in society description - using advanced NLP
        if hasattr(society, 'description') and society.description:
            joined_descriptions = [s.description for s in joined_societies if hasattr(s, 'description') and s.description]
            
            if joined_descriptions:
                # Get advanced NLP similarity score (0-5 scale)
                desc_similarity = text_similarity_analyzer.calculate_similarity(
                    society.description, 
                    joined_descriptions
                )
                
                # Add to total score with a higher weight for NLP-based similarity
                total_score += desc_similarity * 1.5
                
                # Check for semantic categories even when descriptions are identical
                if all(d == joined_descriptions[0] for d in joined_descriptions):
                    # If all descriptions are identical, rely more on semantic categories
                    for joined_society in joined_societies:
                        semantic_boost = semantic_enhancer.calculate_semantic_boost(
                            society.name + " " + (society.category or ""),
                            joined_society.name + " " + (joined_society.category or "")
                        )
                        # Add semantic boost to compensate for identical descriptions
                        total_score += semantic_boost * 3
        
        # 4. Event attendance pattern matching (if student is provided)
        if student and hasattr(student, 'attended_events') and student.attended_events.exists():
            # Get categories of events the student has attended
            attended_event_categories = set()
            for event in student.attended_events.all():
                if event.hosted_by and event.hosted_by.category:
                    attended_event_categories.add(event.hosted_by.category)
                    
            # Boost score if society's category matches event attendance patterns
            if society.category in attended_event_categories:
                total_score += 2
                
        # 5. Activity recency weighting
        recent_activities = 0
        society_age_boost = 1.0
        
        # Check for recent events
        thirty_days_ago = timezone.now() - datetime.timedelta(days=30)
        recent_events = society.events.filter(date__gte=thirty_days_ago).count()
        recent_activities += recent_events
            
        # Apply a recency boost (newer societies with activity get a boost)
        if recent_activities > 0:
            society_age_boost = 1.2  # 20% boost for active societies
        
        # Apply recency boost to total score
        total_score *= society_age_boost
        
        return total_score
    
    def _get_recommendation_explanation_details(self, society, joined_societies):
        """
        Generate detailed explanation data for why a society is recommended.
        Returns a dictionary with explanation details for later use.
        """
        explanation = {
            "type": "general",
            "message": "Based on your interests",
            "details": {},
            "matched_society": None,
            "match_reason": None
        }
        
        # Check for category match
        joined_categories = [s.category for s in joined_societies]
        if society.category in joined_categories:
            category_matches = [s for s in joined_societies if s.category == society.category]
            if category_matches:
                explanation["type"] = "category"
                explanation["matched_society"] = category_matches[0].name
                explanation["match_reason"] = f"same category: {society.category}"
                explanation["details"]["category"] = society.category
                explanation["message"] = f"Similar to {category_matches[0].name} (same category: {society.category})"
                return explanation
        
        # Check for tag matches
        society_tags = society.tags or []
        if society_tags:
            for joined_society in joined_societies:
                joined_tags = joined_society.tags or []
                matching_tags = set(society_tags).intersection(set(joined_tags))
                if matching_tags:
                    explanation["type"] = "tags"
                    explanation["matched_society"] = joined_society.name
                    explanation["match_reason"] = f"shared interests: {', '.join(matching_tags)}"
                    explanation["details"]["tags"] = list(matching_tags)
                    explanation["message"] = f"Similar to {joined_society.name} (shared interests: {', '.join(matching_tags)})"
                    return explanation
        
        # For text similarity, find the most similar society
        max_similarity = 0
        most_similar_society = None
        
        for joined_society in joined_societies:
            if hasattr(society, 'description') and society.description and hasattr(joined_society, 'description') and joined_society.description:
                similarity = text_similarity_analyzer.calculate_similarity(
                    society.description,
                    [joined_society.description]
                )
                
                if similarity > max_similarity:
                    max_similarity = similarity
                    most_similar_society = joined_society
        
        # If we found a society with significant text similarity
        if max_similarity > 1.5 and most_similar_society:
            explanation["type"] = "content"
            explanation["matched_society"] = most_similar_society.name
            explanation["match_reason"] = "similar content"
            explanation["details"]["similarity_score"] = max_similarity
            explanation["message"] = f"Similar content to {most_similar_society.name}"
            return explanation
        
        # Check if the society offers diversity from existing memberships
        if all(society.category != s.category for s in joined_societies):
            explanation["type"] = "diversity"
            explanation["match_reason"] = "something different"
            explanation["details"]["category"] = society.category
            explanation["message"] = f"Try something new in {society.category}"
            return explanation
        
        # Default explanation with the first joined society
        if joined_societies:
            explanation["matched_society"] = joined_societies[0].name
            explanation["message"] = f"Based on your membership in {joined_societies[0].name}"
            
        return explanation

    def get_recommendation_explanation(self, student_id, society_id):
        """
        Generate an explanation for why a society is recommended to a student.
        Returns a dictionary with explanation details.
        """
        try:
            student = Student.objects.get(id=student_id)
            society = Society.objects.get(id=society_id)
            
            # Check if we've cached the explanation from the recommendation process
            if hasattr(society, '_recommendation_explanation'):
                return {
                    "type": society._recommendation_explanation["type"],
                    "message": society._recommendation_explanation["message"]
                }
            
            if not student.societies.exists():
                return {
                    "type": "popular",
                    "message": "Popular society with many members"
                }
            
            joined_societies = student.societies.all()
            
            # Generate a detailed explanation
            explanation_data = self._get_recommendation_explanation_details(society, joined_societies)
            
            # Return the simplified version for the API
            return {
                "type": explanation_data["type"],
                "message": explanation_data["message"]
            }
            
        except (Student.DoesNotExist, Society.DoesNotExist):
            return {
                "type": "popular",
                "message": "Recommended society for new members"
            }

    def update_similarity_model(self):
        """
        Update the text similarity model with all society descriptions.
        This should be called periodically to keep the model up-to-date.
        """
        # Get all society descriptions
        all_descriptions = Society.objects.filter(status="Approved").values_list('description', flat=True)
        
        # Check for duplicate descriptions
        unique_descriptions = set(all_descriptions)
        
        
        # If most descriptions are identical, add sample varied descriptions
        if len(unique_descriptions) < 3:
            all_descriptions = list(all_descriptions) + [
                "Programming Society for coding enthusiasts. We organize hackathons, workshops, and networking events.",
                "Film Club for cinema lovers. We watch and analyze classic and contemporary films together.",
                "Hiking Club for outdoor enthusiasts who enjoy exploring nature and staying active."
            ]
        
        # Update the analyzer's corpus with these descriptions
        text_similarity_analyzer.update_corpus(all_descriptions)
        
        # Clear similarity cache when model is updated
        self.society_similarities = {}
        
        return len(all_descriptions)