from datetime import datetime, timedelta
import time
from .models import Event, Society
from rest_framework import status
from rest_framework.response import Response

def student_has_no_role(student, start=False):
    """Validates the user doesn't hold positions that cannot be abandoned"""
    action = "leave"
    if start:
        action = "start another society"
    if hasattr(student, 'president_of') and student.president_of:
        return Response(
            {"error": f"As president, you can't {action} before you transfer presidency."},
            status=status.HTTP_403_FORBIDDEN
        )
    if hasattr(student, 'vice_president_of_society') and student.vice_president_of_society:
        return Response(
            {"error": f"As vice president, you can't {action} before resigning your position."},
            status=status.HTTP_403_FORBIDDEN
        )
    if hasattr(student, 'event_manager_of_society') and student.event_manager_of_society:
        return Response(
            {"error": f"As event manager, you can't {action} before resigning your position."},
            status=status.HTTP_403_FORBIDDEN
        )
    return None

def get_student_if_user_is_student(user, action):
    """Returns a student if user has this attribute"""
    if not hasattr(user, "student"):
        return None, Response(
            {"error": f"Only students can {action} societies."},
            status=status.HTTP_403_FORBIDDEN
        )

    return user.student, None

def get_admin_if_user_is_admin(user, action):
    """Returns user and an error message if one is to be thrown"""
    if not (user.role == "admin" or user.is_super_admin):
        return None, Response(
            {"error": f"Only admins can {action}."},
            status=status.HTTP_403_FORBIDDEN
        )
    return user, None

def has_society_management_permission(student, society, for_events_only=False):
    """
    Check if a student has management permissions for a society.
    This includes being either the president, vice president, or event manager (for event operations).
    """
    is_president = student.is_president and hasattr(society, 'president') and society.president and society.president.id == student.id
    is_vice_president = hasattr(society, 'vice_president') and society.vice_president and society.vice_president.id == student.id
    is_event_manager = False
    if for_events_only:
        is_event_manager = (hasattr(society, 'event_manager') and
                           society.event_manager and
                           society.event_manager.id == student.id)

    return is_president or is_vice_president or is_event_manager

def get_event_by_id_or_name(event_id, name_field='title'):
    """Get an event by ID, or fall back to searching by name field."""
    event = Event.objects.filter(id=event_id).first()
    if not event:
        # Try to find by name field
        event = Event.objects.filter(**{name_field: event_id}).first()
    return event

def get_society_by_id_or_name(society_id):
    """Get a society by ID, or fall back to searching by name."""
    society = Society.objects.filter(id=society_id).first()
    if not society:
        # Try to find by name
        society = Society.objects.filter(name=society_id).first()
    return society

def process_date_field(obj, field_name, date_str):
    """Convert string date to date object and set on object."""
    try:
        date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
        setattr(obj, field_name, date_obj)
    except Exception as e:
        print(f"Error processing date field {field_name}: {str(e)}")

def process_time_field(obj, field_name, time_str):
    """Convert string time to time object and set on object."""
    try:
        hour, minute, second = map(int, time_str.split(':'))
        time_obj = time(hour, minute, second)
        setattr(obj, field_name, time_obj)
    except Exception as e:
        print(f"Error processing time field {field_name}: {str(e)}")

def process_timedelta_field(obj, field_name, delta_str):
    """Convert string representation of timedelta to timedelta object."""
    try:
        if ',' in delta_str:
            days_part, time_part = delta_str.split(',', 1)
            days = int(days_part.strip().split()[0])
            hours, minutes, seconds = map(int, time_part.strip().split(':'))
            delta = timedelta(days=days, hours=hours, minutes=minutes, seconds=seconds)
        else:
            time_parts = delta_str.strip().split(':')
            if len(time_parts) == 3:
                hours, minutes, seconds = map(int, time_parts)
                delta = timedelta(hours=hours, minutes=minutes, seconds=seconds)
            else:
                delta = timedelta(hours=1)
        setattr(obj, field_name, delta)
    except Exception:
        setattr(obj, field_name, timedelta(hours=1))
        
def set_many_to_many_relationship(obj, field_name, id_list, model_class):
    """Set a many-to-many relationship from a list of IDs."""
    try:
        getattr(obj, field_name).clear()
        for item_id in id_list:
            try:
                item = model_class.objects.get(id=int(item_id))
                getattr(obj, field_name).add(item)
            except Exception as e:
                print(f"Error adding {field_name} {item_id}: {str(e)}")
    except Exception as e:
        print(f"Error setting {field_name}: {str(e)}")