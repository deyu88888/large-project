# backend/api/recommendation_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from api.models import Student, Society
from api.serializers import SocietySerializer
from api.recommendation_service import SocietyRecommender
from api.feedback_processor import feedback_processor

class RecommendedSocietiesView(APIView):
    """
    Enhanced API View for getting society recommendations tailored to a student's interests.
    Uses advanced NLP techniques and multi-dimensional interest profiling to provide
    balanced recommendations across different categories the student is interested in.
    Now integrates feedback data to continuously improve recommendations.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Try to get the student from the authenticated user
        try:
            student = Student.objects.get(pk=request.user.pk)
        except Student.DoesNotExist:
            return Response(
                {"error": "User is not a valid student."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Initialize the enhanced recommender
        recommender = SocietyRecommender()
        
        # Get parameters from query params
        limit = int(request.query_params.get('limit', 5))
        diversity_level = request.query_params.get('diversity', 'balanced')
        
        # Track this recommendation request as implicit feedback
        feedback_processor.record_feedback(
            student.id, 
            None,  # No specific society for this general action
            'recommendation_request', 
            metadata={'timestamp': timezone.now().isoformat()}
        )
        
        # Get recommended societies from the enhanced recommender
        recommended_societies = recommender.get_recommendations_for_student(
            student.id, limit, diversity_level
        )
        
        # EXCLUDE societies the student has already joined
        joined_society_ids = student.societies_belongs_to.values_list("id", flat=True)
        filtered_societies = [
            soc for soc in recommended_societies
            if soc.id not in joined_society_ids
        ]
        
        # Build the final response array with explanation data
        recommendations = []
        for society in filtered_societies:
            explanation = recommender.get_recommendation_explanation(student.id, society.id)
            
            # Record impression for this recommendation
            feedback_processor.record_feedback(
                student.id,
                society.id,
                'impression',
                metadata={'position': len(recommendations) + 1}
            )
            
            recommendations.append({
                'society': SocietySerializer(society).data,
                'explanation': explanation,
                'feedback_id': f"rec_{student.id}_{society.id}_{timezone.now().strftime('%Y%m%d%H%M%S')}"
                # This feedback_id can be used when tracking interactions with this recommendation
            })
            
        return Response(recommendations, status=status.HTTP_200_OK)

class SocietyRecommendationExplanationView(APIView):
    """
    API View for getting an explanation of why a society is recommended to a student.
    Now supports enhanced explanation types including content-based and semantic relationships.
    Tracks explanation views as implicit feedback.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, society_id):
        # Try to get the student from the authenticated user
        try:
            student = Student.objects.get(pk=request.user.pk)
        except Student.DoesNotExist:
            return Response(
                {"error": "User is not a valid student."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Check if society exists
        society = get_object_or_404(Society, id=society_id)
        
        # Initialize the recommender
        recommender = SocietyRecommender()
        
        # Record this explanation view as implicit feedback
        feedback_processor.record_feedback(
            student.id,
            society_id,
            'view_details',
            metadata={'explanation_request': True}
        )
        
        # Get enhanced recommendation explanation
        explanation = recommender.get_recommendation_explanation(student.id, society.id)
        
        return Response(explanation, status=status.HTTP_200_OK)


class SocietyInteractionView(APIView):
    """
    API View for tracking user interactions with societies.
    These interactions are treated as implicit feedback for recommendations.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, society_id):
        try:
            student = Student.objects.get(pk=request.user.pk)
        except Student.DoesNotExist:
            return Response(
                {"error": "User is not a valid student."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Check if society exists
        society = get_object_or_404(Society, id=society_id)
        
        # Get interaction type
        interaction_type = request.data.get('type')
        if not interaction_type:
            return Response(
                {"error": "Interaction type is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Map interaction types to feedback types
        interaction_map = {
            'view': 'view_details',
            'click': 'click',
            'bookmark': 'bookmark',
            'share': 'share',
            'join_request': 'join_request'
        }
        
        if interaction_type not in interaction_map:
            return Response(
                {"error": f"Unknown interaction type: {interaction_type}"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Record the interaction as feedback
        feedback_type = interaction_map[interaction_type]
        metadata = {
            'timestamp': timezone.now().isoformat(),
            'source': request.data.get('source', 'society_page'),
            'details': request.data.get('details', {})
        }
        
        feedback_processor.record_feedback(
            student.id,
            society_id,
            feedback_type,
            metadata=metadata
        )
        
        return Response(
            {
                "message": f"{interaction_type} interaction recorded",
                "society_id": society_id,
                "timestamp": timezone.now().isoformat()
            },
            status=status.HTTP_200_OK
        )