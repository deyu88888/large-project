from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
from django.db.models import Sum
from django.utils.timezone import now
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.views.static import serve
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from api.models import Event, Society,  User,  Comment
from api.serializers import (
    EventSerializer,
)
from api.utils import *
from api.views_files.view_utility import *
from api.views_files.award_views import *
from api.views_files.admin_delete_views import *
from api.views_files.admin_handle_event_views import *
from api.views_files.admin_handle_society_views import *
from api.views_files.admin_views import *
from api.views_files.communication_views import *
from api.views_files.dashboard_views import *
from api.views_files.event_views import *
from api.views_files.news_views import *
from api.views_files.president_views import *
from api.views_files.report_views import *
from api.views_files.request_views import *
from api.views_files.society_views import *
from api.views_files.user_views import *
from api.views_files.recommendation_views import *
from api.views_files.comment_views import *
from api.views_files.society_news_views import *
from django.http import FileResponse
from django.conf import settings
from django.views.static import serve
import os
from api.models import RecommendationFeedback, Society, Student
from api.serializers import RecommendationFeedbackSerializer, RecommendationFeedbackCreateSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

@api_view(['GET'])
@permission_classes([AllowAny])
def get_popular_societies(request):
    """
    Returns the top 5 most popular societies based on:
    - Number of members
    - Number of hosted events
    - Total event attendees

    Data is processed via SocietySerializer.
    """
    popular_societies_qs = (
        Society.objects.annotate(
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
        .order_by("-popularity_score")[:5]
    )

    serializer = SocietySerializer(popular_societies_qs, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_upcoming_events(request):
    """
    Returns upcoming events sorted by date, processed by EventSerializer.
    """
    current_datetime = timezone.now()
    events_qs = Event.objects.filter(date__gte=current_datetime, status='Approved').order_by('date')

    seen_ids = set()
    unique_events_list = []
    for event in events_qs:
        if event.id not in seen_ids:
            seen_ids.add(event.id)
            unique_events_list.append(event)
            if len(unique_events_list) >= 5:
                break

    serializer = EventSerializer(unique_events_list, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(["GET"])
@permission_classes([])
def get_sorted_events(request):
    events = Event.objects.filter(date__gte=now()).order_by("date", "start_time")
    serializer = EventSerializer(events, many=True, context={'request': request})
    return Response(serializer.data)


def custom_media_view(request, path):
    """Used to serve media, i.e. photos and PDFs to the frontend with proper headers"""
    file_path = os.path.join(settings.MEDIA_ROOT, path)

    if os.path.exists(file_path) and file_path.lower().endswith('.pdf'):
        response = FileResponse(open(file_path, 'rb'), content_type='application/pdf')

        response['Content-Disposition'] = f'inline; filename="{os.path.basename(file_path)}"'
        response['Access-Control-Allow-Origin'] = '*'
        response['X-Frame-Options'] = 'SAMEORIGIN'

        return response

    return serve(request, path, document_root=settings.MEDIA_ROOT)


@api_view(["POST"])
def like_comment(request, comment_id):
    """Allow user to like a comment"""
    comment = Comment.objects.get(id=comment_id)
    user = User.objects.get(pk=request.user.pk)

    if user in comment.likes.all():
        comment.likes.remove(user)
        return Response({"status": "unliked"}, status=status.HTTP_200_OK)
    else:
        comment.likes.add(user)
        comment.dislikes.remove(user)
        return Response({"status": "liked"}, status=status.HTTP_200_OK)


@api_view(["POST"])
def dislike_comment(request, comment_id):
    """Allow user to dislike a comment"""
    comment = Comment.objects.get(id=comment_id)
    user = User.objects.get(pk=request.user.pk)

    if user in comment.dislikes.all():
        comment.dislikes.remove(user)
        return Response({"status": "undisliked"}, status=status.HTTP_200_OK)
    else:
        comment.dislikes.add(user)
        comment.likes.remove(user)
        return Response({"status": "disliked"}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_follow(request, user_id):
    """
    Process User's follow/unfollow request
    - only can follow other users
    - if followed then just can unfollow, vice versa
    """
    current_user = User.objects.get(pk=request.user.pk)
    target_user = get_object_or_404(User, id=user_id)

    if current_user == target_user:
        return Response({"error": "You cannot follow yourself."}, status=status.HTTP_400_BAD_REQUEST)

    if current_user.following.filter(id=target_user.id).exists():
        current_user.following.remove(target_user)
        return Response({"message": "Unfollowed successfully."}, status=status.HTTP_200_OK)
    else:
        current_user.following.add(target_user)
        return Response({"message": "Followed successfully."}, status=status.HTTP_200_OK)

@csrf_exempt
def check_email(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            email = data.get("email", "").lower()
            if not email or not email.endswith("@kcl.ac.uk"):
                return JsonResponse(
                    {"error": "Invalid email. Only KCL emails are allowed."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            in_use = User.objects.filter(email=email).exists()
            return JsonResponse({"inUse": in_use}, status=status.HTTP_200_OK)
        except Exception as e:
            return JsonResponse(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    return JsonResponse({"error": "Invalid request method."}, status=status.HTTP_400_BAD_REQUEST)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_avatar(request):
    try:
        student = Student.objects.get(pk=request.user.pk)
    except Student.DoesNotExist:
        return Response({"detail": "Only students can change avatar."}, status=403)

    image = request.FILES.get("image")
    try:
        crop_x = int(request.POST.get("crop_x"))
        crop_y = int(request.POST.get("crop_y"))
        crop_width = int(request.POST.get("crop_width"))
        crop_height = int(request.POST.get("crop_height"))
    except Exception as e:
        return Response({"detail": "Invalid crop params."}, status=400)

    if not image:
        return Response({"detail": "No image uploaded."}, status=400)

    try:
        img = Image.open(image)
        cropped = img.crop((crop_x, crop_y, crop_x + crop_width, crop_y + crop_height))
        cropped = cropped.resize((300, 300))

        buffer = BytesIO()
        cropped.save(fp=buffer, format='PNG')
        file_name = f"user_{student.id}_avatar.png"
        student.icon.save(file_name, ContentFile(buffer.getvalue()))
        student.save()

        return Response({"icon": student.icon.url})
    except Exception as e:
        return Response({"detail": "Image processing failed."}, status=500)
    
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
        
        if society_id is None:
            return Response(
                {"error": "Society ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            society = Society.objects.get(id=society_id)
        except Society.DoesNotExist:
            return Response(
                {"error": f"Society with id={society_id} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Add society_id to request data
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        data['society_id'] = society_id
        
        serializer = RecommendationFeedbackCreateSerializer(
            data=data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            # Now we can just call save() without parameters since society_id is in the data
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
                return Response(serializer.data, status=status.HTTP_200_OK)
            except RecommendationFeedback.DoesNotExist:
                return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            feedback = RecommendationFeedback.objects.filter(student=student)
            serializer = RecommendationFeedbackSerializer(feedback, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request, society_id=None):
        """Update existing feedback."""
        if society_id is None:
            return Response(
                {"error": "Society ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            student = Student.objects.get(pk=request.user.pk)
        except Student.DoesNotExist:
            return Response(
                {"error": "Only students can update recommendation feedback."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            feedback = RecommendationFeedback.objects.get(
                student=student,
                society_id=society_id
            )
        except RecommendationFeedback.DoesNotExist:
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
            return Response(serializer.data, status=status.HTTP_200_OK)
        
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
        }, status=status.HTTP_200_OK)    
