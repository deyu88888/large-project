# backend/api/cold_start_handler.py

import random
from collections import Counter
from django.db.models import Count, Q
from .models import Society, Student, User

class ColdStartHandler:
    """
    Handles recommendations for new users (cold start problem) by using
    profile information, optional initial surveys, and collaborative filtering
    on similar user profiles.
    """
    
    def __init__(self):
        # Define weights for different profile similarity factors
        self.similarity_weights = {
            'major': 0.4,           # Academic major is a strong indicator
            'followed_users': 0.3,  # People they follow may have similar interests
            'category_diversity': 0.6  # Ensure diverse category coverage
        }
        
        # Category groupings for diversification
        self.category_groups = {
            'academic': ['academic', 'science', 'research', 'study'],
            'arts': ['arts', 'music', 'performance', 'creative', 'media'],
            'social': ['social', 'community', 'culture', 'international'],
            'sports': ['sports', 'outdoors', 'fitness', 'recreation'],
            'tech': ['tech', 'programming', 'engineering', 'digital'],
            'advocacy': ['activism', 'advocacy', 'environment', 'political']
        }
        
        # Number of top societies to consider from each source
        self.num_societies_per_source = 5
        
    def get_initial_recommendations(self, student_id, limit=5):
        """
        Generate recommendations for a new user with no society memberships
        using a combination of:
        1. Profile-based matching (major, interests if available)
        2. Collaborative filtering from similar users
        3. Diversity optimization across categories
        4. Popular but distinctive societies
        
        Args:
            student_id: ID of the student
            limit: Number of recommendations to return
            
        Returns:
            List of recommended Society objects
        """
        try:
            student = Student.objects.get(id=student_id)
            
            # Get basic information about the student
            student_major = student.major
            following = list(student.following.all())
            
            # Collect candidate societies from multiple sources
            candidates = []
            
            # Source 1: Major-based recommendations
            major_recommendations = self._get_major_based_recommendations(student_major)
            candidates.extend([
                {'society': society, 'source': 'major', 'score': 3.0}
                for society in major_recommendations[:self.num_societies_per_source]
            ])
            
            # Source 2: Social-based recommendations (from followed users)
            if following:
                social_recommendations = self._get_social_based_recommendations(following)
                candidates.extend([
                    {'society': society, 'source': 'social', 'score': 2.5}
                    for society in social_recommendations[:self.num_societies_per_source]
                ])
            
            # Source 3: Popular but diverse societies
            popular_diverse = self._get_diverse_popular_societies()
            candidates.extend([
                {'society': society, 'source': 'popular', 'score': 2.0}
                for society in popular_diverse[:self.num_societies_per_source]
            ])
            
            # Remove any duplicates while preserving the highest score
            unique_candidates = {}
            for item in candidates:
                society_id = item['society'].id
                if society_id not in unique_candidates or unique_candidates[society_id]['score'] < item['score']:
                    unique_candidates[society_id] = item
                    
            candidates = list(unique_candidates.values())
            
            # Apply diversity optimization across categories
            final_recommendations = self._ensure_category_diversity(candidates, limit)
            
            return [item['society'] for item in final_recommendations]
            
        except Student.DoesNotExist:
            # Return an empty list if student doesn't exist
            return []
            
    def _get_major_based_recommendations(self, major):
        """
        Get societies that are popular among students with the same major.
        
        Args:
            major: Student's major field of study
            
        Returns:
            List of Society objects
        """
        if not major:
            return []
            
        # Find societies that have members with the same major
        societies = Society.objects.filter(
            status="Approved",
            society_members__major=major
        ).annotate(
            major_members=Count('society_members', filter=Q(society_members__major=major))
        ).order_by('-major_members')
        
        return list(societies)
        
    def _get_social_based_recommendations(self, followed_users):
        """
        Get societies that are popular among users the student follows.
        
        Args:
            followed_users: List of User objects the student follows
            
        Returns:
            List of Society objects
        """
        if not followed_users:
            return []
            
        # Extract user IDs
        user_ids = [user.id for user in followed_users]
        
        # Find societies that these users are members of
        societies = Society.objects.filter(
            status="Approved",
            society_members__in=user_ids
        ).annotate(
            friend_count=Count('society_members', filter=Q(society_members__in=user_ids))
        ).order_by('-friend_count')
        
        return list(societies)
        
    def _get_diverse_popular_societies(self):
        """
        Get popular societies with a focus on category diversity.
        
        Returns:
            List of Society objects from different categories
        """
        # Get total societies per category
        categories = Society.objects.filter(
            status="Approved"
        ).values('category').annotate(
            count=Count('id')
        ).order_by()
        
        # Find the most popular society from each category
        diverse_societies = []
        
        for category_data in categories:
            category = category_data['category']
            if not category:
                continue
                
            # Get the most popular society in this category
            top_society = Society.objects.filter(
                status="Approved",
                category=category
            ).annotate(
                member_count=Count('society_members')
            ).order_by('-member_count').first()
            
            if top_society:
                diverse_societies.append(top_society)
                
        # If we still need more, add second most popular from each category
        if len(diverse_societies) < 10:
            for category_data in categories:
                category = category_data['category']
                if not category:
                    continue
                    
                # Get the second most popular society in this category
                second_society = Society.objects.filter(
                    status="Approved",
                    category=category
                ).annotate(
                    member_count=Count('society_members')
                ).order_by('-member_count')[1:2].first()
                
                if second_society:
                    diverse_societies.append(second_society)
                    
        return diverse_societies
        
    def _ensure_category_diversity(self, candidates, limit):
        """
        Ensure diversity across categories in the final recommendations.
        
        Args:
            candidates: List of candidate society dictionaries
            limit: Number of recommendations to select
            
        Returns:
            List of selected society dictionaries
        """
        if not candidates:
            return []
            
        if len(candidates) <= limit:
            return candidates
            
        # Group candidates by category
        by_category = {}
        for item in candidates:
            category = item['society'].category
            if category not in by_category:
                by_category[category] = []
            by_category[category].append(item)
            
        # Calculate how many to select from each category
        num_categories = len(by_category)
        min_per_category = 1
        extras = limit - (min_per_category * num_categories)
        
        if extras < 0:
            # Not enough slots for one per category, just select top overall
            sorted_candidates = sorted(candidates, key=lambda x: x['score'], reverse=True)
            return sorted_candidates[:limit]
            
        # Allocate additional slots to higher scoring categories
        category_scores = {}
        for category, items in by_category.items():
            category_scores[category] = sum(item['score'] for item in items) / len(items)
            
        sorted_categories = sorted(category_scores.items(), key=lambda x: x[1], reverse=True)
        
        # Allocate slots
        allocations = {category: min_per_category for category in by_category}
        for i in range(extras):
            if i < len(sorted_categories):
                allocations[sorted_categories[i][0]] += 1
                
        # Select from each category based on allocation
        selected = []
        for category, items in by_category.items():
            num_to_select = allocations.get(category, 0)
            sorted_items = sorted(items, key=lambda x: x['score'], reverse=True)
            selected.extend(sorted_items[:num_to_select])
            
        # If we still need more, take from the highest scoring overall
        if len(selected) < limit:
            remaining = limit - len(selected)
            remaining_candidates = [
                item for item in sorted(candidates, key=lambda x: x['score'], reverse=True)
                if item not in selected
            ]
            selected.extend(remaining_candidates[:remaining])
            
        # Final sort by score
        return sorted(selected, key=lambda x: x['score'], reverse=True)[:limit]
    
    def get_explanation_for_cold_start(self, society):
        """
        Generate an explanation for why a society is recommended to a new user.
        
        Args:
            society: The Society object being recommended
            
        Returns:
            Dictionary with explanation details
        """
        # Default explanations based on society properties
        if society.total_members if hasattr(society, 'total_members') else 0 > 20:
            return {
                "type": "popular",
                "message": f"Popular {society.category} society with an active community"
            }
            
        if society.events.count() > 3:
            return {
                "type": "events",
                "message": f"Active society with regular {society.category} events"
            }
            
        category_descriptions = {
            "academic": "academic",
            "arts": "creative arts",
            "music": "music",
            "sports": "sports",
            "outdoors": "outdoor activities",
            "tech": "technology",
            "social": "social",
            "business": "business",
            "culture": "cultural",
            "activism": "advocacy"
        }
        
        category_desc = category_descriptions.get(society.category, society.category)
        
        return {
            "type": "category",
            "message": f"Great choice for students interested in {category_desc}"
        }

# Create a singleton instance for reuse
cold_start_handler = ColdStartHandler()