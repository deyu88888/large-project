from .restore_handler import RestoreHandler
from django.utils import timezone
from datetime import datetime, timedelta
from rest_framework import status
from rest_framework.response import Response
from api.models import Event, Society, Student, ActivityLog, User
from api.utils import process_date_field, process_time_field, process_timedelta_field, set_many_to_many_relationship
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
                set_many_to_many_relationship(event, 'current_attendees', attendee_ids, Student)
            
            log_entry.delete()
            return Response({"message": "Event restored successfully!"}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": f"Failed to restore Event: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



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
                    process_date_field(event, field_name, data[field_name])
            
            # Process time fields
            for field_name in time_fields:
                if field_name in data and data[field_name]:
                    process_time_field(event, field_name, data[field_name])
            
            # Process timedelta fields
            for field_name in timedelta_fields:
                if field_name in data and data[field_name]:
                    process_timedelta_field(event, field_name, data[field_name])
            
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
                    admin_obj = User.objects.get(id=admin_id)
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
                set_many_to_many_relationship(event, 'attendees', data['attendees'], Student)
            
            # Handle current_attendees (many-to-many)
            if 'current_attendees' in data and isinstance(data['current_attendees'], list):
                set_many_to_many_relationship(event, 'current_attendees', data['current_attendees'], Student)
            
            # Handle tags (many-to-many)
            if 'tags' in data and isinstance(data['tags'], list):
                event.tags = data['tags']
            
            # Manusha check this event model doesn't have images fiels
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