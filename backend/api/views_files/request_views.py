from datetime import timedelta
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from api.models import ActivityLog, Society, SocietyRequest, Event
from api.serializers import SocietySerializer, StartSocietyRequestSerializer, EventSerializer
from api.views_files.view_utility import student_has_no_role, get_student_if_user_is_student, get_admin_if_user_is_admin


class StartSocietyRequestView(APIView):
    """View to handle society creation requests."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Post request for a student to start a society"""
        student, error = get_student_if_user_is_student(request.user, "request")
        if error:
            return error

        # Validates a student doesn't already have a role in a society
        error = student_has_no_role(student, True)
        if error:
            return error

        serializer = StartSocietyRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(requested_by=student)
            return Response(
                {"message": "Your request has been submitted for review."},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminSocietyRequestView(APIView):
    """View for admin to interact with SocietyRequests"""
    permission_classes = [IsAdminUser]
    def get(self, request, society_status):
        """Get request for all the pending society requests for admins."""
        _, error = get_admin_if_user_is_admin(request.user, "view society requests")
        if error:
            return error

        society_status = society_status.capitalize()
        pending_societies = Society.objects.filter(status=society_status)
        serializer = SocietySerializer(pending_societies, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, society_id):
        """PUT request to update the approve/reject a society request - for admins."""
        user, error = get_admin_if_user_is_admin(request.user, "approve or reject society requests")
        if error:
            return error

        society = Society.objects.filter(id=society_id).first()
        if not society:
            return Response(
                {"error": "Society request not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = SocietySerializer(society, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()

            # Notify WebSocket clients about the update
            channel_layer = get_channel_layer()

            # If society was approved, notify the society view WebSocket clients
            society_status = serializer.validated_data.get("status")
            action_type_map = {
                "Approved": "Approve",
                "Rejected": "Reject",
                "Pending": "Update",
            }
            action_type = action_type_map.get(society_status, "Update")

            ActivityLog.objects.create(
                action_type=action_type,
                target_type="Society",
                target_id=society.id,
                target_name=society.name,
                performed_by=user,
                timestamp=timezone.now(),
                expiration_date=timezone.now() + timedelta(days=30),
            )
            ActivityLog.delete_expired_logs()

            if society_status in ["Approved", "Rejected", "Pending"]:
                async_to_sync(channel_layer.group_send)(
                    "society_updates",
                    {
                        "type": "society_list_update",
                        "message": f"A new society has been {society_status}.",
                        "data": serializer.data,
                        "status": society_status,
                    }
                )

            return Response(
                {"message": "Society request updated successfully.", "data": serializer.data},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RequestJoinSocietyView(APIView):
    """
    API View for managing the joining of new societies by a student.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get all joinable societies for student"""
        student, error = get_student_if_user_is_student(request.user, "join")
        if error:
            return error
        joined_societies = student.societies_belongs_to.all()
        available_societies = Society.objects.exclude(id__in=joined_societies)
        serializer = SocietySerializer(available_societies, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, society_id=None):
        """Request to join a society by society_id"""
        student, error = get_student_if_user_is_student(request.user, "join")
        if error:
            return error

        if not society_id:
            return Response(
                {"error": "Society ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            society = Society.objects.get(id=society_id)
        except Society.DoesNotExist:
            return Response(
                {"error": "Society does not exist."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if the student is already a member
        if society.members.filter(id=student.id).exists():
            return Response(
                {"error": "You are already a member of this society."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check for existing pending request
        existing_request = SocietyRequest.objects.filter(
            from_student=student,
            society=society,
            intent="JoinSoc",
            approved=False
        ).first()

        if existing_request:
            return Response({
                "message": f"You already have a pending request to join {society.name}.",
                "request_id": existing_request.id
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create new society request
        society_request = SocietyRequest.objects.create(
            intent="JoinSoc",
            from_student=student,
            society=society,
            approved=False
        )

        return Response({
            "message": f"Request to join society '{society.name}' has been submitted for approval.",
            "request_id": society_request.id
        }, status=status.HTTP_201_CREATED)


class AdminEventRequestView(APIView):
    """
    Event view to show upcoming approved events.
    """
    def put(self, request, event_id):
        """
        Update event request from pending to approved/rejected - for admins
        """
        _, error = get_admin_if_user_is_admin(request.user, "approve or reject society requests")
        if error:
            return error

        event = Event.objects.filter(id=event_id).first()
        if not event:
            return Response({"error": "Event request not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = EventSerializer(event, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()

        channel_layer = get_channel_layer()

        if serializer.validated_data.get("status"):
            async_to_sync(channel_layer.group_send)(
                "events_updates",
                {
                    "type": "event_update",
                    "message": "A new event has been approved.",
                    "data": serializer.data,
                    "status": serializer.validated_data.get("status")
                }
            )

            return Response(
                {"message": "Event request updated successfully.", "data": serializer.data},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
