# backend/api/recommendation_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Student, Society
from .serializers import SocietySerializer
from .recommendation_service import SocietyRecommender

class RecommendedSocietiesView(APIView):
    """
    Enhanced API View for getting society recommendations tailored to a student's interests.
    Uses advanced NLP techniques and multi-dimensional interest profiling to provide
    balanced recommendations across different categories the student is interested in.
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
        
        # Get limit from query params, default to 5
        limit = int(request.query_params.get('limit', 5))
        
        # Get raw recommended societies from your enhanced recommender
        # The recommender now automatically balances recommendations across categories
        recommended_societies = recommender.get_recommendations_for_student(student.id, limit)
        
        # EXCLUDE societies the student has already joined
        # This is now redundant since the recommender already does this, but keeping for safety
        joined_society_ids = student.societies_belongs_to.values_list("id", flat=True)
        filtered_societies = [
            soc for soc in recommended_societies
            if soc.id not in joined_society_ids
        ]
        
        # Build the final response array with explanation data
        # Enhanced explanations now provide more detailed reasoning
        recommendations = []
        for society in filtered_societies:
            explanation = recommender.get_recommendation_explanation(student.id, society.id)
            recommendations.append({
                'society': SocietySerializer(society).data,
                'explanation': explanation
            })
            
        return Response(recommendations, status=status.HTTP_200_OK)

class SocietyRecommendationExplanationView(APIView):
    """
    API View for getting an explanation of why a society is recommended to a student.
    Now supports enhanced explanation types including content-based and semantic relationships.
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
        
        # Get enhanced recommendation explanation
        explanation = recommender.get_recommendation_explanation(student.id, society.id)
        
        return Response(explanation, status=status.HTTP_200_OK)

class RecommendationFeedbackView(APIView):
    """
    API View for collecting feedback on society recommendations.
    This feedback can be used to improve future recommendations.
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
        
        # Process the feedback data
        # In a production system, you would store this and use it to improve recommendations
        rating = request.data.get('rating')
        relevance = request.data.get('relevance')
        comment = request.data.get('comment', '')
        is_joined = request.data.get('is_joined', False)
        
        # Simple validation
        if rating is None or relevance is None:
            return Response(
                {"error": "Rating and relevance are required fields."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Here you would typically save this feedback to your database
        # For now, we'll just acknowledge it
        return Response(
            {
                "message": "Feedback received, thank you!",
                "society_id": society_id,
                "rating": rating,
                "relevance": relevance
            },
            status=status.HTTP_200_OK
        )