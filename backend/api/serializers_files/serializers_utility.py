from api.models import Society
from rest_framework import serializers

def get_society_if_exists(society_id):
    """Returns a society if exists, otherwise throws a ValidationError"""
    try:
        society = Society.objects.get(id=society_id)
    except Society.DoesNotExist as exc:
        raise serializers.ValidationError({"error": "Society does not exist."}) from exc
    return society

def is_user_student(context, error_string):
    """Validates that a user is a student, and returns it if so"""
    request_user = context["request"].user
    if not hasattr(request_user, "student"):
        raise serializers.ValidationError(error_string)
    return request_user

def get_report_reply_chain(obj):
    """Gets the chain of replies to an obj of ReportModel"""
    return obj.child_replies.all().order_by('created_at')
