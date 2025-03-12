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
    API View for getting society recommendations tailored to a student's interests.
    If the student hasn't joined any societies, return popular ones.
    Otherwise, return societies similar to the ones they've joined.
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
        
        # Initialize the recommender
        recommender = SocietyRecommender()
        
        # Get limit from query params, default to 5
        limit = int(request.query_params.get('limit', 5))
        
        # Get recommendations
        recommended_societies = recommender.get_recommendations_for_student(student.id, limit)
        
        # Generate recommendation explanations
        recommendations = []
        for society in recommended_societies:
            explanation = recommender.get_recommendation_explanation(student.id, society.id)
            recommendations.append({
                'society': SocietySerializer(society).data,
                'explanation': explanation
            })
        
        return Response(recommendations, status=status.HTTP_200_OK)


class SocietyRecommendationExplanationView(APIView):
    """
    API View for getting an explanation of why a society is recommended to a student.
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
        
        # Get recommendation explanation
        explanation = recommender.get_recommendation_explanation(student.id, society.id)
        
        return Response(explanation, status=status.HTTP_200_OK)