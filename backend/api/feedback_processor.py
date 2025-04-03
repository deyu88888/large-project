import json
import os
from datetime import datetime, timedelta
from django.db.models import Avg, F, Max
from django.utils import timezone
from django.conf import settings
from .models import Society

class FeedbackProcessor:
    """
    Processes and incorporates user feedback to improve society recommendations.
    Supports both explicit feedback (ratings) and implicit feedback (clicks, joins).
    """
    
    def __init__(self):
        self.feedback_file = os.path.join(
            getattr(settings, 'BASE_DIR', ''), 'api', 'ml_models', 'recommendation_feedback.json'
        )
        
        self.weights = {
            'rating': 2.0,         
            'relevance': 1.5,      
            'click': 0.5,          
            'view_details': 0.8,   
            'join': 3.0            
        }
        
        self.feedback_half_life = 60
        
        self.feedback_data = self._load_feedback_data()
        
        self._preference_adjustments = {}
        self._cache_last_updated = None
        self._cache_valid_time = timedelta(hours=1)  
    
    def _load_feedback_data(self):
        """Load feedback data from file or initialize if not exists."""
        if os.path.exists(self.feedback_file):
            try:
                with open(self.feedback_file, 'r') as f:
                    data = json.load(f)
                return data
            except (json.JSONDecodeError, IOError) as e:
                return {'user_feedback': [], 'last_updated': None}
        else:
            return {'user_feedback': [], 'last_updated': None}
    
    def _save_feedback_data(self):
        """Save feedback data to file."""
        try:
            os.makedirs(os.path.dirname(self.feedback_file), exist_ok=True)
            
            self.feedback_data['last_updated'] = datetime.now().isoformat()
            
            with open(self.feedback_file, 'w') as f:
                json.dump(self.feedback_data, f, indent=2)
        except Exception:
            pass
    
    def record_feedback(self, student_id, society_id, feedback_type, value=None, metadata=None):
        """
        Record a feedback event for a student-society interaction.
        
        Args:
            student_id: ID of the student
            society_id: ID of the society
            feedback_type: Type of feedback ('rating', 'relevance', 'click', 'view_details', 'join')
            value: Numeric value for explicit feedback (e.g., rating score)
            metadata: Additional context about the feedback
        
        Returns:
            True if feedback was recorded successfully, False otherwise
        """
        if feedback_type not in self.weights:
            return False
        
        feedback_entry = {
            'student_id': student_id,
            'society_id': society_id,
            'feedback_type': feedback_type,
            'timestamp': datetime.now().isoformat(),
            'value': value
        }
        
        if metadata:
            feedback_entry['metadata'] = metadata
        
        self.feedback_data['user_feedback'].append(feedback_entry)
        
        self._save_feedback_data()
        
        self._preference_adjustments = {}
        self._cache_last_updated = None
        
        return True
    
    def get_preference_adjustments(self, student_id):
        """
        Calculate preference adjustments based on feedback for a specific student.
        Returns a dictionary of adjustments for categories, tags, and specific societies.
        
        Args:
            student_id: ID of the student
            
        Returns:
            Dictionary with adjustment factors for recommendations
        """
        now = timezone.now()
        if (student_id in self._preference_adjustments and 
            self._cache_last_updated and 
            now - self._cache_last_updated < self._cache_valid_time):
            return self._preference_adjustments[student_id]
        
        adjustments = {
            'categories': {},   
            'tags': {},         
            'societies': {}     
        }
        
        student_feedback = [
            item for item in self.feedback_data['user_feedback'] 
            if item['student_id'] == student_id
        ]
        
        if not student_feedback:
            return adjustments
        
        society_ids = set(item['society_id'] for item in student_feedback)
        societies = Society.objects.filter(id__in=society_ids)
        
        society_data = {}
        for society in societies:
            society_data[society.id] = {
                'category': society.category,
                'tags': society.tags or []
            }
        
        for item in student_feedback:
            society_id = item['society_id']
            if society_id not in society_data:
                continue  
                
            timestamp = datetime.fromisoformat(item['timestamp'])
            days_old = (now.replace(tzinfo=None) - timestamp).days
            decay_factor = 2 ** (-days_old / self.feedback_half_life)
            
            base_weight = self.weights[item['feedback_type']]
            
            if item['value'] is not None and item['feedback_type'] in ['rating', 'relevance']:
                value_factor = (item['value'] - 3) / 2  
                weight = base_weight * value_factor
            else:
                weight = base_weight
                
            weight *= decay_factor
            
            if society_id not in adjustments['societies']:
                adjustments['societies'][society_id] = 0
            adjustments['societies'][society_id] += weight
            
            category = society_data[society_id]['category']
            if category:
                if category not in adjustments['categories']:
                    adjustments['categories'][category] = 0
                adjustments['categories'][category] += weight * 0.8  
            
            for tag in society_data[society_id]['tags']:
                if tag not in adjustments['tags']:
                    adjustments['tags'][tag] = 0
                adjustments['tags'][tag] += weight * 0.6  
        
        for adjustment_type in adjustments:
            values = adjustments[adjustment_type].values()
            if values:
                max_abs_value = max(abs(v) for v in values) if values else 1
                if max_abs_value > 0:
                    for key in adjustments[adjustment_type]:
                        adjustments[adjustment_type][key] /= max_abs_value
                        adjustments[adjustment_type][key] = max(-1, min(1, adjustments[adjustment_type][key]))
        
        self._preference_adjustments[student_id] = adjustments
        self._cache_last_updated = now
        
        return adjustments
    
    def apply_feedback_adjustments(self, student_id, society_scores):
        """
        Apply preference adjustments to society scores based on feedback.
        
        Args:
            student_id: ID of the student
            society_scores: List of dictionaries with society data and scores
            
        Returns:
            Updated list of society scores
        """
        adjustments = self.get_preference_adjustments(student_id)
        
        if not any(adjustments.values()):
            return society_scores
        
        for item in society_scores:
            society = item['society']
            
            adjustment = 0
            
            if society.id in adjustments['societies']:
                society_adj = adjustments['societies'][society.id]
                society_adj = society_adj * abs(society_adj)
                adjustment += society_adj * 2.0  
            
            if society.category in adjustments['categories']:
                adjustment += adjustments['categories'][society.category] * 1.5
            
            tag_count = 0
            for tag in (society.tags or []):
                if tag in adjustments['tags']:
                    adjustment += adjustments['tags'][tag]
                    tag_count += 1
            
            if tag_count > 0:
                adjustment = adjustment / tag_count
            
            original_score = item['score']
            
            if adjustment > 0:
                item['score'] = original_score * (1 + (adjustment * 0.5))
            else:
                item['score'] = original_score * (1 + adjustment * 0.5)
            
            item['feedback_adjustment'] = adjustment
            
        return society_scores

feedback_processor = FeedbackProcessor()