from datetime import datetime, timedelta, time
import json
from api.models import Society
from rest_framework import status
from rest_framework.response import Response
from api.serializers import NewsPublicationRequest

def student_has_no_role(student, start=False, society_id=None):
    """
    Validates the user doesn't hold positions that cannot be abandoned
    """
    action = "leave"
    if start:
        action = "start another society"


    if society_id is not None:

        if student.is_president and student.president_of and student.president_of.id == society_id:
            return Response(
                {"error": f"As president, you can't {action} before you transfer presidency."},
                status=status.HTTP_403_FORBIDDEN
            )


        if student.is_vice_president:
            try:
                Society.objects.get(id=society_id, vice_president=student)
                return Response(
                    {"error": f"As vice president, you can't {action} "
                    "before resigning your position."},
                    status=status.HTTP_403_FORBIDDEN
                )
            except Society.DoesNotExist:
                pass


        if student.is_event_manager:
            try:
                Society.objects.get(id=society_id, event_manager=student)
                return Response(
                    {"error": f"As event manager, you can't {action} "
                    "before resigning your position."},
                    status=status.HTTP_403_FORBIDDEN
                )
            except Society.DoesNotExist:
                pass
    else:

        if student.is_president and student.president_of:
            return Response(
                {"error": f"As president, you can't {action} before "
                "you transfer presidency."},
                status=status.HTTP_403_FORBIDDEN
            )

        if student.is_vice_president:
            return Response(
                {"error": f"As vice president, you can't {action} before "
                "resigning your position."},
                status=status.HTTP_403_FORBIDDEN
            )

        if student.is_event_manager:
            return Response(
                {"error": f"As event manager, you can't {action} before "
                "resigning your position."},
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

    is_president = False
    if hasattr(student, 'is_president') and student.is_president:

        if hasattr(student, 'president_of') and student.president_of and student.president_of.id == society.id:
            is_president = True
    

    is_vice_president = False
    if hasattr(society, 'vice_president') and society.vice_president:
        is_vice_president = society.vice_president.id == student.id
    

    is_event_manager = False
    if for_events_only and hasattr(society, 'event_manager') and society.event_manager:
        is_event_manager = society.event_manager.id == student.id

    return is_president or is_vice_president or is_event_manager

def get_object_by_id_or_name(model_class, object_id, name_field='name', name_value=None):
    """
    Get an object by ID, or fall back to searching by a name field.
    """
    obj = model_class.objects.filter(id=object_id).first()

    if not obj:
        lookup_value = name_value if name_value is not None else object_id
        obj = model_class.objects.filter(**{name_field: lookup_value}).first()

    return obj

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

def set_foreign_key_relationship(obj, field_name, id_value, model_class):
    """Set a foreign key relationship from an ID value."""
    if not id_value:
        return

    try:

        item = model_class.objects.get(id=int(id_value))
        setattr(obj, field_name, item)
    except (model_class.DoesNotExist, ValueError, TypeError) as e:
        print(f"Error setting {field_name} with ID {id_value}: {str(e)}")


class RestoreHandler:
    """Base class for all restore handlers."""
    def handle(self, original_data, log_entry):
        """Handle restoration logic."""
        raise NotImplementedError("Subclasses must implement this method")
    
def is_society_member(user, society_id):
    """
    Check if a user is a member of a society with thorough verification.
    Returns True if the user is a member, False otherwise.
    """
    if not hasattr(user, 'student'):
        return False   
    student = user.student
    try:
        if student.societies.filter(id=society_id).exists():
            return True
    except Exception:
        pass
    return False


def standard_error_response(message, code=status.HTTP_400_BAD_REQUEST):
    """Standard format for error responses"""
    return Response({"error": message}, status=code)

def parse_json_field(data, field_name):
    """Safely parse a JSON string from request data"""
    if field_name in data and isinstance(data[field_name], str):
        try:
            return json.loads(data[field_name])
        except json.JSONDecodeError:
            return data[field_name]
    return data.get(field_name)

def mark_previous_requests_superseded(news_post):
    """Mark any previous requests as superseded to maintain history"""
    NewsPublicationRequest.objects.filter(
        news_post=news_post,
        status="Approved"
    ).update(status="Superseded_Approved")
    
    NewsPublicationRequest.objects.filter(
        news_post=news_post,
        status="Rejected"
    ).update(status="Superseded_Rejected")

def cancel_pending_requests(news_post):
    """Cancel any pending publication requests"""
    NewsPublicationRequest.objects.filter(
        news_post=news_post,
        status="Pending"
    ).update(status="Cancelled")
