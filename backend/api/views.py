import logging
import json
from django.utils import timezone
from datetime import datetime, date, timedelta, time
from django.db.models.fields.files import ImageFieldFile
from django.db.models import ForeignKey, ManyToManyField
from django.forms.models import model_to_dict
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.auth import authenticate
from django.db.models import Count, Sum
from django.utils.timezone import now, make_aware
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.views.static import serve
from rest_framework import generics, status
import traceback
import sys
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser, BasePermission
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from api.models import AdminReportRequest, Event, Notification, Society, Student, User, Award, AwardStudent, \
    UserRequest, DescriptionRequest, Comment, ActivityLog, ReportReply, SocietyRequest, \
    NewsPublicationRequest, BroadcastMessage, SocietyNews
from api.serializers import (
    AdminReportRequestSerializer,
    BroadcastSerializer,
    DashboardNotificationSerializer,
    DashboardStatisticSerializer,
    EventCalendarSerializer,
    EventRequestSerializer,
    EventSerializer,
    JoinSocietySerializer,
    LeaveSocietySerializer,
    NotificationSerializer,
    RecentActivitySerializer,
    RSVPEventSerializer,
    SocietyRequestSerializer,
    SocietySerializer,
    StartSocietyRequestSerializer,
    StudentSerializer,
    UserSerializer,
    AwardSerializer,
    AwardStudentSerializer,
    PendingMemberSerializer,
    DescriptionRequestSerializer, 
    CommentSerializer,
    ActivityLogSerializer,
    ReportReplySerializer,
    NewsPublicationRequestSerializer,
)
from api.utils import *
from django.db.models import Q


class AdminDeleteView(APIView):
    """
    View for admins to delete students, societies, and events
    """
    permission_classes = [IsAuthenticated]

    model_mapping = {
        "Student": Student,
        "Society": Society,
        "Event": Event,
    }

    def delete(self, request, target_type, target_id):
        user = request.user
        if not (user.role == "admin" or user.is_super_admin):
            return Response({"error": "Only admins can delete resources."}, status=status.HTTP_403_FORBIDDEN)

        model = self.model_mapping.get(target_type)
        if not model:
            return Response({"error": "Invalid target type."}, status=status.HTTP_400_BAD_REQUEST)

        target = model.objects.filter(id=target_id).first()
        if not target:
            return Response({"error": f"{target_type} not found."}, status=status.HTTP_404_NOT_FOUND)

        original_data = model_to_dict(target)

        reason = request.data.get('reason', None)  # Extract the reason (it might be optional)
        if not reason:
            return Response({"error": "Reason for deletion is required."}, status=status.HTTP_400_BAD_REQUEST)

        
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
        
        try:
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
            performed_by=user,
            timestamp=timezone.now(),
            reason=reason,
            expiration_date=timezone.now() + timedelta(days=30),
            original_data=original_data_json,
        )
        target.delete()
        ActivityLog.delete_expired_logs()

        return Response({"message": f"Deleted {target_type.lower()} moved to Activity Log."}, status=status.HTTP_200_OK)

    def post(self, request, log_id):
        """
        Handle undo requests for various actions (Delete, Approve, Reject, Update)
        """
        try:
            log_entry = ActivityLog.objects.get(id=log_id)

            # Check if the action type is supported
            supported_actions = ["Delete", "Approve", "Reject", "Update"]
            if log_entry.action_type not in supported_actions:
                return Response({"error": "Invalid action type."}, status=status.HTTP_400_BAD_REQUEST)

            target_type = log_entry.target_type
            
            # For Delete and Update actions, we need original data
            if log_entry.action_type in ["Delete", "Update"]:
                original_data_json = log_entry.original_data  # Get JSON string

                if not original_data_json:
                    return Response({"error": "No original data found for restoration."}, status=status.HTTP_400_BAD_REQUEST)

                try:
                    original_data = json.loads(original_data_json)  # Convert back to dict
                except json.JSONDecodeError:
                    return Response({"error": "Error decoding original data."}, status=status.HTTP_400_BAD_REQUEST)
            else:
                # For Approve/Reject, we don't necessarily need original data
                original_data = {}
                if log_entry.original_data:
                    try:
                        original_data = json.loads(log_entry.original_data)
                    except json.JSONDecodeError:
                        pass  # Just use empty dict if we can't parse it

            model = self.model_mapping.get(target_type)

            if not model:
                return Response({"error": "Unsupported target type."}, status=status.HTTP_400_BAD_REQUEST)

            # Process restoration based on action type and target type
            if log_entry.action_type == "Delete":
                # Handle delete undos
                if target_type == "Student":
                    return self._restore_student(original_data, log_entry)
                elif target_type == "Society":
                    return self._restore_society(original_data, log_entry)
                elif target_type == "Event":
                    return self._restore_event(original_data, log_entry)
                else:
                    return Response({"error": "Unsupported target type."}, status=status.HTTP_400_BAD_REQUEST)
            elif log_entry.action_type == "Update":
                # Handle update undos
                if target_type == "Society":
                    return self._undo_society_update(original_data, log_entry)
                elif target_type == "Event":
                    return self._undo_event_update(original_data, log_entry)
                else:
                    return Response({"error": "Unsupported target type for this action."}, status=status.HTTP_400_BAD_REQUEST)
            elif log_entry.action_type in ["Approve", "Reject"]:
                # Handle approve/reject undos
                if target_type == "Society":
                    return self._undo_society_status_change(original_data, log_entry)
                elif target_type == "Event":
                    return self._undo_event_status_change(original_data, log_entry)
                else:
                    return Response({"error": "Unsupported target type for this action."}, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({"error": "Unsupported action type."}, status=status.HTTP_400_BAD_REQUEST)
                
        except ActivityLog.DoesNotExist:
            return Response({"error": "Log entry not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _undo_society_update(self, original_data, log_entry):
        """Handle undoing society detail updates with comprehensive relationship handling"""
        try:
            # Find the society
            society_id = log_entry.target_id
            society = Society.objects.filter(id=society_id).first()
            
            if not society:
                society_name = log_entry.target_name
                society = Society.objects.filter(name=society_name).first()
                
            if not society:
                return Response({"error": "Society not found."}, status=status.HTTP_404_NOT_FOUND)
            
            # Define all special fields that need specialized treatment
            many_to_many_fields = ['society_members', 'tags', 'showreel_images']
            foreign_key_fields = ['leader', 'vice_president', 'event_manager', 'treasurer', 'approved_by']
            complex_json_fields = ['social_media_links']
            
            # Create a working copy of the original data
            data = original_data.copy()
            
            # First, apply simple fields that don't involve relationships
            for key, value in data.items():
                if (key not in many_to_many_fields and 
                    key not in foreign_key_fields and 
                    key not in complex_json_fields):
                    if hasattr(society, key) and value is not None:
                        setattr(society, key, value)
            
            # Handle complex JSON fields
            if 'social_media_links' in data and isinstance(data['social_media_links'], dict):
                society.social_media_links = data['social_media_links']
            
            # Save basic field changes
            society.save()
            
            # Handle the approved_by field specifically
            if 'approved_by' in data and data['approved_by']:
                admin_id = data['approved_by']
                try:
                    from users.models import Admin
                    admin_obj = Admin.objects.get(id=admin_id)
                    society.approved_by = admin_obj
                    society.save()
                except Exception as e:
                    print(f"Error setting approved_by: {str(e)}")
            
            # Handle student role foreign keys
            for role in ['leader', 'vice_president', 'event_manager']:
                if role in data and data[role] and isinstance(data[role], dict):
                    role_id = data[role].get('id')
                    if role_id:
                        setattr(society, f"{role}_id", role_id)
            
            # Save after setting foreign keys
            society.save()
            
            # Handle society_members (many-to-many)
            if 'society_members' in data and isinstance(data['society_members'], list):
                society.society_members.clear()
                for member_id in data['society_members']:
                    try:
                        # Assuming Student model is imported or accessible
                        from users.models import Student
                        student = Student.objects.get(id=member_id)
                        society.society_members.add(student)
                    except Exception as e:
                        print(f"Error adding member {member_id}: {str(e)}")
            
            # Handle tags (many-to-many)
            if 'tags' in data and isinstance(data['tags'], list):
                society.tags.clear()
                for tag_value in data['tags']:
                    # Tags might be complex - handle different possible formats
                    try:
                        # If it's a JSON string within the list (unusual but possible)
                        if isinstance(tag_value, str) and tag_value.startswith('['):
                            import json
                            tag_objects = json.loads(tag_value)
                            # Now handle tag_objects appropriately...
                            # This depends on your tag model structure
                        # If it's a direct tag ID
                        else:
                            society.tags.add(tag_value)
                    except Exception as e:
                        print(f"Error adding tag {tag_value}: {str(e)}")
            
            # Handle showreel_images (many-to-many or similar)
            if 'showreel_images' in data:
                # You may need specialized handling depending on exactly what showreel_images is
                try:
                    # If it's a clear/add situation:
                    society.showreel_images.clear()
                    if data['showreel_images'] and isinstance(data['showreel_images'], list):
                        for image in data['showreel_images']:
                            society.showreel_images.add(image)
                except Exception as e:
                    print(f"Error handling showreel_images: {str(e)}")
            
            # Final save after all relationships are set
            society.save()
            
            # Delete the log entry
            log_entry.delete()
            
            return Response({"message": "Society update undone successfully!"}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                "error": f"Failed to undo Society update: {str(e)}",
                "original_data_content": original_data
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def _undo_society_status_change(self, original_data, log_entry):
        """Handle undoing society status changes (approve/reject)"""
        try:
            # Find the society by ID
            society_id = log_entry.target_id
            society = Society.objects.filter(id=society_id).first()
            
            if not society:
                # Try to find by name if the ID doesn't work
                society_name = log_entry.target_name
                society = Society.objects.filter(name=society_name).first()
                
            if not society:
                return Response({"error": "Society not found."}, status=status.HTTP_404_NOT_FOUND)
            
            # Simply set the status back to Pending regardless of original data
            society.status = "Pending"
            
            # If there was an approved_by field and we're undoing an approval, clear it
            if log_entry.action_type == "Approve" and hasattr(society, 'approved_by'):
                society.approved_by = None
            
            society.save()
            
            # Create a new activity log for this undo action
            ActivityLog.objects.create(
                action_type="Update",
                target_type="Society",
                target_id=society.id,
                target_name=society.name,
                performed_by=log_entry.performed_by,  # Use the same user who performed the original action
                timestamp=timezone.now(),
                expiration_date=timezone.now() + timedelta(days=30),
            )
            
            # Delete the original log entry
            log_entry.delete()
            
            return Response({
                "message": "Society status change undone successfully. Status set back to Pending."
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response({"error": f"Failed to undo society status change: {str(e)}"}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _undo_event_update(self, original_data, log_entry):
        """Handle undoing event detail updates with comprehensive relationship handling"""
        try:
            # Find the event
            event_id = log_entry.target_id
            event = Event.objects.filter(id=event_id).first()
            
            if not event:
                event_name = log_entry.target_name
                event = Event.objects.filter(title=event_name).first()
                
            if not event:
                return Response({"error": "Event not found."}, status=status.HTTP_404_NOT_FOUND)
            
            # Define all special fields that need specialized treatment
            many_to_many_fields = ['attendees', 'tags', 'images', 'current_attendees']
            foreign_key_fields = ['society', 'organizer', 'approved_by', 'hosted_by']
            complex_json_fields = ['location_details']
            date_fields = ['date']
            time_fields = ['start_time']
            timedelta_fields = ['duration']
            
            # Create a working copy of the original data
            data = original_data.copy()
            
            # Process date fields
            for field_name in date_fields:
                if field_name in data and data[field_name]:
                    try:
                        # Convert string date back to date object
                        date_str = data[field_name]
                        date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
                        setattr(event, field_name, date_obj)
                    except Exception as e:
                        print(f"Error restoring date field {field_name}: {str(e)}")
            
            # Process time fields
            for field_name in time_fields:
                if field_name in data and data[field_name]:
                    try:
                        # Convert string time back to time object
                        time_str = data[field_name]
                        hour, minute, second = map(int, time_str.split(':'))
                        time_obj = time(hour, minute, second)
                        setattr(event, field_name, time_obj)
                    except Exception as e:
                        print(f"Error restoring time field {field_name}: {str(e)}")
            
            # Process timedelta fields
            for field_name in timedelta_fields:
                if field_name in data and data[field_name] is not None:
                    try:
                        # Convert seconds back to timedelta
                        seconds = float(data[field_name])
                        delta = timedelta(seconds=seconds)
                        setattr(event, field_name, delta)
                    except Exception as e:
                        print(f"Error restoring timedelta field {field_name}: {str(e)}")
            
            # Apply simple fields that don't involve relationships
            for key, value in data.items():
                if (key not in many_to_many_fields and 
                    key not in foreign_key_fields and 
                    key not in complex_json_fields and
                    key not in date_fields and
                    key not in time_fields and
                    key not in timedelta_fields):
                    if hasattr(event, key) and value is not None:
                        setattr(event, key, value)
            
            # Handle complex JSON fields
            if 'location_details' in data and isinstance(data['location_details'], dict):
                event.location_details = data['location_details']
            
            # Save basic field changes
            event.save()
            
            # Handle the approved_by field specifically
            if 'approved_by' in data and data['approved_by']:
                admin_id = data['approved_by']
                try:
                    from users.models import Admin
                    admin_obj = Admin.objects.get(id=admin_id)
                    event.approved_by = admin_obj
                    event.save()
                except Exception as e:
                    print(f"Error setting approved_by: {str(e)}")
            
            # Handle society foreign key
            if 'society' in data and data['society']:
                try:
                    society_id = data['society'] if isinstance(data['society'], int) else data['society'].get('id')
                    if society_id:
                        event.society_id = society_id
                except Exception as e:
                    print(f"Error setting society: {str(e)}")
            
            # Handle organizer foreign key
            if 'organizer' in data and data['organizer']:
                try:
                    organizer_id = data['organizer'] if isinstance(data['organizer'], int) else data['organizer'].get('id')
                    if organizer_id:
                        event.organizer_id = organizer_id
                except Exception as e:
                    print(f"Error setting organizer: {str(e)}")
                    
            # Handle hosted_by foreign key
            if 'hosted_by' in data and data['hosted_by']:
                try:
                    society_id = data['hosted_by'] if isinstance(data['hosted_by'], int) else data['hosted_by'].get('id')
                    if society_id:
                        event.hosted_by_id = society_id
                except Exception as e:
                    print(f"Error setting hosted_by: {str(e)}")
            
            # Save after setting foreign keys
            event.save()
            
            # Handle attendees (many-to-many)
            if 'attendees' in data and isinstance(data['attendees'], list):
                event.attendees.clear()
                for attendee_id in data['attendees']:
                    try:
                        from users.models import Student
                        student = Student.objects.get(id=attendee_id)
                        event.attendees.add(student)
                    except Exception as e:
                        print(f"Error adding attendee {attendee_id}: {str(e)}")
            
            # Handle current_attendees (many-to-many)
            if 'current_attendees' in data and isinstance(data['current_attendees'], list):
                event.current_attendees.clear()
                for attendee_id in data['current_attendees']:
                    try:
                        from users.models import Student
                        student = Student.objects.get(id=attendee_id)
                        event.current_attendees.add(student)
                    except Exception as e:
                        print(f"Error adding current attendee {attendee_id}: {str(e)}")
            
            # Handle tags (many-to-many)
            if 'tags' in data and isinstance(data['tags'], list):
                event.tags.clear()
                for tag_value in data['tags']:
                    try:
                        event.tags.add(tag_value)
                    except Exception as e:
                        print(f"Error adding tag {tag_value}: {str(e)}")
            
            # Handle images (many-to-many or similar)
            if 'images' in data:
                try:
                    event.images.clear()
                    if data['images'] and isinstance(data['images'], list):
                        for image in data['images']:
                            event.images.add(image)
                except Exception as e:
                    print(f"Error handling images: {str(e)}")
            
            # Final save after all relationships are set
            event.save()
            
            # Delete the log entry
            log_entry.delete()
            
            return Response({"message": "Event update undone successfully!"}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                "error": f"Failed to undo Event update: {str(e)}",
                "original_data_content": original_data
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _undo_event_status_change(self, original_data, log_entry):
        """Handle undoing event status changes (approve/reject)"""
        try:
            # Find the event by ID
            event_id = log_entry.target_id
            event = Event.objects.filter(id=event_id).first()
            
            if not event:
                # Try to find by name if the ID doesn't work
                event_name = log_entry.target_name
                event = Event.objects.filter(name=event_name).first()
                
            if not event:
                return Response({"error": "Event not found."}, status=status.HTTP_404_NOT_FOUND)
            
            # Simply set the status back to Pending regardless of original data
            event.status = "Pending"
            
            # If there was an approved_by field and we're undoing an approval, clear it
            if log_entry.action_type == "Approve" and hasattr(event, 'approved_by'):
                event.approved_by = None
            
            event.save()
            
            # Create a new activity log for this undo action
            ActivityLog.objects.create(
                action_type="Update",
                target_type="Event",
                target_id=event.id,
                target_name=event.name,
                performed_by=log_entry.performed_by,  # Use the same user who performed the original action
                timestamp=timezone.now(),
                expiration_date=timezone.now() + timedelta(days=30),
            )
            
            # Delete the original log entry
            log_entry.delete()
            
            return Response({
                "message": "Event status change undone successfully. Status set back to Pending."
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response({"error": f"Failed to undo event status change: {str(e)}"}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _restore_student(self, original_data, log_entry):
        """Handle student restoration"""
        try:
            # Extract basic fields for the User model - INCLUDE ROLE HERE
            user_data = {
                'username': original_data.get('username'),
                'email': original_data.get('email'),
                'first_name': original_data.get('first_name'),
                'last_name': original_data.get('last_name'),
                'is_active': original_data.get('is_active', True),
                'role': original_data.get('role', 'student'),  # Make sure role goes in User model
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
                        timestamp = int(time.time())
                        email_parts = email.split('@')
                        if len(email_parts) == 2:
                            email = f"{email_parts[0]}+{timestamp}@{email_parts[1]}"
                        else:
                            email = f"restored_{timestamp}@example.com"
                    user_data['email'] = email
                
                # Make username unique if needed
                if username:
                    while User.objects.filter(username=username).exists():
                        timestamp = int(time.time())
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
                'following', 'president_of', 'user_ptr', 'role'  # Exclude role from student data
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

    def _restore_society(self, original_data, log_entry):
        """Handle society restoration"""
        try:
            # Extract basic fields for Society
            society_data = {k: v for k, v in original_data.items() if k not in [
                'id', 'president', 'vice_president', 'treasurer', 'event_manager', 
                'leader', 'approved_by', 'members', 'society_members', 'events'
            ]}
            
            # Create the society without relationship fields first
            society = Society.objects.create(**society_data)
            
            # Handle ForeignKey relationships
            president_id = original_data.get('president')
            if president_id:
                try:
                    president = Student.objects.get(id=int(president_id))
                    society.president = president
                except (Student.DoesNotExist, ValueError, TypeError):
                    pass
            
            vice_president_id = original_data.get('vice_president')
            if vice_president_id:
                try:
                    vice_president = Student.objects.get(id=int(vice_president_id))
                    society.vice_president = vice_president
                except (Student.DoesNotExist, ValueError, TypeError):
                    pass
            
            treasurer_id = original_data.get('treasurer')
            if treasurer_id:
                try:
                    treasurer = Student.objects.get(id=int(treasurer_id))
                    society.treasurer = treasurer
                except (Student.DoesNotExist, ValueError, TypeError):
                    pass
            
            event_manager_id = original_data.get('event_manager')
            if event_manager_id:
                try:
                    event_manager = Student.objects.get(id=int(event_manager_id))
                    society.event_manager = event_manager
                except (Student.DoesNotExist, ValueError, TypeError):
                    pass
            
            leader_id = original_data.get('leader')
            if leader_id:
                try:
                    leader = Student.objects.get(id=int(leader_id))
                    society.leader = leader
                except (Student.DoesNotExist, ValueError, TypeError):
                    pass
            
            approved_by_id = original_data.get('approved_by')
            if approved_by_id:
                try:
                    approved_by = Admin.objects.get(id=int(approved_by_id))
                    society.approved_by = approved_by
                except (Admin.DoesNotExist, ValueError, TypeError):
                    pass
            
            society.save()
            
            # Handle M2M relationships using .set() method
            member_ids = original_data.get('members', [])
            if member_ids:
                try:
                    members = []
                    for member_id in member_ids:
                        try:
                            member = Student.objects.get(id=int(member_id))
                            members.append(member)
                        except (Student.DoesNotExist, ValueError, TypeError):
                            pass
                    society.members.set(members)
                except Exception:
                    pass  # If this fails, continue with restoration
            
            # Handle society_members if it exists
            society_member_ids = original_data.get('society_members', [])
            if society_member_ids:
                try:
                    society_members = []
                    for member_id in society_member_ids:
                        try:
                            member = Student.objects.get(id=int(member_id))
                            society_members.append(member)
                        except (Student.DoesNotExist, ValueError, TypeError):
                            pass
                    society.society_members.set(society_members)
                except Exception:
                    pass  # If this fails, continue with restoration
            
            event_ids = original_data.get('events', [])
            if event_ids:
                try:
                    events = []
                    for event_id in event_ids:
                        try:
                            event = Event.objects.get(id=int(event_id))
                            events.append(event)
                        except (Event.DoesNotExist, ValueError, TypeError):
                            pass
                    society.events.set(events)
                except Exception:
                    pass  # If this fails, continue with restoration
            
            log_entry.delete()  # Remove log after restoration
            return Response({"message": "Society restored successfully!"}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": f"Failed to restore Society: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _restore_event(self, original_data, log_entry):
        """Handle event restoration"""
        try:
            # Extract basic fields for Event - excluding relationship fields
            event_data = {k: v for k, v in original_data.items() if k not in [
                'id', 'hosted_by', 'current_attendees', 'duration'  # Exclude duration for now
            ]}
            
            for field in ['date', 'start_time', 'end_time']:
                if field in event_data:
                    if event_data[field] and isinstance(event_data[field], str):
                        if field == 'date':
                            try:
                                event_data[field] = datetime.strptime(event_data[field], '%Y-%m-%d').date()
                            except ValueError:
                                event_data[field] = None
                        else:
                            try:
                                event_data[field] = datetime.strptime(event_data[field], '%H:%M:%S').time()
                            except ValueError:
                                event_data[field] = None
            
            event = Event.objects.create(**event_data)
            duration_str = original_data.get('duration')
            if duration_str:
                try:
                    if isinstance(duration_str, str):
                        if ',' in duration_str:
                            days_part, time_part = duration_str.split(',', 1)
                            days = int(days_part.strip().split()[0])
                            hours, minutes, seconds = map(int, time_part.strip().split(':'))
                            duration = timedelta(days=days, hours=hours, minutes=minutes, seconds=seconds)
                        else:
                            time_parts = duration_str.strip().split(':')
                            if len(time_parts) == 3:
                                hours, minutes, seconds = map(int, time_parts)
                                duration = timedelta(hours=hours, minutes=minutes, seconds=seconds)
                            else:
                                duration = timedelta(hours=1)
                        
                        event.duration = duration
                        event.save()
                except Exception:
                    event.duration = timedelta(hours=1)
                    event.save()
            
            hosted_by_id = original_data.get('hosted_by')
            if hosted_by_id:
                try:
                    society = Society.objects.get(id=int(hosted_by_id))
                    event.hosted_by = society
                    event.save()
                except (Society.DoesNotExist, ValueError, TypeError):
                    pass
            
            attendee_ids = original_data.get('current_attendees', [])
            if attendee_ids:
                try:
                    attendees = []
                    for attendee_id in attendee_ids:
                        try:
                            attendee = Student.objects.get(id=int(attendee_id))
                            attendees.append(attendee)
                        except (Student.DoesNotExist, ValueError, TypeError):
                            pass
                    event.current_attendees.set(attendees)
                except Exception:
                    pass
            
            log_entry.delete()
            return Response({"message": "Event restored successfully!"}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": f"Failed to restore Event: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
        .values("id", "name", "total_members", "total_events", "total_event_attendance", "popularity_score")
    )

    return JsonResponse(list(popular_societies), safe=False)

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


class NewsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrPresident]

    def post(self, request):
        user = request.user
        data = request.data
        societies = list(map(int, data.get("societies", [])))  # Ensure integer IDs
        events = list(map(int, data.get("events", [])))  # Ensure integer IDs
        message = data.get("message", "")
        recipients = set()


        if not message:
            return Response({"error": "Message content is required."}, status=status.HTTP_400_BAD_REQUEST)

        if 'all' in data.get('target', []):
            recipients.update(User.objects.all())
        else:
            if societies:
                society_members = User.objects.filter(
                    student__isnull=False,  # Ensure the user has a student profile
                    student__societies__in=Society.objects.filter(id__in=societies)
                ).distinct()
                recipients.update(society_members)

            if events:
                event_attendees = User.objects.filter(
                    student__isnull=False,  # Ensure the user has a student profile
                    student__attended_events__in=Event.objects.filter(id__in=events)
                ).distinct()
                recipients.update(event_attendees)

        # Create the Broadcast Message
        broadcast = BroadcastMessage.objects.create(sender=user, message=message)

        # Assign societies and events
        if societies:
            broadcast.societies.set(Society.objects.filter(id__in=societies))  # Ensure valid societies
        if events:
            broadcast.events.set(Event.objects.filter(id__in=events))  # Ensure valid events
        broadcast.save()

        # Assign recipients
        if recipients:
            broadcast.recipients.set(list(recipients))

        return Response(BroadcastSerializer(broadcast).data, status=status.HTTP_201_CREATED)


class NewsPublicationRequestView(APIView):
    """
    API view for managing news publication requests.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Create a new publication request for a news post — no longer requires 'Draft' status.
        If the post is already 'PendingApproval' (or any other), that's okay.
        """
        user = request.user
        if not hasattr(user, "student"):
            return Response(
                {"error": "Only students can submit publication requests"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check 'news_post' param
        news_post_id = request.data.get('news_post')
        if not news_post_id:
            return Response(
                {"error": "News post ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Fetch the news post
        try:
            news_post = SocietyNews.objects.get(id=news_post_id)
        except SocietyNews.DoesNotExist:
            return Response(
                {"error": "News post not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        society = news_post.society
        is_author = (news_post.author and news_post.author.id == user.student.id)
        has_permission = is_author or has_society_management_permission(user.student, society)

        if not has_permission:
            return Response(
                {"error": "You do not have permission to publish this news post"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if there's already a pending request
        existing_request = NewsPublicationRequest.objects.filter(
            news_post=news_post,
            status="Pending"
        ).exists()
        if existing_request:
            return Response(
                {"error": "A publication request for this news post is already pending"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create the new publication request
        publication_request = NewsPublicationRequest.objects.create(
            news_post=news_post,
            requested_by=user.student,
            status="Pending"
        )

        serializer = NewsPublicationRequestSerializer(publication_request)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get(self, request):
        """List publication requests for the current user"""
        user = request.user
        all_statuses = request.query_params.get('all_statuses') == 'true'

        if hasattr(user, "student"):
            # For students, return their own requests
            requests = NewsPublicationRequest.objects.filter(
                requested_by=user.student
            ).order_by('-requested_at')
        elif user.is_admin():
            if all_statuses:
                requests = NewsPublicationRequest.objects.all().order_by('-requested_at')
            else:
                requests = NewsPublicationRequest.objects.filter(
                    status="Pending"
                ).order_by('-requested_at')

            # Check if any requests exist at all
            all_requests = NewsPublicationRequest.objects.all()
            for req in all_requests:
                if req:  # Add null check
                    print(f"DEBUG - Request ID: {req.id}, Status: {req.status}, News: {req.news_post.title}")
        else:
            return Response({"error": "Unauthorized"},
                        status=status.HTTP_403_FORBIDDEN)

        serializer = NewsPublicationRequestSerializer(requests, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
