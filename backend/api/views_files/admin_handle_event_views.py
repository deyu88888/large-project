from datetime import datetime, timedelta
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from api.models import Event, Society, Student, ActivityLog, User
from api.views_files.view_utility import get_object_by_id_or_name, process_date_field, \
    process_time_field, process_timedelta_field, set_foreign_key_relationship, set_many_to_many_relationship, RestoreHandler


class EventRestoreHandler(RestoreHandler):
    """Handler for restoring deleted events."""
    def handle(self, original_data, log_entry):
        """Restore a deleted event."""
        try:
            event_data = {k: v for k, v in original_data.items() if k not in [
                'id', 'hosted_by', 'society', 'approved_by', 'organizer', 
                'current_attendees', 'attendees', 'images', 'tags', 'duration'
            ]}

            if 'status' not in event_data or not event_data['status']:
                event_data['status'] = original_data.get('status', 'Approved')
            
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
            
            duration_value = original_data.get('duration')
            if duration_value:
                try:
                    if isinstance(duration_value, str):
                        if ',' in duration_value:
                            days_part, time_part = duration_value.split(',', 1)
                            days = int(days_part.strip().split()[0])
                            hours, minutes, seconds = map(int, time_part.strip().split(':'))
                            duration = timedelta(days=days, hours=hours, minutes=minutes, seconds=seconds)
                        else:
                            time_parts = duration_value.strip().split(':')
                            if len(time_parts) == 3:
                                hours, minutes, seconds = map(int, time_parts)
                                duration = timedelta(hours=hours, minutes=minutes, seconds=seconds)
                            else:
                                duration = timedelta(hours=1)
                    elif isinstance(duration_value, (int, float)):
                        duration = timedelta(seconds=duration_value)
                    else:
                        duration = timedelta(hours=1)
                    
                    event.duration = duration
                except Exception as e:
                    event.duration = timedelta(hours=1)
            
            event.save()
            
            for field_name, model_class in [
                ('hosted_by', Society),
                ('society', Society),
                ('approved_by', User),
                ('organizer', Student)
            ]:
                if field_name in original_data and original_data[field_name]:
                    field_value = original_data[field_name]
                    set_foreign_key_relationship(event, field_name, field_value, model_class)
            
            event.save()
            
            for field_name, model_class in [
                ('attendees', Student),
            ]:
                if field_name in original_data and original_data[field_name]:
                    set_many_to_many_relationship(event, field_name, original_data[field_name], model_class)

            if 'current_attendees' in original_data and original_data['current_attendees']:
                try:
                    attendee_emails = original_data['current_attendees']
                    for email in attendee_emails:
                        student = Student.objects.filter(email=email).first()
                        if student:
                            event.current_attendees.add(student)
                except Exception as e:
                    pass
            
            if 'tags' in original_data and original_data['tags']:
                event.tags = original_data['tags']
            
            if 'images' in original_data and original_data['images']:
                try:
                    for image_id in original_data['images']:
                        event.images.add(image_id)
                except Exception as e:
                    pass
            
            event.save()
            log_entry.delete()
            
            return Response({
                "message": "Event restored successfully!",
                "event_id": event.id,
                "event_status": event.status
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                "error": f"Failed to restore Event: {str(e)}",
                "details": str(original_data)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EventStatusChangeUndoHandler(RestoreHandler):
    """Handler for undoing event status changes."""
    def handle(self, original_data, log_entry):
        """Undo an event status change (approve/reject)."""
        try:
            event = get_object_by_id_or_name(Event, log_entry.target_id, name_field='title', name_value=log_entry.target_name)
            if not event:
                return Response({"error": "Event not found."}, status=status.HTTP_404_NOT_FOUND)
            event.status = "Pending"
            
            if log_entry.action_type == "Approve" and hasattr(event, 'approved_by'):
                event.approved_by = None
            
            event.save()
            reason = log_entry.reason if log_entry.reason else "Admin update of event details"
            
            ActivityLog.objects.create(
                action_type="Update",
                target_type="Event",
                target_id=event.id,
                target_name=event.title,
                performed_by=log_entry.performed_by,
                timestamp=timezone.now(),
                reason=reason,
                expiration_date=timezone.now() + timedelta(days=30),
            )
            
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
            event = get_object_by_id_or_name(Event, log_entry.target_id, name_field='title', name_value=log_entry.target_name)
            if not event:
                return Response({"error": "Event not found."}, status=status.HTTP_404_NOT_FOUND)
            
            many_to_many_fields = ['attendees', 'tags', 'images', 'current_attendees']
            foreign_key_fields = ['society', 'organizer', 'approved_by', 'hosted_by']
            complex_json_fields = ['location_details']
            date_fields = ['date']
            time_fields = ['start_time']
            timedelta_fields = ['duration']
            
            data = original_data.copy()
            
            for field_name in date_fields:
                if field_name in data and data[field_name]:
                    process_date_field(event, field_name, data[field_name])
            
            for field_name in time_fields:
                if field_name in data and data[field_name]:
                    process_time_field(event, field_name, data[field_name])
            
            for field_name in timedelta_fields:
                if field_name in data and data[field_name]:
                    process_timedelta_field(event, field_name, data[field_name])
            
            for key, value in data.items():
                if (key not in many_to_many_fields and 
                    key not in foreign_key_fields and 
                    key not in complex_json_fields and
                    key not in date_fields and
                    key not in time_fields and
                    key not in timedelta_fields):
                    if hasattr(event, key) and value is not None:
                        setattr(event, key, value)
            
            if 'location_details' in data and isinstance(data['location_details'], dict):
                event.location_details = data['location_details']
            
            event.save()
            
            set_foreign_key_relationship(event, 'approved_by', data.get('approved_by'), User)

            if 'society' in data and data['society']:
                society_id = data['society'] if isinstance(data['society'], int) else data['society'].get('id')
                set_foreign_key_relationship(event, 'society', society_id, Society)

            if 'organizer' in data and data['organizer']:
                organizer_id = data['organizer'] if isinstance(data['organizer'], int) else data['organizer'].get('id')
                set_foreign_key_relationship(event, 'organizer', organizer_id, Student)

            if 'hosted_by' in data and data['hosted_by']:
                society_id = data['hosted_by'] if isinstance(data['hosted_by'], int) else data['hosted_by'].get('id')
                set_foreign_key_relationship(event, 'hosted_by', society_id, Society)

            event.save()
            
            if 'attendees' in data and isinstance(data['attendees'], list):
                set_many_to_many_relationship(event, 'attendees', data['attendees'], Student)
            
            if 'current_attendees' in data and isinstance(data['current_attendees'], list):
                set_many_to_many_relationship(event, 'current_attendees', data['current_attendees'], Student)
            
            if 'tags' in data and isinstance(data['tags'], list):
                event.tags = data['tags']
            
            if 'images' in data:
                try:
                    event.images.clear()
                    if data['images'] and isinstance(data['images'], list):
                        for image in data['images']:
                            event.images.add(image)
                except Exception as e:
                    pass
            
            event.save()
            
            log_entry.delete()
            
            return Response({"message": "Event update undone successfully!"}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                "error": f"Failed to undo Event update: {str(e)}",
                "original_data_content": original_data
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)