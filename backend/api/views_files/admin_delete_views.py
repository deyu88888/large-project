import json
from django.utils import timezone
from datetime import datetime, date, timedelta, time
from django.db.models.fields.files import ImageFieldFile
from django.forms.models import model_to_dict
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from api.models import Event, Society, Student, User, ActivityLog
import time as time_module
from api.utils import *
from .admin_handle_event_views import EventRestoreHandler, EventUpdateUndoHandler, EventStatusChangeUndoHandler
from .admin_handle_society_views import SocietyRestoreHandler, SocietyUpdateUndoHandler, SocietyStatusChangeUndoHandler
from api.views_files.view_utility import get_admin_if_user_is_admin, RestoreHandler, set_foreign_key_relationship, set_many_to_many_relationship

class AdminBaseView(APIView):
    """Base class for admin operations with common utilities."""
    permission_classes = [IsAuthenticated]

    model_mapping = {
        "Student": Student,
        "Society": Society,
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
            elif isinstance(value, (list, tuple)) and value and hasattr(value[0], 'email'):
                serializable_data[key] = [item.email if hasattr(item, 'email') else str(item) for item in value]
            elif hasattr(value, 'email'):
                serializable_data[key] = value.email
            elif hasattr(value, 'all'):
                related_items = list(value.all())
                if related_items and hasattr(related_items[0], 'email'):
                    serializable_data[key] = [item.email for item in related_items]
                else:
                    serializable_data[key] = [str(item) for item in related_items]
            elif hasattr(value, 'pk'):
                serializable_data[key] = str(value)
            else:
                serializable_data[key] = value
        
        return serializable_data


class AdminDeleteView(AdminBaseView):
    """View for admins to delete students, societies, events, and other admins."""

    def delete(self, request, target_type, target_id):
        """Handle resource deletion and log the action."""
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
        
        target.delete()
        ActivityLog.delete_expired_logs()

        return Response(
            {"message": f"Deleted {target_type.lower()} moved to Activity Log."}, 
            status=status.HTTP_200_OK
        )


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
            if log_entry.action_type not in supported_actions:
                return Response({"error": "Invalid action type."}, status=status.HTTP_400_BAD_REQUEST)
            
            if log_entry.action_type in ["Delete", "Update"]:
                original_data_json = log_entry.original_data

                if not original_data_json:
                    return Response({"error": "No original data found for restoration."}, status=status.HTTP_400_BAD_REQUEST)

                try:
                    original_data = json.loads(original_data_json)
                except json.JSONDecodeError:
                    return Response({"error": "Error decoding original data."}, status=status.HTTP_400_BAD_REQUEST)
            else:
                # For Approve/Reject, we don't necessarily need original data
                original_data = {}
                if log_entry.original_data:
                    try:
                        original_data = json.loads(log_entry.original_data)
                    except json.JSONDecodeError:
                        pass

            model = self.model_mapping.get(target_type)
            if not model:
                return Response({"error": "Unsupported target type."}, status=status.HTTP_400_BAD_REQUEST)

            # Route to appropriate handler based on action type and target type
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
            # Deletion handlers
            ("Delete", "Student"): StudentRestoreHandler(),
            ("Delete", "Society"): SocietyRestoreHandler(),
            ("Delete", "Event"): EventRestoreHandler(),
            
            # Update handlers
            ("Update", "Society"): SocietyUpdateUndoHandler(),
            ("Update", "Event"): EventUpdateUndoHandler(),
            
            # Status change handlers (Approve/Reject)
            ("Approve", "Society"): SocietyStatusChangeUndoHandler(),
            ("Reject", "Society"): SocietyStatusChangeUndoHandler(),
            ("Approve", "Event"): EventStatusChangeUndoHandler(),
            ("Reject", "Event"): EventStatusChangeUndoHandler(),
        }
        
        return handlers.get((action_type, target_type))


class StudentRestoreHandler(RestoreHandler):
    """Handler for restoring deleted students."""
    def handle(self, original_data, log_entry):
        """Restore a deleted student."""
        try:
            user_data = {
                'username': original_data.get('username'),
                'email': original_data.get('email'),
                'first_name': original_data.get('first_name'),
                'last_name': original_data.get('last_name'),
                'is_active': original_data.get('is_active', True),
                'role': original_data.get('role', 'student'),
            }
            
            user_id = original_data.get('id')
            email = user_data.get('email')
            username = user_data.get('username')
            
            user = None
            if user_id:
                try:
                    user = User.objects.filter(id=int(user_id)).first()
                except (ValueError, TypeError):
                    pass
                    
            if not user and email:
                user = User.objects.filter(email=email).first()
                
            if not user and username:
                user = User.objects.filter(username=username).first()
            
            if not user:
                if email:
                    while User.objects.filter(email=email).exists():
                        timestamp = int(time_module.time())
                        email_parts = email.split('@')
                        if len(email_parts) == 2:
                            email = f"{email_parts[0]}+{timestamp}@{email_parts[1]}"
                        else:
                            email = f"restored_{timestamp}@example.com"
                    user_data['email'] = email
                
                if username:
                    while User.objects.filter(username=username).exists():
                        timestamp = int(time_module.time())
                        username = f"{username}_{timestamp}"
                    user_data['username'] = username
                    
                user = User.objects.create(**user_data)

            student = Student.objects.filter(user_ptr=user).first()
            student_data = {k: v for k, v in original_data.items() if k not in [
                'id', 'username', 'email', 'first_name', 'last_name', 'is_active',
                'password', 'last_login', 'is_superuser', 'is_staff', 'date_joined',
                'groups', 'user_permissions', 'societies', 'attended_events', 'followers',
                'following', 'president_of', 'user_ptr', 'role'
            ]}
            
            if not student:
                
                student = Student(user_ptr_id=user.id)
                student.__dict__.update(user.__dict__)
                
                for key, value in student_data.items():
                    if value is not None:
                        setattr(student, key, value)
                
                # Save with raw=True to avoid problems with inheritance
                student.save_base(raw=True)
            else:
                for key, value in student_data.items():
                    if value is not None:
                        setattr(student, key, value)
                student.save()
            
            society_ids = original_data.get('societies', [])
            if society_ids:
                set_many_to_many_relationship(student, 'societies', society_ids, Society)

            event_ids = original_data.get('attended_events', [])
            if event_ids:
                set_many_to_many_relationship(student, 'attended_events', event_ids, Event)

            follower_ids = original_data.get('followers', [])
            if follower_ids:
                set_many_to_many_relationship(student, 'followers', follower_ids, User)

            following_ids = original_data.get('following', [])
            if following_ids:
                set_many_to_many_relationship(student, 'following', following_ids, User)
            
            set_foreign_key_relationship(student, 'president_of', original_data.get('president_of'), Society)
            student.save()
            
            log_entry.delete()
            return Response({"message": "Student restored successfully!"}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": f"Failed to restore Student: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)