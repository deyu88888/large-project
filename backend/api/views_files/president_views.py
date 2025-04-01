from datetime import datetime
from django.utils.timezone import now, make_aware
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from api.models import Society, Student, Event, UserRequest, SocietyRequest, EventRequest
from api.serializers import SocietySerializer, SocietyRequestSerializer,\
    PendingMemberSerializer, EventSerializer, EventRequestSerializer
from api.views_files.view_utility import has_society_management_permission

def get_society_and_management_error(society_id, student):
    """
    Gets a society by ID and checks if the student has management permissions.
    """
    society = Society.objects.filter(id=society_id).first()
    if not society:
        error_response = Response({"error": "Society not found."}, status=404)
        return None, error_response
    
    if not has_society_management_permission(student, society):
        error_response = Response(
            {"error": "Only the society president or vice president can manage members."},
            status=status.HTTP_403_FORBIDDEN
        )
        return None, error_response
        
    return society, None



class ManageSocietyDetailsView(APIView):
    """
    API View for society presidents and vice presidents to manage their societies.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, society_id):
        """Get the details of a society"""
        user = request.user
        try:
            student = Student.objects.get(pk=user.pk)
        except Student.DoesNotExist:
            return Response({"error": "Only society presidents and vice "
                "presidents can manage their societies."},
                status=status.HTTP_403_FORBIDDEN
            )
        society, error = get_society_and_management_error(society_id, student)
        if error:
            return error
        serializer = SocietySerializer(society)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, society_id):
        """Make a request to update society details"""
        user = request.user

        if not user.is_student():
            return Response(
                {"error": "Only presidents and vice presidents can manage"
                " their societies."},
                status=status.HTTP_403_FORBIDDEN
            )
        student = user.student

        society, error = get_society_and_management_error(society_id, student)
        if error:
            return error

        serializer = SocietyRequestSerializer(
            data=request.data,
            context={"request": request},
            partial=True
        )
        if serializer.is_valid():
            society_request = serializer.save(society=society)
            return Response(
                {
                    "message": "Society update request submitted. Await admin approval.",
                    "request_id": society_request.id,
                },
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PendingMembersView(APIView):
    """
    API View for Society Presidents and Vice Presidents to manage pending membership requests.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, society_id):
        """
        Retrieve all pending membership requests for a specific society.
        """
        user = request.user

        if not hasattr(user, "student"):
            return Response(
                {"error": "Only society presidents and vice"
                " presidents can manage members."},
                status=status.HTTP_403_FORBIDDEN)
        student = user.student

        society, error = get_society_and_management_error(society_id, student)
        if error:
            return error

        # Get all pending membership requests
        pending_requests = SocietyRequest.objects.filter(
            intent="JoinSoc",
            approved=None,
            society=society
        )

        serializer = PendingMemberSerializer(pending_requests, many=True)
        return Response(serializer.data)

    def post(self, request, society_id, request_id):
        """
        Approve or reject a membership request.
        """
        user = request.user

        if not hasattr(user, "student"):
            return Response({"error": "Only society presidents and vice "
                "presidents can manage members."},
                status=status.HTTP_403_FORBIDDEN
            )
        student = user.student

        society, error = get_society_and_management_error(society_id, student)
        if error:
            return error

        # Find the pending request
        pending_request = SocietyRequest.objects.filter(
            id=request_id,
            intent="JoinSoc",
            approved=None,
            society=society
        ).first()
        if not pending_request:
            return Response({"error": "Request not found."}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get("action")

        if action == "approve":
            # Add student to society
            student = pending_request.from_student
            society.society_members.add(student)
            pending_request.approved = True
            pending_request.save()
            return Response(
                {"message": f"{student.first_name} has been approved."},
                status=status.HTTP_200_OK
            )

        elif action == "reject":
            # Delete the request
            pending_request.approved = True
            pending_request.save()
            pending_request.delete()
            return Response({"message": "Request has been rejected."}, status=status.HTTP_200_OK)

        return Response({"error": "Invalid action."}, status=status.HTTP_400_BAD_REQUEST)


class ManageEventDetailsView(APIView):
    """
    API View for society presidents, vice presidents, and event managers to edit or delete events.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_event(self, event_id):
        """Gets an event by id or 404s"""
        return get_object_or_404(Event, pk=event_id)

    def is_event_editable(self, event: Event):
        """
        Determines if an event is editable.
        Editable if:
         - status is "Pending", OR
         - status is "Approved" and event is in the future
        """
        if event.status == "Rejected":
            return False

        current_datetime = now()
        # If event is pending, allow edits regardless of date/time.
        if event.status == "Pending":
            return True

        # Combine the event's date and start_time.
        event_datetime = datetime.combine(event.date, event.start_time)
        if current_datetime.tzinfo:
            event_datetime = make_aware(event_datetime)

        if event.status == "Pending":
            return True
        elif event.status == "Approved":
            return event_datetime > current_datetime

        return False

    def get(self, request, event_id):
        """Returns a serialized event request (or event if no request exists) by event id"""
        event = self.get_event(event_id)
        event_request = EventRequest.objects.filter(event=event).first()
        if event_request:
            serializer = EventRequestSerializer(event_request, context={'request': request})
        else:
            serializer = EventSerializer(event, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, event_id):
        """Allows a student to edit an event"""
        user = request.user
        try:
            student = Student.objects.get(pk=user.pk)
        except Student.DoesNotExist:
            return Response({"error": "User is not a valid student."}, status=status.HTTP_403_FORBIDDEN)

        event = self.get_event(event_id)
        if not self.is_event_editable(event):
            return Response({"error": "Only upcoming or pending events can be edited."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if the user has management permissions for the society
        if not has_society_management_permission(student, event.hosted_by, for_events_only=True):
            return Response({"error": "No permission to modify this event."}, status=status.HTTP_403_FORBIDDEN)

        event_request = EventRequest.objects.filter(event=event).first()
        if not event_request:
            event_request = EventRequest.objects.create(
                event=event,
                hosted_by=event.hosted_by,
                from_student=student,
                intent="CreateEve",
                approved=None
            )

        # Instantiate the serializer.
        serializer = EventRequestSerializer(
            instance=event_request,
            data=request.data,
            context={"request": request},
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Event update submitted. Awaiting admin approval."},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, event_id):
        user = request.user
        # Ensure the user is a valid student
        try:
            student = Student.objects.get(pk=user.pk)
        except Student.DoesNotExist:
            return Response({"error": "User is not a valid student."}, status=status.HTTP_403_FORBIDDEN)

        event = self.get_event(event_id)
        if not self.is_event_editable(event):
            return Response({"error": "Only upcoming or pending events can be deleted."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if the user has management permissions for the society
        if not has_society_management_permission(student, event.hosted_by, for_events_only=True):
            return Response({"error": "No permission to delete this event."}, status=status.HTTP_403_FORBIDDEN)

        EventRequest.objects.filter(event=event).delete()
        event.delete()
        return Response({"message": "Event and related request deleted."}, status=status.HTTP_200_OK)


class SocietyRoleManagementView(APIView):
     """API View for managing society roles."""
     permission_classes = [IsAuthenticated]
 
     def patch(self, request, society_id):
         user = request.user
         society = get_object_or_404(Society, id=society_id)
         
         # Verify permissions
         if not has_society_management_permission(user.student, society):
             return Response({"error": "Insufficient permissions"}, status=status.HTTP_403_FORBIDDEN)
         
         # Handle vice president role
         if 'vice_president' in request.data:
             if request.data['vice_president'] is None:
                 # Remove the role
                 old_vp = society.vice_president
                 society.vice_president = None
                 if old_vp:
                     old_vp.is_vice_president = False
                     old_vp.save()
             else:
                 # Assign new vice president
                 new_vp_id = request.data['vice_president']
                 
                 # Check if role is already filled
                 if society.vice_president and str(society.vice_president.id) != str(new_vp_id):
                     return Response(
                         {"error": "This society already has a Vice President. Remove the current one first."},
                         status=status.HTTP_400_BAD_REQUEST
                     )
                 
                 # Get the student
                 try:
                     new_vp = Student.objects.get(id=new_vp_id)
                     society.vice_president = new_vp
                     new_vp.is_vice_president = True
                     new_vp.save()
                 except Student.DoesNotExist:
                     return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
             
         # Handle event manager role
         if 'event_manager' in request.data:
             if request.data['event_manager'] is None:
                 # Remove the role
                 old_em = society.event_manager
                 society.event_manager = None
                 if old_em:
                     old_em.is_event_manager = False
                     old_em.save()
             else:
                 # Assign new event manager
                 new_em_id = request.data['event_manager']
                 
                 # Check if role is already filled
                 if society.event_manager and str(society.event_manager.id) != str(new_em_id):
                     return Response(
                         {"error": "This society already has an Event Manager. Remove the current one first."},
                         status=status.HTTP_400_BAD_REQUEST
                     )
                 
                 try:
                     new_em = Student.objects.get(id=new_em_id)
                     society.event_manager = new_em
                     new_em.is_event_manager = True
                     new_em.save()
                 except Student.DoesNotExist:
                     return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
 
         society.save()
         
         return Response(SocietySerializer(society).data)