from django.db.models import Count, Sum
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
from api.views_files.recommendation_feedback_views import *
from api.views_files.recommendation_views import *



@csrf_exempt
def get_popular_societies(request):
    """
    Returns the top 5 most popular societies based on:
    - Number of members
    - Number of hosted events
    - Total event attendees
    """

    popular_societies = (
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
        .values(
            "id",
            "name",
            "description",
            "category",
            "social_media_links",
            "membership_requirements",
            "upcoming_projects_or_plans",
            "tags",
            "icon",
            "president",
            "status",
            "approved_by",
            "total_members",
            "total_events",
            "total_event_attendance",
            "popularity_score"
        )
    )

    return JsonResponse(list(popular_societies), safe=False)

@csrf_exempt
def get_upcoming_events(request):
    """
    Returns upcoming events sorted by date.
    """
    current_datetime = timezone.now()

    all_upcoming_events = (
        Event.objects.filter(date__gte=current_datetime)
        .order_by('date')
        .values(
            'id',
            'title',
            'description',
            'date',
            'location',
            'start_time',
            'duration',
            'hosted_by',
            'hosted_by_id',
            'current_attendees',
            'status',
            'broadcasts',
            'comments',
            'max_capacity',
        )
    )
    seen_ids = set()
    unique_events = []

    for event in all_upcoming_events:
        if event['id'] not in seen_ids:
            seen_ids.add(event['id'])
            unique_events.append(event)
            if len(unique_events) >= 4:
                break

    return JsonResponse(unique_events, safe=False)

@api_view(["GET"])
@permission_classes([])
def get_sorted_events(request):
    # Get only upcoming events
    events = Event.objects.filter(status="Approved", date__gte=now()).order_by("date", "start_time")
    serializer = EventSerializer(events, many=True)
    return Response(serializer.data)


def custom_media_view(request, path):
    """Used to serve media, i.e. photos to the frontend"""
    return serve(request, path, document_root=settings.MEDIA_ROOT)


@api_view(["POST"])
def like_comment(request, comment_id):
    """Allow user to like a comment"""
    comment = Comment.objects.get(id=comment_id)
    user = request.user

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
    user = request.user

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
    current_user = request.user
    target_user = get_object_or_404(User, id=user_id)

    if current_user == target_user:
        return Response({"error": "You cannot follow yourself."}, status=status.HTTP_400_BAD_REQUEST)

    if current_user.following.filter(id=target_user.id).exists():
        current_user.following.remove(target_user)
        return Response({"message": "Unfollowed successfully."}, status=status.HTTP_200_OK)
    else:
        current_user.following.add(target_user)
        return Response({"message": "Followed successfully."}, status=status.HTTP_200_OK)
