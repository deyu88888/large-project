from django.utils import timezone
from datetime import timedelta
from api.models_files.request_models import SocietyRequest
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
            if not original_data.get('president') and not original_data.get('approved_by'):
                return Response({
                    "error": "Cannot restore society: required fields 'president' and 'approved_by' are missing from the original data."
                }, status=status.HTTP_400_BAD_REQUEST)
                
            president = None
            approved_by = None
            
            president_id = original_data.get('president')
            if president_id:
                try:
                    president = Student.objects.get(id=president_id)
                except Student.DoesNotExist:
                    pass
                    
            approved_by_id = original_data.get('approved_by')
            if approved_by_id:
                try:
                    approved_by = User.objects.get(id=approved_by_id)
                except User.DoesNotExist:
                    pass
            
            society_data = {k: v for k, v in original_data.items() if k not in [
                'id', 'president', 'vice_president', 'event_manager', 
                'approved_by', 'members', 'society_members', 'events'
            ]}
            
            if president:
                society_data['president'] = president
            if approved_by:
                society_data['approved_by'] = approved_by
                
            if 'president' not in society_data or 'approved_by' not in society_data:
                if 'approved_by' not in society_data:
                    admin_user = User.objects.filter(role='admin').first()
                    if admin_user:
                        society_data['approved_by'] = admin_user
                
                if 'president' not in society_data:
                    for role in ['president', 'vice_president', 'event_manager']:
                        role_id = original_data.get(role)
                        if role_id:
                            try:
                                society_data['president'] = Student.objects.get(id=role_id)
                                break
                            except Student.DoesNotExist:
                                continue
            
            society = Society.objects.create(**society_data)
            
            if original_data.get('vice_president'):
                set_foreign_key_relationship(society, 'vice_president', original_data.get('vice_president'), Student)
            
            if original_data.get('event_manager'):
                set_foreign_key_relationship(society, 'event_manager', original_data.get('event_manager'), Student)
            
            if original_data.get('president'):
                set_foreign_key_relationship(society, 'president', original_data.get('president'), Student)
            
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
            return Response({
                "error": f"Failed to restore Society: {str(e)}",
                "details": f"Original data contains: {', '.join(original_data.keys())}" if isinstance(original_data, dict) else str(original_data)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SocietyUpdateUndoHandler(RestoreHandler):
    """Handler for undoing society updates."""
    def handle(self, original_data, log_entry):
        """Undo a society update."""
        try:
            society = get_object_by_id_or_name(Society, log_entry.target_id, name_value=log_entry.target_name)
            if not society:
                return Response({"error": "Society not found."}, status=status.HTTP_404_NOT_FOUND)
            
            many_to_many_fields = ['society_members', 'tags', 'showreel_images']
            foreign_key_fields = ['president', 'vice_president', 'event_manager', 'approved_by']
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
            for role in ['president', 'vice_president', 'event_manager']:
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
                            showreel = SocietyShowreel.objects.get(id=image_data['id'])
                            showreel.society = society
                            showreel.save()
                        elif isinstance(image_data, int):
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
            society_request = get_object_by_id_or_name(SocietyRequest, log_entry.target_id, name_value=log_entry.target_name)
            if not society_request:
                return Response({"error": "Society Request not found."}, status=status.HTTP_404_NOT_FOUND)
            society_request.status = "Pending"
            
            if log_entry.action_type == "Approve" and hasattr(society_request, 'approved_by'):
                society_request.approved_by = None
            
            society_request.save()
            reason = log_entry.reason if log_entry.reason else "Admin update of society details"
            
            ActivityLog.objects.create(
                action_type="Update",
                target_type="Society",
                target_id=society_request.id,
                target_name=society_request.name,
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