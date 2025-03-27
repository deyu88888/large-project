from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from api.models import RecommendationFeedback, Society, Student
from api.serializers import RecommendationFeedbackSerializer, RecommendationFeedbackCreateSerializer

class RecommendationFeedbackView(APIView):
    """API View for submitting and retrieving recommendation feedback."""
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'put', 'delete', 'head', 'options', 'patch']
    
    def post(self, request, society_id=None):
        """Submit feedback for a society recommendation."""
        try:
            student = Student.objects.get(pk=request.user.pk)
        except Student.DoesNotExist:
            return Response(
                {"error": "Only students can provide recommendation feedback."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            society = get_object_or_404(Society, id=society_id)
        except:
            return Response(
                {"error": f"Society with id={society_id} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = RecommendationFeedbackCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            feedback = serializer.save()
            return Response(
                RecommendationFeedbackSerializer(feedback).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get(self, request, society_id=None):
        """Retrieve feedback for a specific society or all feedback from the student."""
        try:
            student = Student.objects.get(pk=request.user.pk)
        except Student.DoesNotExist:
            return Response(
                {"error": "Only students can access recommendation feedback."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if society_id:
            try:
                feedback = RecommendationFeedback.objects.get(
                    student=student,
                    society_id=society_id
                )
                serializer = RecommendationFeedbackSerializer(feedback)
                return Response(serializer.data)
            except RecommendationFeedback.DoesNotExist:
                return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            feedback = RecommendationFeedback.objects.filter(student=student)
            serializer = RecommendationFeedbackSerializer(feedback, many=True)
            return Response(serializer.data)
    
    def put(self, request, society_id):
        """Update existing feedback."""
        try:
            student = Student.objects.get(pk=request.user.pk)
        except Student.DoesNotExist:
            return Response(
                {"error": "Only students can update recommendation feedback."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            feedback = get_object_or_404(
                RecommendationFeedback,
                student=student,
                society_id=society_id
            )
        except:
            return Response(
                {"error": "Feedback not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = RecommendationFeedbackSerializer(
            feedback,
            data=request.data,
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RecommendationFeedbackAnalyticsView(APIView):
    """API View for admins to get analytics on recommendation feedback."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get analytics on recommendation feedback."""
        user = request.user
        if not (user.role == "admin" or user.is_super_admin):
            return Response(
                {"error": "Only admins can access feedback analytics."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        total_feedback = RecommendationFeedback.objects.count()
        avg_rating = RecommendationFeedback.objects.all().values_list('rating', flat=True)
        avg_rating = sum(avg_rating) / total_feedback if total_feedback > 0 else 0
        
        join_count = RecommendationFeedback.objects.filter(is_joined=True).count()
        conversion_rate = (join_count / total_feedback * 100) if total_feedback > 0 else 0
        
        return Response({
            'total_feedback': total_feedback,
            'average_rating': round(avg_rating, 2),
            'join_count': join_count,
            'conversion_rate': round(conversion_rate, 2),
        })