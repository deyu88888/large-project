from django.utils.timezone import now
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from api.models import Event, Society, Comment
from api.serializers import EventSerializer, RSVPEventSerializer,\
    EventRequestSerializer, EventCalendarSerializer, CommentSerializer
from api.views_files.view_utility import has_society_management_permission


def get_event_if_exists(event_id):
    """Retrieves an event via event_id if it exists, return error otherwise"""
    try:
        return Event.objects.get(id=event_id), None
    except Event.DoesNotExist:
        return None, Response(
            {"error": "Event not found."},
            status=status.HTTP_404_NOT_FOUND
        )

class JoinedEventsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        student = getattr(request.user, 'student', None)
        if not student:
            return Response({"error": "Only students can access this endpoint."}, status=403)

        events = Event.objects.filter(current_attendees__id=student.id).distinct()

        serializer = EventSerializer(events, many=True, context={'request': request})
        return Response(serializer.data)

class RSVPEventView(APIView):
    """ API View for RSVPing to events. """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        List events the student is eligible to RSVP for.
        """
        student = request.user.student
        events = Event.objects.filter(
            date__gte=now().date(),  # Future events only
        ).exclude(
            current_attendees=student  # Exclude already RSVP’d events
        ).filter(
            # Hosted by societies the student belongs to
            hosted_by__in=student.societies.all()
        )
        serializer = EventSerializer(events, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """
        RSVP for an event.
        """
        event_id = request.data.get('event_id')
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response({"error": "Event not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = RSVPEventSerializer(instance=event, data={}, context={
                                         'request': request, 'action': 'RSVP'})
        if serializer.is_valid():
            serializer.save()
            return Response({"message": f"RSVP'd for event '{event.title}'."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        """
        Cancel RSVP for an event.
        """
        event_id = request.data.get('event_id')
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response({"error": "Event not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = RSVPEventSerializer(instance=event, data={}, context={
                                         'request': request, 'action': 'CANCEL'})
        if serializer.is_valid():
            serializer.save()
            return Response({"message": f"Successfully canceled RSVP for event '{event.title}'."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EventHistoryView(APIView):
    """
    API View for viewing a student's event history.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Retrieve a list of past events the student attended."""
        student = request.user.student
        # attended_events = student.attended_events.filter(
        #     date__lt=timezone.now().date())
        attended_events = student.attended_events.all()
        serializer = EventSerializer(attended_events, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CreateEventRequestView(APIView):
    """
    API View for society presidents and vice presidents to create events that
    require admin approval.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, society_id):
        """
        Create a new event request (Pending approval)
        """
        user = request.user

        if not user.is_student():
            return Response(
                {"error": "Only society presidents and vice presidents can create events."},
                status=status.HTTP_403_FORBIDDEN
            )

        society = Society.objects.filter(id=society_id).first()
        if not society:
            return Response({"error": "Society not found."}, status=status.HTTP_404_NOT_FOUND)

        if not has_society_management_permission(user.student, society, for_events_only=True):
            return Response(
                {"error": "Only the society president, vice president, or event manager can create events for this society."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = EventRequestSerializer(
            data=request.data,
            context={"request": request, "hosted_by": society}
        )
        if serializer.is_valid():
            event_request = serializer.save()
            return Response(
                {
                    "message": "Event request submitted successfully. Awaiting admin approval.",
                    "data": EventRequestSerializer(event_request, context={"request": request}).data
                },
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ManageEventListView(APIView):
    """
    Lists events for the society the current student is managing.
    And applies a filter (upcoming, previous, pending).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Retrieves all a students events"""
        filter_type = request.query_params.get("filter", "upcoming")

        if not hasattr(request.user, "student"):
            return Response({"error": "Only students can retrieve society events."}, status=403)

        societies = request.user.student.societies_belongs_to.all()
        society_ids = [s.id for s in societies]

        if not society_ids:
            return Response([], status=200)

        events = Event.objects.filter(hosted_by__in=society_ids)

        today = now().date()
        current_time = now().time()

        if filter_type == "upcoming":
            events = (
                events.filter(date__gt=today, status="Approved") |
                events.filter(date=today, start_time__gt=current_time, status="Approved")
            )
        elif filter_type == "previous":
            events = (
                events.filter(date__lt=today, status="Approved") |
                events.filter(date=today, start_time__lt=current_time, status="Approved")
            )
        elif filter_type == "pending":
            events = events.filter(status="Pending")

        serializer = EventSerializer(events, many=True, context={'request': request})
        return Response(serializer.data, status=200)


class EventCalendarView(APIView):
    """
    View to provide events for the dashboard calendar.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Gets all the events in the db"""
        events = Event.objects.all()
        serializer = EventCalendarSerializer(events, many=True)
        return Response(serializer.data, status=200)


class AllEventsView(APIView):
    """API View to list all approved events for public user"""
    permission_classes = [AllowAny]

    def get(self, request):
        """Gets all approved Events, ordered for convenience"""
        events = Event.objects.filter(status="Approved").order_by("date", "start_time")
        serializer = EventSerializer(events, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class EventDetailsView(APIView):
    """API View to get details of an event"""
    permission_classes = [AllowAny]

    def get(self, request, event_id):
        """Gets an events details via event_id"""
        event = get_object_or_404(Event, id=event_id, status="Approved")
        serializer = EventSerializer(event, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class EventCommentsView(APIView):
    """
    API view for create and manage event comments
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Gets all the comments of an event via event_id"""
        event_id = request.query_params.get("event_id")
        if not event_id:
            return Response(
                {"error": "event_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        comments = Comment.objects.filter(
            event_id=event_id,
            parent_comment__isnull=True
        ).order_by("create_at")
        serializer = CommentSerializer(comments, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """Allow user to post a comment"""
        event_id = request.data.get("event")
        content = request.data.get("content")
        parent_comment_id = request.data.get("parent_comment", None)

        if not event_id or not content:
            return Response(
                {"error": "event and content are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        event = get_object_or_404(Event, pk=event_id)
        parent_comment = None
        if parent_comment_id:
            parent_comment = get_object_or_404(Comment, pk=parent_comment_id)

        comment = Comment.objects.create(
            event=event,
            user=request.user,
            content=content,
            parent_comment=parent_comment
        )

        serializer = CommentSerializer(comment, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
