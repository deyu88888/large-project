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
