from rest_framework import status
from rest_framework.response import Response
from api.models import Event, Society, Student, User
from api.utils import *
from api.views_files.view_utility import RestoreHandler, set_foreign_key_relationship


class StudentRestoreHandler(RestoreHandler):
    """Handler for restoring deleted students."""
    def handle(self, original_data, log_entry):
        """Restore a deleted student."""
        try:
            user_data = {
                'username': original_data.get('username'),
                'email': original_data.get('email'),
                'first_name': original_data.get('first_name'),
                'last_name': original_data.get('last_name'),
                'is_active': original_data.get('is_active', True),
                'role': original_data.get('role', 'student'),
            }
            
            user_id = original_data.get('id')
            email = user_data.get('email')
            username = user_data.get('username')
            
            user = None
            if user_id:
                try:
                    user = User.objects.filter(id=int(user_id)).first()
                except (ValueError, TypeError):
                    pass
                    
            if not user and email:
                user = User.objects.filter(email=email).first()
                
            if not user and username:
                user = User.objects.filter(username=username).first()
            
            if not user:
                if email:
                    while User.objects.filter(email=email).exists():
                        timestamp = int(time_module.time())
                        email_parts = email.split('@')
                        if len(email_parts) == 2:
                            email = f"{email_parts[0]}+{timestamp}@{email_parts[1]}"
                        else:
                            email = f"restored_{timestamp}@example.com"
                    user_data['email'] = email
                
                if username:
                    while User.objects.filter(username=username).exists():
                        timestamp = int(time_module.time())
                        username = f"{username}_{timestamp}"
                    user_data['username'] = username
                    
                user = User.objects.create(**user_data)

            student = Student.objects.filter(user_ptr=user).first()
            
            excluded_fields = [
                'id', 'username', 'email', 'first_name', 'last_name', 'is_active',
                'password', 'last_login', 'is_superuser', 'is_staff', 'date_joined',
                'groups', 'user_permissions', 'societies', 'attended_events', 'followers',
                'following', 'president_of', 'user_ptr', 'role'
            ]
            student_data = {k: v for k, v in original_data.items() 
                          if k not in excluded_fields and not k.endswith('_set')}

            if not student:
                student = Student(user_ptr_id=user.id)
                student.__dict__.update(user.__dict__)
                
                for key, value in student_data.items():
                    if value is not None and not hasattr(getattr(Student, key, None), 'through'):
                        setattr(student, key, value)
                
                student.save_base(raw=True)
            else:
                for key, value in student_data.items():
                    if value is not None and not hasattr(getattr(Student, key, None), 'through'):
                        setattr(student, key, value)
                student.save()

            if student.pk:
                if 'president_of' in original_data and original_data.get('president_of'):
                    set_foreign_key_relationship(student, 'president_of', original_data.get('president_of'), Society)
                
                society_ids = original_data.get('societies', [])
                if society_ids:
                    student.societies.clear()
                    for society_id in society_ids:
                        try:
                            society = Society.objects.get(id=society_id)
                            student.societies.add(society)
                        except (Society.DoesNotExist, ValueError, TypeError):
                            continue

                event_ids = original_data.get('attended_events', [])
                if event_ids:
                    student.attended_events.clear()
                    for event_id in event_ids:
                        try:
                            event = Event.objects.get(id=event_id)
                            student.attended_events.add(event)
                        except (Event.DoesNotExist, ValueError, TypeError):
                            continue
                
                student.save()
                        
            log_entry.delete()
            return Response({"message": "Student restored successfully!"}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": f"Failed to restore Student: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

class StudentUpdateUndoHandler(RestoreHandler):
    """Handler for undoing student updates."""
    def handle(self, original_data, log_entry):
        """Restore a student to its state before an update."""
        try:
            if not original_data:
                return Response({"error": "No original data found for restoration."}, 
                                status=status.HTTP_400_BAD_REQUEST)
            
            student_id = log_entry.target_id
            student = Student.objects.filter(id=student_id).first()
            
            if not student:
                return Response({"error": "Student not found."}, status=status.HTTP_404_NOT_FOUND)
            
            user_fields = ['username', 'email', 'first_name', 'last_name', 'is_active']
            for field in user_fields:
                if field in original_data:
                    setattr(student, field, original_data[field])
            
            excluded_fields = [
                'id', 'password', 'last_login', 'is_superuser', 'is_staff', 'date_joined',
                'groups', 'user_permissions', 'societies', 'attended_events', 'followers',
                'following', 'president_of', 'user_ptr', 'role'
            ]
            
            student_data = {k: v for k, v in original_data.items() 
                          if k not in excluded_fields and not k.endswith('_set')}
            
            for key, value in student_data.items():
                if not hasattr(getattr(Student, key, None), 'through'):
                    setattr(student, key, value)
            
            student.save()
            
            if 'president_of' in original_data:
                set_foreign_key_relationship(student, 'president_of', original_data.get('president_of'), Society)
            
            if 'societies' in original_data and original_data['societies']:
                student.societies.clear()
                for society_id in original_data['societies']:
                    try:
                        society = Society.objects.get(id=society_id)
                        student.societies.add(society)
                    except (Society.DoesNotExist, ValueError, TypeError):
                        continue
            
            if 'attended_events' in original_data and original_data['attended_events']:
                student.attended_events.clear()
                for event_id in original_data['attended_events']:
                    try:
                        event = Event.objects.get(id=event_id)
                        student.attended_events.add(event)
                    except (Event.DoesNotExist, ValueError, TypeError):
                        continue
            
            log_entry.delete()
            return Response({"message": "Student update undone successfully!"}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": f"Failed to undo student update: {str(e)}"}, 
                           status=status.HTTP_500_INTERNAL_SERVER_ERROR)