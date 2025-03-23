# this is how I think AdminDeleteView could be:


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
        user = request.user
        if not self.check_admin_permission(user):
            return Response({"error": "Only admins can delete resources."}, status=status.HTTP_403_FORBIDDEN)

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
            performed_by=user,
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


class SocietyRestoreHandler(RestoreHandler):
    """Handler for restoring deleted societies."""
    def handle(self, original_data, log_entry):
        """Restore a deleted society."""
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


class EventRestoreHandler(RestoreHandler):
    """Handler for restoring deleted events."""
    def handle(self, original_data, log_entry):
        """Restore a deleted event."""
        try:
            # Extract basic fields for Event - excluding relationship fields
            event_data = {k: v for k, v in original_data.items() if k not in [
                'id', 'hosted_by', 'current_attendees', 'duration'
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


class SocietyUpdateUndoHandler(RestoreHandler):
    """Handler for undoing society updates."""
    def handle(self, original_data, log_entry):
        """Undo a society update."""
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
                        student = Student.objects.get(id=member_id)
                        society.society_members.add(student)
                    except Exception as e:
                        print(f"Error adding member {member_id}: {str(e)}")
            
            # Handle tags (many-to-many)
            if 'tags' in data and isinstance(data['tags'], list):
                society.tags.clear()
                for tag_value in data['tags']:
                    try:
                        society.tags.add(tag_value)
                    except Exception as e:
                        print(f"Error adding tag {tag_value}: {str(e)}")
            
            # Handle showreel_images (many-to-many or similar)
            if 'showreel_images' in data:
                try:
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


class SocietyStatusChangeUndoHandler(RestoreHandler):
    """Handler for undoing society status changes."""
    def handle(self, original_data, log_entry):
        """Undo a society status change (approve/reject)."""
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


class EventStatusChangeUndoHandler(RestoreHandler):
    """Handler for undoing event status changes."""
    def handle(self, original_data, log_entry):
        """Undo an event status change (approve/reject)."""
        try:
            # Find the event by ID
            event_id = log_entry.target_id
            event = Event.objects.filter(id=event_id).first()
            
            if not event:
                # Try to find by name if the ID doesn't work
                event_name = log_entry.target_name
                event = Event.objects.filter(title=event_name).first()
                
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
                target_name=event.title,  # Use title instead of name for events
                performed_by=log_entry.performed_by,
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


class EventUpdateUndoHandler(RestoreHandler):
    """Handler for undoing event updates."""
    def handle(self, original_data, log_entry):
        """Undo an event update."""
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
                        student = Student.objects.get(id=attendee_id)
                        event.attendees.add(student)
                    except Exception as e:
                        print(f"Error adding attendee {attendee_id}: {str(e)}")
            
            # Handle current_attendees (many-to-many)
            if 'current_attendees' in data and isinstance(data['current_attendees'], list):
                event.current_attendees.clear()
                for attendee_id in data['current_attendees']:
                    try:
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