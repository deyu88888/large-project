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
from .admin_handle_event_view import EventRestoreHandler, EventUpdateUndoHandler, EventStatusChangeUndoHandler
from .admin_handle_society_view import SocietyRestoreHandler, SocietyUpdateUndoHandler, SocietyStatusChangeUndoHandler
from api.utils import get_admin_if_user_is_admin

class AdminBaseView(APIView):
    """Base class for admin operations with common utilities."""
    permission_classes = [IsAuthenticated]

    model_mapping = {
        "Student": Student,
        "Society": Society,
        "Event": Event,
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
    """View for admins to delete students, societies, and events."""

    def delete(self, request, target_type, target_id):
        """Handle resource deletion and log the action."""
        admin, error = get_admin_if_user_is_admin(request.user, "delete resources")
        if error:
            return error

        model = self.model_mapping.get(target_type)
        if not model:
            return Response({"error": "Invalid target type."}, status=status.HTTP_400_BAD_REQUEST)

        target = model.objects.filter(id=target_id).first()
        if not target:
            return Response({"error": f"{target_type} not found."}, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get('reason', None)
        if not reason:
            return Response({"error": "Reason for deletion is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            serializable_data = self.serialize_model_data(target)
            original_data_json = json.dumps(serializable_data)
        except TypeError as e:
            return Response({
                "error": f"Serialization error: {str(e)}",
                "details": "Cannot serialize data for activity log"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        ActivityLog.objects.create(
            action_type="Delete",
            target_type=target_type,
            target_id=target_id,
            target_name=str(target),
            performed_by=admin,
            timestamp=timezone.now(),
            reason=reason,
            expiration_date=timezone.now() + timedelta(days=30),
            original_data=original_data_json,
        )
        
        target.delete()
        ActivityLog.delete_expired_logs()

        return Response({"message": f"Deleted {target_type.lower()} moved to Activity Log."}, status=status.HTTP_200_OK)


class AdminRestoreView(AdminBaseView):
    """View for admins to restore deleted resources from activity logs."""

    def post(self, request, log_id):
        """Handle restore/undo requests for various actions."""
        admin, error = get_admin_if_user_is_admin(request.user, "restore resources")
        if error:
            return error
        try:
            log_entry = ActivityLog.objects.get(id=log_id)

            # Check if the action type is supported
            supported_actions = ["Delete", "Approve", "Reject", "Update"]
            if log_entry.action_type not in supported_actions:
                return Response({"error": "Invalid action type."}, status=status.HTTP_400_BAD_REQUEST)

            target_type = log_entry.target_type
            
            # For Delete and Update actions, we need original data
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


# Handler implementations using Strategy Pattern
class RestoreHandler:
    """Base class for all restore handlers."""
    def handle(self, original_data, log_entry):
        """Handle restoration logic."""
        raise NotImplementedError("Subclasses must implement this method")


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
            # Extract basic fields for the User model - INCLUDE ROLE HERE
            user_data = {
                'username': original_data.get('username'),
                'email': original_data.get('email'),
                'first_name': original_data.get('first_name'),
                'last_name': original_data.get('last_name'),
                'is_active': original_data.get('is_active', True),
                'role': original_data.get('role', 'student'),
            }
            
            # Try to find existing user
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
            
            # If user doesn't exist, create a new one
            if not user:
                # Make email unique if needed
                if email:
                    while User.objects.filter(email=email).exists():
                        timestamp = int(time_module.time())
                        email_parts = email.split('@')
                        if len(email_parts) == 2:
                            email = f"{email_parts[0]}+{timestamp}@{email_parts[1]}"
                        else:
                            email = f"restored_{timestamp}@example.com"
                    user_data['email'] = email
                
                # Make username unique if needed
                if username:
                    while User.objects.filter(username=username).exists():
                        timestamp = int(time_module.time())
                        username = f"{username}_{timestamp}"
                    user_data['username'] = username
                    
                # Create new user
                user = User.objects.create(**user_data)
            
            # Check if student already exists for this user
            student = Student.objects.filter(user_ptr=user).first()
            
            # Prepare student-specific data - EXCLUDE ROLE
            student_data = {k: v for k, v in original_data.items() if k not in [
                'id', 'username', 'email', 'first_name', 'last_name', 'is_active',
                'password', 'last_login', 'is_superuser', 'is_staff', 'date_joined',
                'groups', 'user_permissions', 'societies', 'attended_events', 'followers',
                'following', 'president_of', 'user_ptr', 'role'
            ]}
            
            if not student:
                # Create new student using the proper inheritance approach
                from django.contrib.contenttypes.models import ContentType
                
                # Create student with proper User inheritance
                student = Student(user_ptr_id=user.id)
                student.__dict__.update(user.__dict__)
                
                # Apply student-specific fields
                for key, value in student_data.items():
                    if value is not None:  # Only set non-None values
                        setattr(student, key, value)
                
                # Save with raw=True to avoid problems with inheritance
                student.save_base(raw=True)
            else:
                # Update existing student with student-specific fields
                for key, value in student_data.items():
                    if value is not None:  # Only set non-None values
                        setattr(student, key, value)
                student.save()
            
            # Handle M2M relationships using .set() method
            society_ids = original_data.get('societies', [])
            if society_ids:
                try:
                    societies = []
                    for society_id in society_ids:
                        try:
                            society = Society.objects.get(id=int(society_id))
                            societies.append(society)
                        except (Society.DoesNotExist, ValueError, TypeError):
                            pass
                    student.societies.set(societies)
                except Exception:
                    pass
            
            event_ids = original_data.get('attended_events', [])
            if event_ids:
                try:
                    events = []
                    for event_id in event_ids:
                        try:
                            event = Event.objects.get(id=int(event_id))
                            events.append(event)
                        except (Event.DoesNotExist, ValueError, TypeError):
                            pass
                    student.attended_events.set(events)
                except Exception:
                    pass
            
            follower_ids = original_data.get('followers', [])
            if follower_ids:
                try:
                    followers = []
                    for follower_id in follower_ids:
                        try:
                            follower = User.objects.get(id=int(follower_id))
                            followers.append(follower)
                        except (User.DoesNotExist, ValueError, TypeError):
                            pass
                    student.followers.set(followers)
                except Exception:
                    pass
            
            # Add handling for following relationship
            following_ids = original_data.get('following', [])
            if following_ids:
                try:
                    following = []
                    for following_id in following_ids:
                        try:
                            follow_user = User.objects.get(id=int(following_id))
                            following.append(follow_user)
                        except (User.DoesNotExist, ValueError, TypeError):
                            pass
                    student.following.set(following)
                except Exception:
                    pass
            
            # Handle president_of relationship
            president_of_id = original_data.get('president_of')
            if president_of_id:
                try:
                    society = Society.objects.get(id=int(president_of_id))
                    student.president_of = society
                    student.save()
                except (Society.DoesNotExist, ValueError, TypeError):
                    pass
            
            log_entry.delete()  # Remove log after restoration
            return Response({"message": "Student restored successfully!"}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": f"Failed to restore Student: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



