# backend/api/recommendation_service.py
from django.db.models import Count, Sum, Q
from collections import Counter

from .models import Society, Student

class SocietyRecommender:
    """
    Service for recommending societies to students based on their current memberships
    and activity patterns.
    """
    
    def get_popular_societies(self, limit=5):
        """
        Get the most popular societies based on membership count, event count, and 
        event attendance.
        """
        popular_societies = (
            Society.objects.filter(status="Approved")
            .annotate(
                total_members=Count("society_members"),
                total_events=Count("events"),
                total_event_attendance=Sum("events__current_attendees")
            )
            .annotate(
                popularity_score=(
                    (2 * Count("society_members")) +
                    (3 * Count("events")) +
                    (4 * Sum("events__current_attendees"))
                )
            )
            .order_by("-popularity_score")[:limit]
        )
        
        return popular_societies
    
    def get_recommendations_for_student(self, student_id, limit=5):
        """
        Get society recommendations for a specific student.
        If the student hasn't joined any societies, return popular ones.
        Otherwise, return societies similar to the ones they've joined.
        """
        try:
            student = Student.objects.get(id=student_id)
            
            # If student hasn't joined any societies, return popular ones
            if not student.societies.exists():
                return self.get_popular_societies(limit)
            
            # Get societies the student has already joined
            joined_societies = student.societies.all()
            
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
                score = self._calculate_similarity_score(society, joined_societies)
                society_scores.append({
                    'society': society,
                    'score': score
                })
            
            # Sort by similarity score and return top recommendations
            recommended_societies = [
                item['society'] for item in 
                sorted(society_scores, key=lambda x: x['score'], reverse=True)[:limit]
            ]
            
            return recommended_societies
            
        except Student.DoesNotExist:
            # If student doesn't exist, return popular societies
            return self.get_popular_societies(limit)
    
    def _calculate_similarity_score(self, society, joined_societies):
        """
        Calculate similarity score between a society and the societies a student has joined.
        Higher score means more similar/relevant.
        """
        total_score = 0
        
        # Extract features from joined societies
        joined_categories = [s.category for s in joined_societies]
        joined_tags = []
        for s in joined_societies:
            if s.tags:
                joined_tags.extend(s.tags)
        
        # Category similarity (exact match)
        if society.category in joined_categories:
            total_score += 3
        
        # Tag similarity (count matching tags)
        society_tags = society.tags or []
        matching_tags = sum(1 for tag in society_tags if tag in joined_tags)
        total_score += matching_tags * 2
        
        # Text similarity in society description
        desc_similarity = self._calculate_text_similarity(
            society.description, 
            [s.description for s in joined_societies]
        )
        total_score += desc_similarity
        
        return total_score
    
    def _calculate_text_similarity(self, text, comparison_texts):
        """
        Calculate the similarity between a text and a list of comparison texts.
        Returns a similarity score from 0 to 5.
        
        This is a simple implementation using word overlap.
        For production, consider using TF-IDF or word embeddings.
        """
        if not text or not comparison_texts:
            return 0
            
        # Simple word overlap approach
        words = set(text.lower().split())
        max_similarity = 0
        
        for comparison_text in comparison_texts:
            if not comparison_text:
                continue
                
            comparison_words = set(comparison_text.lower().split())
            
            # Calculate Jaccard similarity
            if not words and not comparison_words:
                similarity = 0
            else:
                intersection = len(words.intersection(comparison_words))
                union = len(words.union(comparison_words))
                similarity = intersection / union if union > 0 else 0
            
            max_similarity = max(max_similarity, similarity)
        
        # Scale to 0-5 range
        return max_similarity * 5

    def get_recommendation_explanation(self, student_id, society_id):
        """
        Generate an explanation for why a society is recommended to a student.
        Returns a dictionary with explanation details.
        """
        try:
            student = Student.objects.get(id=student_id)
            society = Society.objects.get(id=society_id)
            
            if not student.societies.exists():
                return {
                    "type": "popular",
                    "message": "Popular society with many members"
                }
            
            joined_societies = student.societies.all()
            
            # Check for category match
            category_matches = joined_societies.filter(category=society.category)
            if category_matches.exists():
                return {
                    "type": "category",
                    "message": f"Similar to {category_matches[0].name} (same category: {society.category})"
                }
            
            # Check for tag matches
            society_tags = society.tags or []
            if society_tags:
                for joined_society in joined_societies:
                    joined_tags = joined_society.tags or []
                    matching_tags = set(society_tags).intersection(set(joined_tags))
                    if matching_tags:
                        return {
                            "type": "tags",
                            "message": f"Similar to {joined_society.name} (shared interests: {', '.join(matching_tags)})"
                        }
            
            # Default explanation
            return {
                "type": "general",
                "message": f"Based on your interests in {joined_societies[0].name}"
            }
            
        except (Student.DoesNotExist, Society.DoesNotExist):
            return {
                "type": "popular",
                "message": "Recommended society for new members"
            }