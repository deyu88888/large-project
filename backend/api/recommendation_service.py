# backend/api/recommendation_service.py
from django.db.models import Count, Sum, Q
from collections import Counter, defaultdict
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Society, Student
from .nlp_similarity import text_similarity_analyzer
from .semantic_enhancer import semantic_enhancer

class SocietyRecommender:
    """
    Advanced service for recommending societies to students based on their interests,
    using state-of-the-art NLP and multi-dimensional interest profiling.
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
        Get society recommendations for a specific student using a multi-dimensional approach.
        Balances recommendations across different interest categories.
        """
        try:
            student = Student.objects.get(id=student_id)
            
            # If student hasn't joined any societies, return popular ones
            if not student.societies.exists():
                return self.get_popular_societies(limit)
            
            # Get societies the student has already joined
            joined_societies = student.societies.all()
            
            # Extract categories the student is interested in
            joined_categories = set(joined_societies.values_list('category', flat=True))
            print(f"User is interested in these categories: {joined_categories}")
            
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
                    'score': score,
                    'category': society.category
                })
            
            # Group societies by category
            societies_by_category = defaultdict(list)
            for item in society_scores:
                societies_by_category[item['category']].append(item)
            
            # Sort societies within each category by score
            for category in societies_by_category:
                societies_by_category[category] = sorted(
                    societies_by_category[category], 
                    key=lambda x: x['score'], 
                    reverse=True
                )
            
            # Guaranteed allocation: ensure each joined category gets at least one recommendation
            recommended_societies = []
            slots_remaining = limit
            
            # First, allocate one slot to each joined category if available
            for category in joined_categories:
                if category in societies_by_category and societies_by_category[category]:
                    recommended_societies.append(societies_by_category[category][0])
                    # Remove this society so it's not selected again
                    societies_by_category[category] = societies_by_category[category][1:]
                    slots_remaining -= 1
            
            print(f"After guaranteed allocation, slots remaining: {slots_remaining}")
            
            # Flatten remaining societies and sort by score for remaining slots
            remaining_societies = []
            for category_societies in societies_by_category.values():
                remaining_societies.extend(category_societies)
            
            remaining_societies = sorted(remaining_societies, key=lambda x: x['score'], reverse=True)
            recommended_societies.extend(remaining_societies[:slots_remaining])
            
            # Generate explanations for the recommendations
            for item in recommended_societies:
                item['explanation'] = self._get_recommendation_explanation_details(
                    item['society'], joined_societies
                )
                setattr(item['society'], '_recommendation_explanation', item['explanation'])
            
            # Final sort by score for presentation order
            recommended_societies = sorted(recommended_societies, key=lambda x: x['score'], reverse=True)
            
            print(f"Final recommendations across categories: {[r['society'].name for r in recommended_societies]}")
            return [item['society'] for item in recommended_societies]
            
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
        print(f"Corpus length after removing duplicates: {len(unique_descriptions)}")
        
        if unique_descriptions:
            print("First 3 corpus documents:")
            for desc in list(unique_descriptions)[:3]:
                print(f" - {desc[:200]}..." if len(desc) > 200 else f" - {desc}")
        
        # If most descriptions are identical, add sample varied descriptions
        if len(unique_descriptions) < 3:
            print("Corpus too small, adding sample descriptions for training...")
            all_descriptions = list(all_descriptions) + [
                "Programming Society for coding enthusiasts. We organize hackathons, workshops, and networking events.",
                "Film Club for cinema lovers. We watch and analyze classic and contemporary films together.",
                "Hiking Club for outdoor enthusiasts who enjoy exploring nature and staying active."
            ]
        
        # Update the analyzer's corpus with these descriptions
        text_similarity_analyzer.update_corpus(all_descriptions)
        
        return len(all_descriptions)