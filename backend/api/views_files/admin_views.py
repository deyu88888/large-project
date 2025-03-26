from datetime import datetime, date, timedelta, time
import json
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from api.models import AdminReportRequest, Event, Society, Student, User,\
    ActivityLog, ReportReply, SocietyRequest
from api.serializers import AdminReportRequestSerializer, EventSerializer, \
    SocietySerializer, StudentSerializer, UserSerializer, AdminSerializer,\
    ActivityLogSerializer, ReportReplySerializer, SocietyRequestSerializer
from api.views_files.view_utility import get_admin_if_user_is_admin
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

class AdminEventView(APIView):
    """
    Event view to show upcoming approved events.
    """

    def get(self, request, event_status) -> Response:
        """
        Returns a list of upcoming approved events sorted by date and time.
        """
        event_status = event_status.capitalize()
        events = Event.objects.filter(status=event_status).order_by("date", "start_time")
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminListView(APIView):
    """
    admin view for admins to view all admins
    """
    permission_classes = [IsAuthenticated]

    def get(self, request) -> Response:
        """
        get the list of admins for the admin.
        """
        admins = User.get_admins()
        serializer = UserSerializer(admins, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """
        post request to create a new admin user
        """
        if not request.user.is_super_admin:
            return Response(
                {"error": "You do not have permission to create admins."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save(role="admin", is_staff=True)   
            return Response(
                {"message": "Admin registered successfully.", "admin": UserSerializer(user).data},
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminStudentListView(APIView):
    """
    Student view for admins to view all students.
    """
    permission_classes = [IsAdminUser]

    def get(self, request) -> Response:
        """Gets all students for the admin."""
        students = Student.objects.all()
        serializer = StudentSerializer(students, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminManageStudentDetailsView(APIView):
    """
    API View for admins to manage any student's details.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        """Gets the details of a student via student_id"""
        _, error = get_admin_if_user_is_admin(request.user, "access this endpoint")
        if error:
            return error

        student = Student.objects.filter(id=student_id).first()
        if not student:
            return Response({"error": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = StudentSerializer(student)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, student_id):
        """Allows admin to alter student details"""
        _, error = get_admin_if_user_is_admin(request.user, "update student details")
        if error:
            return error

        student = Student.objects.filter(id=student_id).first()
        if not student:
            return Response({"error": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        original_societies = None
        if 'societies' in data:
            original_societies = data['societies']
            del data['societies']
        
        serializer = StudentSerializer(student, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            if original_societies is not None:
                student.societies.clear()
                
                if isinstance(original_societies, list):
                    for society_id in original_societies:
                        try:
                            society_id = int(society_id)
                            society = Society.objects.get(id=society_id)
                            student.societies.add(society)
                        except (ValueError, Society.DoesNotExist):
                            pass  # Skip invalid IDs
                
                student.save()
            
            updated_serializer = StudentSerializer(student)
            
            ActivityLog.objects.create(
                action_type="Update",
                target_type="Student",
                target_id=student.id,
                target_name=student.full_name,
                target_email=student.email,
                performed_by=request.user,
                reason=data.get('reason', 'Admin update of student details')
            )
            
            return Response({"message": "Student details updated successfully.", "data": updated_serializer.data}, 
                           status=status.HTTP_200_OK)
            return Response(
                {"message": "Student details updated successfully.",
                "data": serializer.data}, status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminManageSocietyDetailsView(APIView):
    """
    API View for admins to manage any society's details.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, society_id):
        """Admin gets the details of a society"""
        _, error = get_admin_if_user_is_admin(request.user, "access this endpoint")
        if error:
            return error
        society = Society.objects.filter(id=society_id).first()
        if not society:
            return Response({"error": "Society not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = SocietySerializer(society, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, society_id):
        """Admin submits an adjustment to society details"""
        user, error = get_admin_if_user_is_admin(request.user, "update society details")
        if error:
            return error

        society = Society.objects.filter(id=society_id).first()
        if not society:
            return Response({"error": "Society not found."}, status=status.HTTP_404_NOT_FOUND)

        original_data = {}

        for field in society._meta.fields:
            field_name = field.name
            if field_name not in ['id', 'user_ptr']:  # Skip certain fields
                value = getattr(society, field_name)

                if isinstance(value, (date, datetime)):
                    original_data[field_name] = value.isoformat()
                elif hasattr(value, 'id') and not isinstance(value, (list, dict)):
                    original_data[field_name] = value.id
                elif hasattr(value, 'url') and hasattr(value, 'name'):
                    original_data[field_name] = value.name if value.name else None
                else:
                    original_data[field_name] = value

        for field in society._meta.many_to_many:
            field_name = field.name
            related_ids = [item.id for item in getattr(society, field_name).all()]
            original_data[field_name] = related_ids

        try:
            original_data_json = json.dumps(original_data)
        except TypeError as e:
            problematic_fields = {}
            for key, value in original_data.items():
                try:
                    json.dumps({key: value})
                except TypeError:
                    problematic_fields[key] = str(type(value))

            return Response({
                "error": f"JSON serialization error: {str(e)}",
                "problematic_fields": problematic_fields
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        serializer = SocietySerializer(society, data=request.data, partial=True, context={"request": request})
        if serializer.is_valid():
            log_entry = ActivityLog.objects.create(
                action_type="Update",
                target_type="Society",
                target_id=society.id,
                target_name=society.name,
                performed_by=user,
                timestamp=timezone.now(),
                reason=request.data.get('reason', 'Admin update of society details'),
                expiration_date=timezone.now() + timedelta(days=30),
                original_data=original_data_json
            )

            serializer.save()
            ActivityLog.delete_expired_logs()

            return Response({
                "message": "Society details updated successfully.",
                "data": serializer.data
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminManageEventDetailsView(APIView):
    """
    API View for admins to manage any event's details.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, event_id):
        """Gets the details of an event_id"""
        _, error = get_admin_if_user_is_admin(request.user, "access this endpoint")
        if error:
            return error
        event = Event.objects.filter(id=event_id).first()
        if not event:
            return Response({"error": "Event not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = EventSerializer(event)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, event_id):
        """Edits the details of an event via event_id"""
        user, error = get_admin_if_user_is_admin(request.user, "update event details")
        if error:
            return error

        event = Event.objects.filter(id=event_id).first()
        if not event:
            return Response({"error": "Event not found."}, status=status.HTTP_404_NOT_FOUND)

        original_data = {}

        for field in event._meta.fields:
            field_name = field.name
            if field_name not in ['id', 'user_ptr']:  # Skip certain fields
                value = getattr(event, field_name)

                if isinstance(value, datetime):
                    original_data[field_name] = value.isoformat()
                elif isinstance(value, date) and not isinstance(value, datetime):
                    original_data[field_name] = value.isoformat()
                elif isinstance(value, time):
                    original_data[field_name] = value.strftime('%H:%M:%S')
                elif isinstance(value, timedelta):
                    original_data[field_name] = value.total_seconds()
                elif hasattr(value, 'id') and not isinstance(value, (list, dict)):
                    original_data[field_name] = value.id
                elif hasattr(value, 'url') and hasattr(value, 'name'):
                    original_data[field_name] = value.name if value.name else None
                else:
                    original_data[field_name] = value

        for field in event._meta.many_to_many:
            field_name = field.name
            related_ids = [item.id for item in getattr(event, field_name).all()]
            original_data[field_name] = related_ids

        try:
            original_data_json = json.dumps(original_data)
        except TypeError as e:
            problematic_fields = {}
            for key, value in original_data.items():
                try:
                    json.dumps({key: value})
                except TypeError:
                    problematic_fields[key] = str(type(value))

            return Response({
                "error": f"JSON serialization error: {str(e)}",
                "problematic_fields": problematic_fields
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        data = request.data.copy()
        current_attendees_data = data.pop("current_attendees", None)
        serializer = EventSerializer(event, data=data, partial=True)

        if serializer.is_valid():
            log_entry = ActivityLog.objects.create(
                action_type="Update",
                target_type="Event",
                target_id=event.id,
                target_name=event.title,
                performed_by=user,
                timestamp=timezone.now(),
                reason=data.get('reason', 'Admin update of event details'),
                expiration_date=timezone.now() + timedelta(days=30),
                original_data=original_data_json
            )

            serializer.save()

            if current_attendees_data is not None:
                event.current_attendees.set(current_attendees_data)

            ActivityLog.delete_expired_logs()

            return Response({
                "message": "Event details updated successfully.",
                "data": serializer.data
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AdminManageAdminDetailsView(APIView):
    """
    API View for admins to view and super admins to manage other admin users' details.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, admin_id):
        user = request.user
        if user.role != "admin":
            return Response({"error": "Only admin users can access this endpoint."}, status=status.HTTP_403_FORBIDDEN)
        admin = User.objects.filter(id=admin_id, role="admin").first()
        if not admin:
            return Response({"error": "Admin user not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = AdminSerializer(admin)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, admin_id):
        user = request.user
        if not user.is_super_admin:
            return Response({"error": "Only super admins can update admin details."}, status=status.HTTP_403_FORBIDDEN)
        
        admin = User.objects.filter(id=admin_id, role="admin").first()
        if not admin:
            return Response({"error": "Admin user not found."}, status=status.HTTP_404_NOT_FOUND)
        original_data = {}
        
        for field in admin._meta.fields:
            field_name = field.name
            if field_name not in ['id', 'password']:
                value = getattr(admin, field_name)
                
                if isinstance(value, datetime):
                    original_data[field_name] = value.isoformat()
                elif isinstance(value, date) and not isinstance(value, datetime):
                    original_data[field_name] = value.isoformat()
                elif isinstance(value, time):
                    original_data[field_name] = value.strftime('%H:%M:%S')
                elif isinstance(value, timedelta):
                    original_data[field_name] = value.total_seconds()
                elif hasattr(value, 'id') and not isinstance(value, (list, dict)):
                    original_data[field_name] = value.id
                elif hasattr(value, 'url') and hasattr(value, 'name'):
                    original_data[field_name] = value.name if value.name else None
                else:
                    original_data[field_name] = value
        
        for field in admin._meta.many_to_many:
            field_name = field.name
            related_ids = [item.id for item in getattr(admin, field_name).all()]
            original_data[field_name] = related_ids
        
        try:
            original_data_json = json.dumps(original_data)
        except TypeError as e:
            problematic_fields = {}
            for key, value in original_data.items():
                try:
                    json.dumps({key: value})
                except TypeError:
                    problematic_fields[key] = str(type(value))
            
            return Response({
                "error": f"JSON serialization error: {str(e)}",
                "problematic_fields": problematic_fields
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        data = request.data.copy()
        
        following_data = data.pop("following", None)
        followers_data = data.pop("followers", None)
        
        serializer = AdminSerializer(admin, data=data, partial=True)
        
        if serializer.is_valid():
            log_entry = ActivityLog.objects.create(
                action_type="Update",
                target_type="Admin",
                target_id=admin.id,
                target_name=f"{admin.first_name} {admin.last_name}",
                performed_by=user,
                timestamp=timezone.now(),
                expiration_date=timezone.now() + timedelta(days=30),
                original_data=original_data_json
            )
            serializer.save()
            
            if following_data is not None:
                admin.following.set(following_data)
            
            if followers_data is not None:
                admin.followers.set(followers_data)
            
            ActivityLog.delete_expired_logs()
            
            return Response({
                "message": "Admin details updated successfully.",
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminRepliesListView(APIView):
    """
    API view for admins to view reports where students have replied but admin hasn't responded yet.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not (user.role == "admin" or user.is_super_admin):
            return Response({"error": "Only admins can access this endpoint."}, 
                            status=status.HTTP_403_FORBIDDEN)

        all_reports = AdminReportRequest.objects.all().order_by("-requested_at")

        reports_needing_attention = []

        for report in all_reports:
            replies = ReportReply.objects.filter(report=report).order_by('created_at')

            if replies.exists():
                latest_reply = replies.order_by('-created_at').first()

                if not latest_reply.is_admin_reply:
                    report_data = AdminReportRequestSerializer(report).data
                    if report.from_student:
                        report_data['from_student_name'] = report.from_student.get_full_name() or report.from_student.username
                    else:
                        report_data['from_student_name'] = "Unknown"
                    report_data['replies'] = ReportReplySerializer(replies, many=True).data
                    report_data['latest_reply'] = {
                        'content': latest_reply.content,
                        'created_at': latest_reply.created_at,
                        'replied_by': latest_reply.replied_by.get_full_name() if latest_reply.replied_by else "Unknown"
                    }
                    reports_needing_attention.append(report_data)

        return Response(reports_needing_attention, status=status.HTTP_200_OK)


class AdminSocietyDetailRequestView(APIView):
    """
    Detail request view for admins to approve/reject society detail change requests
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get all pending society detail requests (Admins only)."""
        _, error = get_admin_if_user_is_admin(
            request.user,
            "view pending society detail requests"
        )
        if error:
            return error

        pending_requests = SocietyRequest.objects.filter(
            intent="UpdateSoc", 
            approved=False
        )
        serializer = SocietyRequestSerializer(pending_requests, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, request_id):
        """Approve or reject a pending society detail request."""
        user, error = get_admin_if_user_is_admin(
            request.user,
            "approve or reject society detail requests")
        if error:
            return error

        society_request = get_object_or_404(SocietyRequest, id=request_id)

        status_update = request.data.get("status")
        if status_update not in ["Approved", "Rejected"]:
            return Response({"error": "Invalid status update."}, status=status.HTTP_400_BAD_REQUEST)

        if status_update == "Approved":
            society = society_request.society
            
            if society_request.name:
                society.name = society_request.name
            
            if society_request.description:
                society.description = society_request.description
            
            if society_request.category:
                society.category = society_request.category
            
            if society_request.social_media_links:
                society.social_media_links = society_request.social_media_links
            
            if society_request.membership_requirements:
                society.membership_requirements = society_request.membership_requirements
            
            if society_request.upcoming_projects_or_plans:
                society.upcoming_projects_or_plans = society_request.upcoming_projects_or_plans
            
            if society_request.icon:
                society.icon = society_request.icon
            
            society.save()

            society_request.approved = True

        society_request.save()

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "society_updates",
            {
                "type": "society_list_update",
                "message": f"Society detail request for {society_request.society.name} has been {status_update.lower()}.",
                "data": SocietyRequestSerializer(society_request).data,
                "status": status_update
            }
        )

        return Response(
            {"message": f"Society detail request {status_update.lower()} successfully."},
            status=status.HTTP_200_OK
        )


class AdminActivityLogView(APIView):
    """View for admins to access recent activity"""
    permission_classes = [IsAuthenticated]

    def get(self, request, log_id=None):
        """Gets all items in the ActivityLog"""
        logs = ActivityLog.objects.all().order_by('-timestamp')
        serializer = ActivityLogSerializer(logs, many=True)
        return Response(serializer.data)

    def delete(self, request, log_id):
        """Deletes entries in the ActivityLog"""
        _, error = get_admin_if_user_is_admin(request.user, "delete activity logs")
        if error:
            return error

        activity_log = ActivityLog.objects.filter(id=log_id).first()
        if not activity_log:
            return Response(
                {"error": "Activity log not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        activity_log.delete()
        return Response(
            {"message": "Activity log deleted successfully."},
            status=status.HTTP_200_OK
        )
