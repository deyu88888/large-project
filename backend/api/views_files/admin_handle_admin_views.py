from django.utils import timezone
from datetime import timedelta
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.response import Response
from api.models import User, ActivityLog
from api.utils import *
from api.views_files.view_utility import set_many_to_many_relationship, RestoreHandler, set_foreign_key_relationship, get_object_by_id_or_name

class AdminRestoreHandler(RestoreHandler):
    """Handler for restoring deleted admin users."""
    def handle(self, original_data, log_entry):
        """Restore a deleted admin user."""
        try:
            admin_data = {k: v for k, v in original_data.items() if k not in [
                'id', 'password', 'last_login', 'groups', 'user_permissions', 
                'following', 'follower', 'full_name'
            ]}
            
            admin_data['role'] = 'admin'
            
            if 'is_super_admin' in original_data:
                admin_data['is_super_admin'] = original_data['is_super_admin']
            else:
                admin_data['is_super_admin'] = False
                
            admin_user = User.objects.create(**admin_data)
    
            admin_user.set_password('TemporaryPassword123!')
            
            try:
                admin_user.full_clean()
                admin_user.save()
            except ValidationError as e:
                return Response({
                    "error": "Validation failed",
                    "details": e.message_dict
                }, status=status.HTTP_400_BAD_REQUEST)
                        
            if 'groups' in original_data and isinstance(original_data.get('groups'), list):
                set_many_to_many_relationship(admin_user, 'groups', original_data.get('groups'), User._meta.get_field('groups').related_model)
            
            if 'user_permissions' in original_data and isinstance(original_data.get('user_permissions'), list):
                set_many_to_many_relationship(admin_user, 'user_permissions', original_data.get('user_permissions'), User._meta.get_field('user_permissions').related_model)
            
            if 'following' in original_data and isinstance(original_data.get('following'), list):
                set_many_to_many_relationship(admin_user, 'following', original_data.get('following'), User)
            
            if 'follower' in original_data and isinstance(original_data.get('follower'), list):
                set_many_to_many_relationship(admin_user, 'follower', original_data.get('follower'), User)
            
            log_entry.delete()
            
            return Response({
                "message": "Admin user restored successfully! A temporary password has been set.",
                "note": "The admin will need to reset their password."
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                "error": f"Failed to restore Admin: {str(e)}",
                "details": f"Original data contains: {', '.join(original_data.keys())}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminUpdateUndoHandler(RestoreHandler):
    """Handler for undoing admin user updates."""
    def handle(self, original_data, log_entry):
        """Undo an admin user update."""
        try:
            admin_user = get_object_by_id_or_name(User, log_entry.target_id, name_field='email', name_value=log_entry.target_name)
            if not admin_user:
                return Response({"error": "Admin user not found."}, status=status.HTTP_404_NOT_FOUND)
            
            if admin_user.role != 'admin' and not admin_user.is_super_admin:
                return Response({
                    "error": "Cannot undo update: User is no longer an admin."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            many_to_many_fields = ['groups', 'user_permissions', 'following', 'follower']
            sensitive_fields = ['password', 'last_login']
            computed_fields = ['full_name', 'is_superuser', 'is_staff']
            
            for key, value in original_data.items():
                if (key not in many_to_many_fields and 
                    key not in sensitive_fields and
                    key not in computed_fields and
                    hasattr(admin_user, key) and 
                    value is not None):
                    setattr(admin_user, key, value)
            
            admin_user.role = 'admin'
            
            admin_user.save()
            
            for field in many_to_many_fields:
                if field in original_data:
                    field_ids = original_data.get(field, [])
                    if isinstance(field_ids, list):
                        if field in ['following', 'follower']:
                            related_model = User
                        else:
                            related_model = User._meta.get_field(field).related_model
                        set_many_to_many_relationship(admin_user, field, field_ids, related_model)
            
            ActivityLog.objects.create(
                action_type="Update",
                target_type="Admin",
                target_id=admin_user.id,
                target_name=f"{admin_user.first_name} {admin_user.last_name}".strip() or admin_user.email,
                performed_by=log_entry.performed_by,
                timestamp=timezone.now(),
                reason=f"Undoing previous update: {log_entry.reason}",
                expiration_date=timezone.now() + timedelta(days=30),
            )
            
            log_entry.delete()
            
            return Response({"message": "Admin update undone successfully!"}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                "error": f"Failed to undo Admin update: {str(e)}",
                "details": f"Original data contains: {', '.join(original_data.keys())}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)