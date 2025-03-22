# recommendation_feedback_serializers.py
from rest_framework import serializers
from api.models import RecommendationFeedback

class RecommendationFeedbackSerializer(serializers.ModelSerializer):
    """
    Serializer for the RecommendationFeedback model.
    """
    class Meta:
        model = RecommendationFeedback
        fields = ['id', 'student', 'society', 'rating', 'relevance', 'comment', 'is_joined', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        """
        Validate the feedback data.
        Ensure the rating is between 1 and 5.
        """
        if 'rating' in data and (data['rating'] < 1 or data['rating'] > 5):
            raise serializers.ValidationError({"rating": "Rating must be between 1 and 5."})
        
        return data
    
    def create(self, validated_data):
        """
        Create or update recommendation feedback.
        If feedback already exists for this student and society, update it.
        """
        student = validated_data.get('student')
        society = validated_data.get('society')
        
        # Check if feedback already exists
        try:
            feedback = RecommendationFeedback.objects.get(student=student, society=society)
            # Update existing feedback
            for attr, value in validated_data.items():
                setattr(feedback, attr, value)
            feedback.save()
            return feedback
        except RecommendationFeedback.DoesNotExist:
            # Create new feedback
            return super().create(validated_data)


class RecommendationFeedbackCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating recommendation feedback.
    Uses society_id instead of a full society object.
    """
    society_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = RecommendationFeedback
        fields = ['society_id', 'rating', 'relevance', 'comment', 'is_joined']
    
    def validate_society_id(self, value):
        """
        Validate the society_id.
        """
        from .models import Society
        try:
            Society.objects.get(pk=value)
        except Society.DoesNotExist:
            raise serializers.ValidationError("Society does not exist.")
        return value
    
    def create(self, validated_data):
        """
        Create a new recommendation feedback.
        """
        from .models import Society
        
        society_id = validated_data.pop('society_id')
        society = Society.objects.get(pk=society_id)
        
        # Get the student from the request
        student = self.context['request'].user.student
        
        # Check if feedback already exists
        try:
            feedback = RecommendationFeedback.objects.get(student=student, society=society)
            # Update existing feedback
            for attr, value in validated_data.items():
                setattr(feedback, attr, value)
            feedback.save()
            return feedback
        except RecommendationFeedback.DoesNotExist:
            # Create new feedback
            return RecommendationFeedback.objects.create(
                student=student,
                society=society,
                **validated_data
            )