from django.utils import timezone
from datetime import timedelta
from rest_framework import status
from rest_framework.response import Response
from api.models import Event, Society, Student, ActivityLog, User, SocietyShowreel
from api.utils import *
from django.db.models import Q
from api.views_files.view_utility import set_many_to_many_relationship, RestoreHandler

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
                    approved_by = User.objects.get(id=int(approved_by_id)) 
                    society.approved_by = approved_by
                except (User.DoesNotExist, ValueError, TypeError):
                    pass
            
            society.save()
            
            # Handle M2M relationships using .set() method
            member_ids = original_data.get('members', [])
            set_many_to_many_relationship(society, 'members', member_ids, Student)
            
            # Handle society_members if it exists
            society_member_ids = original_data.get('society_members', [])
            set_many_to_many_relationship(society, 'society_members', society_member_ids, Student)
            
            event_ids = original_data.get('events', [])
            set_many_to_many_relationship(society, 'events', event_ids, Event)
            
            log_entry.delete()  # Remove log after restoration
            return Response({"message": "Society restored successfully!"}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": f"Failed to restore Society: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
                    admin_obj = User.objects.get(id=admin_id)
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
                set_many_to_many_relationship(society, 'society_members', data['society_members'], Student)
            
            # Handle tags (many-to-many)
            if 'tags' in data and isinstance(data['tags'], list):
                society.tags = data['tags']
            
            # Handle showreel_images (many-to-many or similar)
            if 'showreel_images' in data and isinstance(data['showreel_images'], list):
                # First, delete existing showreel images to avoid duplicates
                SocietyShowreel.objects.filter(society=society).delete()
    
                # Then create new ones
                for image_data in data['showreel_images']:
                    try:
                        # Check what data format is available
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
                        # Add other cases as needed based on your data format
                    except Exception as e:
                        print(f"Error handling showreel image: {str(e)}")
            
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
