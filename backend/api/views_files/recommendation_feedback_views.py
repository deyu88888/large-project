# recommendation_feedback_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
import logging

# Set up logger
logger = logging.getLogger(__name__)

from api.models import RecommendationFeedback
from api.serializers import RecommendationFeedbackSerializer, RecommendationFeedbackCreateSerializer
from api.models import Society, Student

class RecommendationFeedbackView(APIView):
    """
    API View for submitting and retrieving recommendation feedback.
    """
    permission_classes = [IsAuthenticated]
    
    # Explicitly allow all methods
    http_method_names = ['get', 'post', 'put', 'delete', 'head', 'options', 'patch']
    
    # Make sure your dispatch method isn't overriding anything
    def dispatch(self, request, *args, **kwargs):
        logger.info(f"CRITICAL DEBUG - RecommendationFeedbackView: Method={request.method}, Path={request.path}")
        # Don't override or return here, just log and continue
        return super().dispatch(request, *args, **kwargs)
    
    # Your existing get, post, put methods...
    
    def post(self, request, society_id=None):
        """
        Submit feedback for a society recommendation.
        """
        logger.info(f"POST method called for society_id={society_id}")
        # Ensure the user is a student
        try:
            student = Student.objects.get(pk=request.user.pk)
            logger.info(f"Found student: {student}")
        except Student.DoesNotExist:
            logger.warning(f"User {request.user} is not a student")
            return Response(
                {"error": "Only students can provide recommendation feedback."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validate the society exists
        try:
            society = get_object_or_404(Society, id=society_id)
            logger.info(f"Found society: {society}")
        except:
            logger.warning(f"Society with id={society_id} not found")
            return Response(
                {"error": f"Society with id={society_id} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create or update feedback
        serializer = RecommendationFeedbackCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            feedback = serializer.save()
            logger.info(f"Feedback created: {feedback}")
            return Response(
                RecommendationFeedbackSerializer(feedback).data,
                status=status.HTTP_201_CREATED
            )
        
        logger.warning(f"Serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get(self, request, society_id=None):
        """
        Retrieve feedback for a specific society or all feedback from the student.
        """
        logger.info(f"GET method called for society_id={society_id}")
        # Ensure the user is a student
        try:
            student = Student.objects.get(pk=request.user.pk)
            logger.info(f"Found student: {student}")
        except Student.DoesNotExist:
            logger.warning(f"User {request.user} is not a student")
            return Response(
                {"error": "Only students can access recommendation feedback."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if society_id:
            logger.info(f"Looking for feedback for society_id={society_id} by student={student.pk}")
            # Get feedback for a specific society
            try:
                feedback = RecommendationFeedback.objects.get(
                    student=student,
                    society_id=society_id
                )
                logger.info(f"Found feedback: {feedback}")
                serializer = RecommendationFeedbackSerializer(feedback)
                return Response(serializer.data)
            except RecommendationFeedback.DoesNotExist:
                logger.info(f"No feedback found for society_id={society_id} by student={student.pk}")
                # Return an empty response object with 204 No Content
                # This indicates the request was successful but there's no content to return
                return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            # Get all feedback from this student
            feedback = RecommendationFeedback.objects.filter(student=student)
            logger.info(f"Found {feedback.count()} feedback entries for student={student.pk}")
            serializer = RecommendationFeedbackSerializer(feedback, many=True)
            return Response(serializer.data)
    
    def put(self, request, society_id):
        """
        Update existing feedback.
        """
        logger.info(f"PUT method called for society_id={society_id}")
        # Ensure the user is a student
        try:
            student = Student.objects.get(pk=request.user.pk)
            logger.info(f"Found student: {student}")
        except Student.DoesNotExist:
            logger.warning(f"User {request.user} is not a student")
            return Response(
                {"error": "Only students can update recommendation feedback."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get the existing feedback
        try:
            feedback = get_object_or_404(
                RecommendationFeedback,
                student=student,
                society_id=society_id
            )
            logger.info(f"Found existing feedback: {feedback}")
        except:
            logger.warning(f"Feedback not found for society_id={society_id} by student={student.pk}")
            return Response(
                {"error": "Feedback not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Update the feedback
        serializer = RecommendationFeedbackSerializer(
            feedback,
            data=request.data,
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Feedback updated: {feedback}")
            return Response(serializer.data)
        
        logger.warning(f"Serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RecommendationFeedbackAnalyticsView(APIView):
    """
    API View for admins to get analytics on recommendation feedback.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Get analytics on recommendation feedback.
        """
        user = request.user
        if not (user.role == "admin" or user.is_super_admin):
            return Response(
                {"error": "Only admins can access feedback analytics."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Calculate basic statistics
        total_feedback = RecommendationFeedback.objects.count()
        avg_rating = RecommendationFeedback.objects.all().values_list('rating', flat=True)
        avg_rating = sum(avg_rating) / total_feedback if total_feedback > 0 else 0
        
        # Get conversion rate (recommendations that led to joins)
        join_count = RecommendationFeedback.objects.filter(is_joined=True).count()
        conversion_rate = (join_count / total_feedback * 100) if total_feedback > 0 else 0
        
        # Return analytics
        return Response({
            'total_feedback': total_feedback,
            'average_rating': round(avg_rating, 2),
            'join_count': join_count,
            'conversion_rate': round(conversion_rate, 2),
        })