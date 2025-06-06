import json
from django.utils import timezone
from datetime import datetime, date, timedelta, time
from django.db.models.fields.files import ImageFieldFile
from django.forms.models import model_to_dict
from api.models_files.request_models import SocietyRequest
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from api.models import Event, Society, Student, User, ActivityLog
import time as time_module
from api.utils import *
from .admin_handle_student_views import StudentRestoreHandler, StudentUpdateUndoHandler
from .admin_handle_admin_views import AdminRestoreHandler, AdminUpdateUndoHandler
from .admin_handle_event_views import EventRestoreHandler, EventUpdateUndoHandler, EventStatusChangeUndoHandler
from .admin_handle_society_views import SocietyRestoreHandler, SocietyUpdateUndoHandler, SocietyStatusChangeUndoHandler
from api.views_files.view_utility import get_admin_if_user_is_admin, RestoreHandler, set_foreign_key_relationship, set_many_to_many_relationship
from django.db import transaction


class AdminBaseView(APIView):
    """Base class for admin operations with common utilities."""
    permission_classes = [IsAuthenticated]

    model_mapping = {
        "Student": Student,
        "Society": Society,
        "SocietyRequest": SocietyRequest,
        "Event": Event,
        "Admin": User,
    }

    def check_admin_permission(self, user):
        """Check if the user has admin permissions."""
        if not (user.role == "admin" or user.is_super_admin):
            return False
        return True
    
    def serialize_model_data(self, target):
        """Serialize model data in a JSON-compatible format."""
        original_data = model_to_dict(target)
        
        serializable_data = {}
        for key, value in original_data.items():
            try:
                if value is None:
                    serializable_data[key] = None
                elif isinstance(value, (datetime, date)):
                    serializable_data[key] = value.isoformat()
                elif isinstance(value, time):
                    serializable_data[key] = value.strftime("%H:%M:%S")
                elif isinstance(value, timedelta):
                    serializable_data[key] = str(value)
                elif isinstance(value, ImageFieldFile):
                    serializable_data[key] = value.url if value else None
                elif isinstance(value, (list, tuple, set)) and value and hasattr(next(iter(value), None), 'email'):
                    serializable_data[key] = [item.email if hasattr(item, 'email') else str(item) for item in value]
                elif hasattr(value, 'email'):
                    serializable_data[key] = value.email
                elif hasattr(value, 'all'):
                    try:
                        related_items = list(value.all())
                        if related_items and hasattr(related_items[0], 'email'):
                            serializable_data[key] = [item.email for item in related_items]
                        else:
                            serializable_data[key] = [str(item) for item in related_items]
                    except Exception:
                        # If accessing related items fails, just use a string representation
                        serializable_data[key] = f"<Related {key} items>"
                elif hasattr(value, 'pk'):
                    serializable_data[key] = str(value)
                # Handle dictionary values
                elif isinstance(value, dict):
                    try:
                        # Recursively serialize dictionary values
                        serializable_dict = {}
                        for dict_key, dict_value in value.items():
                            if isinstance(dict_value, (dict, list, tuple, set)):
                                serializable_dict[dict_key] = str(dict_value)
                            else:
                                serializable_dict[dict_key] = dict_value
                        serializable_data[key] = serializable_dict
                    except Exception:
                        serializable_data[key] = str(value)
                # Default case - directly assign the value
                else:
                    serializable_data[key] = value
                    
                # Final check: Test if the value is JSON serializable
                json.dumps(serializable_data[key])
                    
            except (TypeError, OverflowError, ValueError):
                # If any error occurs during serialization, convert to string
                serializable_data[key] = str(value)
        
        return serializable_data


class AdminDeleteView(AdminBaseView):
    def delete(self, request, target_type, target_id):
        target_type = target_type.capitalize()
        admin, error = get_admin_if_user_is_admin(request.user, "delete resources")
        if error:
            return error

        if target_type == "Admin":
            if not request.user.is_super_admin:
                return Response(
                    {"error": "Only super admins can delete admin users."}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            if int(target_id) == request.user.id:
                return Response(
                    {"error": "You cannot delete your own account."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

        model = self.model_mapping.get(target_type)
        if not model:
            return Response(
                {"error": "Invalid target type."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if target_type == "Admin":
            target = model.objects.filter(id=target_id, role="admin").first()
        else:
            target = model.objects.filter(id=target_id).first()

        if not target:
            return Response(
                {"error": f"{target_type} not found."}, 
                status=status.HTTP_404_NOT_FOUND
            )

        reason = request.data.get('reason')
        if not reason:
            return Response(
                {"error": "Reason for deletion is required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            serializable_data = self.serialize_model_data(target)
            original_data_json = json.dumps(serializable_data)
        except TypeError as e:
            return Response({
                "error": f"Serialization error: {str(e)}",
                "details": "Cannot serialize data for activity log"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if target_type == "Admin":
            target_name = f"{target.first_name} {target.last_name}".strip()
        else:
            target_name = str(target)

        ActivityLog.objects.create(
            action_type="Delete",
            target_type=target_type,
            target_id=target_id,
            target_name=target_name,
            performed_by=admin,
            timestamp=timezone.now(),
            reason=reason,
            expiration_date=timezone.now() + timedelta(days=30),
            original_data=original_data_json,
        )
        
        try:
            if target_type == "Student":
                self.handle_student_deletion(target)
            elif target_type == "Society":
                self.handle_society_deletion(target)
            else:
                target.delete()
                
            ActivityLog.delete_expired_logs()
            
            return Response(
                {"message": f"Deleted {target_type.lower()} moved to Activity Log."}, 
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to delete {target_type}: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def handle_student_deletion(self, student):
        with transaction.atomic():
            if hasattr(student, 'president_of') and student.president_of:
                society = student.president_of
                society.president = None
                society.save()
            
            if hasattr(student, 'societies'):
                student.societies.clear()
            
            if hasattr(student, 'attended_events'):
                student.attended_events.clear()
            
            if hasattr(student, 'follower'):
                student.follower.clear()
                
            if hasattr(student, 'following'):
                student.following.clear()
            
            student.delete()
            
    def handle_society_deletion(self, society):
        with transaction.atomic():
            if society.president:
                student = society.president
                if hasattr(student, 'president_of') and student.president_of == society:
                    student.president_of = None
                    student.save()
            
            society.delete()


class AdminRestoreView(AdminBaseView):
    """View for admins to restore deleted resources from activity logs."""

    def post(self, request, log_id):
        """Handle restore/undo requests for various actions."""
        admin, error = get_admin_if_user_is_admin(request.user, "restore resources")
        if error:
            return error
        try:
            log_entry = ActivityLog.objects.get(id=log_id)
            target_type = log_entry.target_type

            if target_type == "Admin":
                if not request.user.is_authenticated or not request.user.is_super_admin:
                    return Response(
                        {"error": "Only super admins can undo operations related to admins."}, 
                        status=status.HTTP_403_FORBIDDEN
                    )

            supported_actions = ["Delete", "Approve", "Reject", "Update"]
            original_data = {}
            if log_entry.action_type in ["Delete", "Update"]:
                if not log_entry.original_data:
                    return Response({"error": "No original data found for restoration."}, status=status.HTTP_400_BAD_REQUEST)
                try:
                    original_data = json.loads(log_entry.original_data)
                except json.JSONDecodeError:
                    return Response({"error": "Error decoding original data."}, status=status.HTTP_400_BAD_REQUEST)
            elif log_entry.original_data:
                try:
                    original_data = json.loads(log_entry.original_data)
                except json.JSONDecodeError:
                    pass

            model = self.model_mapping.get(target_type)
            if not model:
                return Response({"error": "Unsupported target type."}, status=status.HTTP_400_BAD_REQUEST)

            handler_factory = RestoreHandlerFactory()
            handler = handler_factory.get_handler(log_entry.action_type, target_type)
            
            if handler:
                return handler.handle(original_data, log_entry)
            else:
                return Response(
                    {"error": f"Unsupported operation: {log_entry.action_type} for {target_type}"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except ActivityLog.DoesNotExist:
            return Response({"error": "Log entry not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RestoreHandlerFactory:
    """Factory to create the appropriate restore handler based on action and target."""
    def get_handler(self, action_type, target_type):
        """Get the appropriate handler for the given action and target type."""
        handlers = {
            ("Delete", "Student"): StudentRestoreHandler(),
            ("Delete", "Society"): SocietyRestoreHandler(),
            ("Delete", "Event"): EventRestoreHandler(),
            ("Delete", "Admin"): AdminRestoreHandler(),
            
            ("Update", "Student"): StudentUpdateUndoHandler(),
            ("Update", "Society"): SocietyUpdateUndoHandler(),
            ("Update", "Event"): EventUpdateUndoHandler(),
            ("Update", "Admin"): AdminUpdateUndoHandler(),
            
            ("Approve", "SocietyRequest"): SocietyStatusChangeUndoHandler(),
            ("Reject", "SocietyRequest"): SocietyStatusChangeUndoHandler(),
            ("Update", "SocietyRequest"): SocietyStatusChangeUndoHandler(),
            ("Approve", "Event"): EventStatusChangeUndoHandler(),
            ("Reject", "Event"): EventStatusChangeUndoHandler(),
        }
        
        return handlers.get((action_type, target_type))