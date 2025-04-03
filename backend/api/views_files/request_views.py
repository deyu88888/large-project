import json
from datetime import timedelta
from django.utils import timezone
from api.serializers_files.request_serializers import SocietyRequestSerializer
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from api.models import ActivityLog, Society, SocietyRequest, Event
from api.serializers import SocietySerializer, StartSocietyRequestSerializer, EventSerializer
from api.views_files.view_utility import student_has_no_role, get_student_if_user_is_student, get_admin_if_user_is_admin
from django.db.models import Q

class StudentSocietyStatusView(APIView):
    """View to check if a student has pending society requests or is already a president."""
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id=None):
        """Get request to check student's society creation status"""
        # If no user_id is provided, use the authenticated user
        if not user_id:
            user_id = request.user.id
            
        # Get the student if the user is a student
        student, error = get_student_if_user_is_student(request.user, "check status")
        if error:
            return error

        # Check if the student is already a president of a society
        is_president = hasattr(student, 'president_of') and student.president_of is not None
        
        # Check if the student has any pending society creation requests
        pending_request = SocietyRequest.objects.filter(
            from_student=student,
            intent="CreateSoc",
            approved__isnull=True  # Only get ones where approved is NULL (pending)
        ).first()
        
        # Check if the student has any recently rejected society creation requests
        rejected_request = SocietyRequest.objects.filter(
            from_student=student,
            intent="CreateSoc",
            approved=False  # Get ones where approved is False (rejected)
        ).order_by('-requested_at').first()  # Get the most recent rejection using requested_at
        
        has_pending_request = pending_request is not None
        has_rejected_request = rejected_request is not None
        
        # Prepare the response data
        response_data = {
            "hasPendingRequest": has_pending_request,
            "isPresident": is_president,
            "hasRejectedRequest": has_rejected_request
        }
        
        # Add the pending request ID if there is one
        if has_pending_request:
            response_data["pendingRequestId"] = pending_request.id
            response_data["pendingRequestName"] = pending_request.name
            
        # Add the rejected request details if there is one
        if has_rejected_request:
            response_data["rejectedRequestId"] = rejected_request.id
            response_data["rejectedRequestName"] = rejected_request.name
            response_data["rejectionReason"] = rejected_request.rejection_reason if hasattr(rejected_request, 'rejection_reason') else "No reason provided"
            response_data["rejectedAt"] = rejected_request.requested_at.isoformat() if hasattr(rejected_request, 'requested_at') else None

        return Response(response_data, status=status.HTTP_200_OK)

class StartSocietyRequestView(APIView):
    """View to handle society creation requests."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Post request for a student to start a society"""
        student, error = get_student_if_user_is_student(
            request.user, "request")
        if error:
            return error

        # Validates a student doesn't already have a role in a society
        error = student_has_no_role(student, True)
        if error:
            return error
            
        # Check if the student already has a pending society creation request
        existing_request = SocietyRequest.objects.filter(
            from_student=student,
            intent="CreateSoc",
            approved__isnull=True  # Only get ones where approved is NULL (pending)
        ).exists()
        
        if existing_request:
            return Response(
                {"error": "You already have a pending society creation request. Please wait for admin approval."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = StartSocietyRequestSerializer(data=request.data, context={"request": request})
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
        _, error = get_admin_if_user_is_admin(
            request.user, "view society requests")
        if error:
            return error

        society_status = society_status.capitalize()

        if society_status == "Pending":
            # Exclude approved requests (where approved=True)
            queryset = SocietyRequest.objects.filter(
                intent="CreateSoc",
                approved__isnull=True  # Only get ones where approved is NULL
            )
            serializer = SocietyRequestSerializer(queryset, many=True)
        elif society_status == "Rejected":
            queryset = SocietyRequest.objects.filter(intent="CreateSoc", approved=False)
            serializer = SocietyRequestSerializer(queryset, many=True)
        else:
            queryset = Society.objects.filter(status=society_status)
            serializer = SocietySerializer(queryset, many=True)
        return Response(serializer.data, status=200)

    def put(self, request, society_id):
        """PUT request to update the approve/reject a society request - for admins."""
        user, error = get_admin_if_user_is_admin(
            request.user, "approve or reject society requests")
        if error:
            return error

        society_request = SocietyRequest.objects.filter(id=society_id, intent="CreateSoc").first()
        if not society_request:
            return Response(
                {"error": "Society request not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if we're rejecting and require a reason
        if 'approved' in request.data and request.data['approved'] is False:
            rejection_reason = request.data.get('rejection_reason')
            if not rejection_reason:
                return Response(
                    {"error": "A reason must be provided when rejecting a society request."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Store the rejection reason directly
            society_request.rejection_reason = rejection_reason
            society_request.save(update_fields=['rejection_reason'])

        serializer = SocietyRequestSerializer(society_request, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()

            approved_status = serializer.validated_data.get("approved")

            if approved_status is True:
                requesting_student = society_request.from_student
                
                if requesting_student:
                    # Create the society first and ensure it's saved
                    new_society = Society.objects.create(
                        name=society_request.name,
                        description=society_request.description,
                        category=society_request.category,
                        status="Approved",
                        approved_by=user,
                        president=requesting_student
                    )
                    
                    # Save to ensure it has an ID
                    new_society.save()
                    
                    # Add student relationship explicitly
                    new_society.society_members.add(requesting_student)
                    # Add this debug code to check if the relationship was established
                    print(f"Society members: {list(new_society.society_members.all())}")
                    print(f"Student societies: {list(requesting_student.societies_belongs_to.all())}")

                    # Force a refresh from the database to ensure relationships are loaded
                    requesting_student.refresh_from_db()
                    new_society.refresh_from_db()

                    # Check again after refresh
                    print(f"After refresh - Society members: {list(new_society.society_members.all())}")
                    print(f"After refresh - Student societies: {list(requesting_student.societies_belongs_to.all())}")
                    
                    # Make sure the president relationship is set
                    requesting_student.president_of = new_society
                    requesting_student.is_president = True
                    requesting_student.save()
                    
                    # Link the society request to the society
                    society_request.society = new_society
                    society_request.save()

            action_type_map = {
                True: "Approve",
                False: "Reject",
                None: "Update",
            }
            action_type = action_type_map.get(approved_status, "Update")

            # Include rejection reason in activity log if it's a rejection
            activity_data = {"approved": approved_status}
            if approved_status is False and hasattr(society_request, 'rejection_reason'):
                activity_data["rejection_reason"] = society_request.rejection_reason

            ActivityLog.objects.create(
                action_type=action_type,
                target_type="SocietyRequest",
                target_id=society_request.id,
                target_name=society_request.name,
                performed_by=user,
                timestamp=timezone.now(),
                reason=f"{action_type}d by admin",
                expiration_date=timezone.now() + timedelta(days=30),
                original_data=json.dumps(activity_data),
            )
            ActivityLog.delete_expired_logs()

            return Response(
                {"message": "Society request updated successfully.",
                    "data": serializer.data},
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
        user, error = get_admin_if_user_is_admin(
            request.user, "approve or reject society requests")
        if error:
            return error

        event = Event.objects.filter(id=event_id).first()
        if not event:
            return Response({"error": "Event request not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = EventSerializer(event, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()

            # Get event status for activity logging
            event_status = serializer.validated_data.get("status")
            action_type_map = {
                "Approved": "Approve",
                "Rejected": "Reject",
                "Pending": "Update",
            }
            action_type = action_type_map.get(event_status, "Update")

            # Create activity log entry for event update
            ActivityLog.objects.create(
                action_type=action_type,
                target_type="Event",
                target_id=event.id,
                target_name=event.title if hasattr(event, 'title') else f"Event {event.id}",
                performed_by=user,
                timestamp=timezone.now(),
                expiration_date=timezone.now() + timedelta(days=30),
            )

            return Response(
                {"message": "Event request updated successfully.",
                    "data": serializer.data},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)