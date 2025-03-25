from django.utils import timezone
from datetime import timedelta
from rest_framework import status
from rest_framework.response import Response
from api.models import Event, Society, Student, ActivityLog, User, SocietyShowreel
from api.utils import *
from django.db.models import Q
from api.views_files.view_utility import set_many_to_many_relationship, RestoreHandler, set_foreign_key_relationship, get_object_by_id_or_name

class SocietyRestoreHandler(RestoreHandler):
    """Handler for restoring deleted societies."""
    def handle(self, original_data, log_entry):
        """Restore a deleted society."""
        try:
            society_data = {k: v for k, v in original_data.items() if k not in [
                'id', 'president', 'vice_president', 'event_manager', 
                'leader', 'approved_by', 'members', 'society_members', 'events'
            ]}
            
            society = Society.objects.create(**society_data)
            
            set_foreign_key_relationship(society, 'president', original_data.get('president'), Student)
            set_foreign_key_relationship(society, 'vice_president', original_data.get('vice_president'), Student)
            set_foreign_key_relationship(society, 'event_manager', original_data.get('event_manager'), Student)
            set_foreign_key_relationship(society, 'leader', original_data.get('leader'), Student)
            set_foreign_key_relationship(society, 'approved_by', original_data.get('approved_by'), User)
            
            society.save()
            
            member_ids = original_data.get('members', [])
            set_many_to_many_relationship(society, 'members', member_ids, Student)
            
            society_member_ids = original_data.get('society_members', [])
            set_many_to_many_relationship(society, 'society_members', society_member_ids, Student)
            
            event_ids = original_data.get('events', [])
            set_many_to_many_relationship(society, 'events', event_ids, Event)
            
            log_entry.delete()
            return Response({"message": "Society restored successfully!"}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": f"Failed to restore Society: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SocietyUpdateUndoHandler(RestoreHandler):
    """Handler for undoing society updates."""
    def handle(self, original_data, log_entry):
        """Undo a society update."""
        try:
            society = get_object_by_id_or_name(Society, log_entry.target_id, name_value=log_entry.target_name)
            if not society:
                return Response({"error": "Society not found."}, status=status.HTTP_404_NOT_FOUND)
            
            many_to_many_fields = ['society_members', 'tags', 'showreel_images']
            foreign_key_fields = ['leader', 'vice_president', 'event_manager', 'approved_by']
            complex_json_fields = ['social_media_links']
            
            data = original_data.copy()
            
            for key, value in data.items():
                if (key not in many_to_many_fields and 
                    key not in foreign_key_fields and 
                    key not in complex_json_fields):
                    if hasattr(society, key) and value is not None:
                        setattr(society, key, value)
            
            if 'social_media_links' in data and isinstance(data['social_media_links'], dict):
                society.social_media_links = data['social_media_links']
            
            society.save()
            
            set_foreign_key_relationship(society, 'approved_by', data.get('approved_by'), User)
            for role in ['leader', 'vice_president', 'event_manager']:
                if role in data and data[role] and isinstance(data[role], dict):
                    set_foreign_key_relationship(society, role, data[role].get('id'), Student)
            society.save()
            
            if 'society_members' in data and isinstance(data['society_members'], list):
                set_many_to_many_relationship(society, 'society_members', data['society_members'], Student)
            
            if 'tags' in data and isinstance(data['tags'], list):
                society.tags = data['tags']
            
            if 'showreel_images' in data and isinstance(data['showreel_images'], list):
                SocietyShowreel.objects.filter(society=society).delete()
    
                for image_data in data['showreel_images']:
                    try:
                        if isinstance(image_data, dict) and 'id' in image_data:
                            # Try to get existing showreel image
                            showreel = SocietyShowreel.objects.get(id=image_data['id'])
                            showreel.society = society
                            showreel.save()
                        elif isinstance(image_data, int):
                            # Try to get existing showreel image by ID
                            showreel = SocietyShowreel.objects.get(id=image_data)
                            showreel.society = society
                            showreel.save()
                    except Exception as e:
                        print(f"Error handling showreel image: {str(e)}")
            
            society.save()
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
            society = get_object_by_id_or_name(Society, log_entry.target_id, name_value=log_entry.target_name)
            if not society:
                return Response({"error": "Society not found."}, status=status.HTTP_404_NOT_FOUND)
            society.status = "Pending"
            
            # If there was an approved_by field and we're undoing an approval, clear it
            if log_entry.action_type == "Approve" and hasattr(society, 'approved_by'):
                society.approved_by = None
            
            society.save()
            reason = log_entry.reason if log_entry.reason else "Admin update of society details"
            
            ActivityLog.objects.create(
                action_type="Update",
                target_type="Society",
                target_id=society.id,
                target_name=society.name,
                performed_by=log_entry.performed_by,
                timestamp=timezone.now(),
                reason=reason,
                expiration_date=timezone.now() + timedelta(days=30),
            )
            
            log_entry.delete()
            
            return Response({
                "message": "Society status change undone successfully. Status set back to Pending."
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response({"error": f"Failed to undo society status change: {str(e)}"}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)
