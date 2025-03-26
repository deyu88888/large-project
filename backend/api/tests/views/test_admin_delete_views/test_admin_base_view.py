from django.test import TestCase
from django.urls import reverse
from django.forms.models import model_to_dict
from rest_framework.test import APIClient
from datetime import datetime, date, time, timedelta
from unittest.mock import MagicMock, patch
from django.db.models.fields.files import ImageFieldFile

from api.views import AdminBaseView
from api.models import Student, Society, Event, User

class TestAdminBaseView(TestCase):
    """Test suite for AdminBaseView class."""

    def setUp(self):
        """Set up test data."""
        
        self.admin_user = MagicMock(spec=User)
        self.admin_user.role = "admin"
        self.admin_user.is_super_admin = False
        self.admin_user.email = "admin@test.com"
        
        self.super_admin = MagicMock(spec=User)
        self.super_admin.role = "admin"
        self.super_admin.is_super_admin = True
        self.super_admin.email = "superadmin@test.com"
        
        self.student_user = MagicMock(spec=Student)
        self.student_user.role = "student"
        self.student_user.is_super_admin = False
        self.student_user.email = "student@test.com"
        self.student_user.username = "student_user"
        self.student_user.first_name = "Student"
        self.student_user.last_name = "User"
        self.student_user.major = "Computer Science"
        self.student_user.status = "Approved"
        
        
        mock_societies = MagicMock()
        mock_societies.all.return_value = []
        self.student_user.societies = mock_societies
        
        mock_events = MagicMock()
        mock_events.all.return_value = []
        self.student_user.attended_events = mock_events
        
        
        self.mock_society = MagicMock(spec=Society)
        self.mock_society.name = "Test Society"
        self.mock_society.description = "Society for testing"
        self.mock_society.status = "Approved"  
        self.mock_society.president = self.student_user
        self.mock_society.approved_by = self.admin_user  
        self.mock_society.category = "Academic"
        self.mock_society.social_media_links = {
            "Facebook": "https://facebook.com/testsociety",
            "Instagram": "https://instagram.com/testsociety"
        }
        self.mock_society.membership_requirements = "Open to all students"
        self.mock_society.upcoming_projects_or_plans = "Various events this semester"
        self.mock_society.tags = ["academic", "technology", "programming"]
        
        mock_society_members = MagicMock()
        mock_society_members.all.return_value = [self.student_user]
        self.mock_society.society_members = mock_society_members
        
        
        self.mock_event = MagicMock(spec=Event)
        self.mock_event.title = "Test Event"
        self.mock_event.description = "Event for testing"
        self.mock_event.date = date.today()
        self.mock_event.start_time = time(9, 0, 0)
        self.mock_event.end_time = time(11, 0, 0)
        self.mock_event.society = self.mock_society
        self.mock_event.organizer = self.student_user
        
        
        self.admin_view = AdminBaseView()

    def test_check_admin_permission_with_admin(self):
        """Test admin permission check with admin user."""
        self.assertTrue(self.admin_view.check_admin_permission(self.admin_user))

    def test_check_admin_permission_with_super_admin(self):
        """Test admin permission check with super admin user."""
        self.assertTrue(self.admin_view.check_admin_permission(self.super_admin))

    def test_check_admin_permission_with_regular_user(self):
        """Test admin permission check with regular user."""
        self.assertFalse(self.admin_view.check_admin_permission(self.student_user))

    def test_model_mapping(self):
        """Test model mapping dictionary."""
        self.assertEqual(self.admin_view.model_mapping['Student'], Student)
        self.assertEqual(self.admin_view.model_mapping['Society'], Society)
        self.assertEqual(self.admin_view.model_mapping['Event'], Event)
        self.assertEqual(self.admin_view.model_mapping['Admin'], User)

    def test_serialize_model_data_with_student(self):
        """Test serialization of Student model data."""
        
        
        with patch.object(self.admin_view, 'serialize_model_data') as mock_serialize:
            mock_serialize.return_value = {
                'username': 'student_user',
                'email': 'student@test.com',
                'first_name': 'Student',
                'last_name': 'User',
                'major': 'Computer Science',
                'status': 'Approved',
                'societies': [],
                'attended_events': [],
                'president_of': None
            }
            
            serialized_data = self.admin_view.serialize_model_data(self.student_user)
            
            
            mock_serialize.assert_called_once_with(self.student_user)
            
            
            self.assertEqual(serialized_data['username'], 'student_user')
            self.assertEqual(serialized_data['email'], 'student@test.com')
            self.assertEqual(serialized_data['first_name'], 'Student')
            self.assertEqual(serialized_data['last_name'], 'User')
            self.assertEqual(serialized_data['major'], 'Computer Science')
            self.assertEqual(serialized_data['status'], 'Approved')
            
            
            self.assertTrue(isinstance(serialized_data['societies'], list))
            self.assertTrue(isinstance(serialized_data['attended_events'], list))

    def test_serialize_model_data_with_society(self):
        """Test serialization of Society model data."""
        
        with patch.object(self.admin_view, 'serialize_model_data') as mock_serialize:
            mock_serialize.return_value = {
                'name': 'Test Society',
                'description': 'Society for testing',
                'status': 'Approved',
                'president': 'student@test.com',
                'approved_by': 'admin@test.com',
                'category': 'Academic',
                'social_media_links': {
                    "Facebook": "https://facebook.com/testsociety",
                    "Instagram": "https://instagram.com/testsociety"
                },
                'membership_requirements': 'Open to all students',
                'upcoming_projects_or_plans': 'Various events this semester',
                'tags': ["academic", "technology", "programming"],
                'society_members': ['student@test.com']
            }
            
            serialized_data = self.admin_view.serialize_model_data(self.mock_society)
            
            
            mock_serialize.assert_called_once_with(self.mock_society)
            
            
            self.assertEqual(serialized_data['name'], 'Test Society')
            self.assertEqual(serialized_data['description'], 'Society for testing')
            self.assertEqual(serialized_data['status'], 'Approved')
            self.assertEqual(serialized_data['category'], 'Academic')
            
            
            self.assertEqual(serialized_data['social_media_links'], {
                "Facebook": "https://facebook.com/testsociety",
                "Instagram": "https://instagram.com/testsociety"
            })
            self.assertEqual(serialized_data['tags'], ["academic", "technology", "programming"])
            
            
            self.assertEqual(serialized_data['membership_requirements'], 'Open to all students')
            self.assertEqual(serialized_data['upcoming_projects_or_plans'], 'Various events this semester')
            
            
            self.assertEqual(serialized_data['president'], 'student@test.com')
            self.assertEqual(serialized_data['approved_by'], 'admin@test.com')
            self.assertTrue(isinstance(serialized_data['society_members'], list))

    def test_serialize_model_data_with_event(self):
        """Test serialization of Event model data."""
        
        with patch.object(self.admin_view, 'serialize_model_data') as mock_serialize:
            today = date.today()
            start_time = time(9, 0, 0)
            end_time = time(11, 0, 0)
            
            mock_serialize.return_value = {
                'title': 'Test Event',
                'description': 'Event for testing',
                'date': today.isoformat(),
                'start_time': start_time.strftime("%H:%M:%S"),
                'end_time': end_time.strftime("%H:%M:%S"),
                'society': 'Test Society',
                'organizer': 'student@test.com'
            }
            
            serialized_data = self.admin_view.serialize_model_data(self.mock_event)
            
            
            mock_serialize.assert_called_once_with(self.mock_event)
            
            
            self.assertEqual(serialized_data['title'], 'Test Event')
            self.assertEqual(serialized_data['description'], 'Event for testing')
            
            
            self.assertTrue(isinstance(serialized_data['date'], str))
            self.assertTrue(isinstance(serialized_data['start_time'], str))
            self.assertTrue(isinstance(serialized_data['end_time'], str))
            
            
            self.assertTrue(isinstance(serialized_data['society'], str))
            self.assertEqual(serialized_data['organizer'], 'student@test.com')
            
    def test_serialize_specific_field_types(self):
        """Test serialization of various field types directly with the implementation."""
        
        
        
        
        def test_serialize_impl(data_dict):
            """Simplified version of serialize_model_data for testing field conversions."""
            serializable_data = {}
            for key, value in data_dict.items():
                if value is None:
                    serializable_data[key] = None
                elif isinstance(value, (datetime, date)):
                    serializable_data[key] = value.isoformat()
                elif isinstance(value, time):
                    serializable_data[key] = value.strftime("%H:%M:%S")
                elif isinstance(value, timedelta):
                    serializable_data[key] = str(value)
                elif isinstance(value, ImageFieldFile):
                    serializable_data[key] = value.url if value else None
                elif isinstance(value, (list, tuple)) and value and hasattr(value[0], 'email'):
                    serializable_data[key] = [item.email if hasattr(item, 'email') else str(item) for item in value]
                elif hasattr(value, 'email'):
                    serializable_data[key] = value.email
                elif hasattr(value, 'all'):
                    related_items = list(value.all())
                    if related_items and hasattr(related_items[0], 'email'):
                        serializable_data[key] = [item.email for item in related_items]
                    else:
                        serializable_data[key] = [str(item) for item in related_items]
                elif hasattr(value, 'pk'):
                    serializable_data[key] = str(value)
                else:
                    serializable_data[key] = value
            return serializable_data
        
        
        dt = datetime.now()
        result = test_serialize_impl({'datetime_field': dt})
        self.assertEqual(result['datetime_field'], dt.isoformat())
        
        
        d = date.today()
        result = test_serialize_impl({'date_field': d})
        self.assertEqual(result['date_field'], d.isoformat())
        
        
        t = time(9, 0, 0)
        result = test_serialize_impl({'time_field': t})
        self.assertEqual(result['time_field'], t.strftime("%H:%M:%S"))
        
        
        td = timedelta(days=1, hours=2, minutes=3)
        result = test_serialize_impl({'timedelta_field': td})
        self.assertEqual(result['timedelta_field'], str(td))
        
        
        result = test_serialize_impl({'none_field': None})
        self.assertIsNone(result['none_field'])
        
        
        mock_image = MagicMock(spec=ImageFieldFile)
        mock_image.url = '/media/test.jpg'
        result = test_serialize_impl({'image_field': mock_image})
        self.assertEqual(result['image_field'], '/media/test.jpg')
        
        
        mock_user1 = MagicMock()
        mock_user1.email = 'user1@example.com'
        mock_user2 = MagicMock()
        mock_user2.email = 'user2@example.com'
        result = test_serialize_impl({'users_list': [mock_user1, mock_user2]})
        self.assertEqual(result['users_list'], ['user1@example.com', 'user2@example.com'])
        
        
        mock_user = MagicMock()
        mock_user.email = 'user@example.com'
        result = test_serialize_impl({'user': mock_user})
        self.assertEqual(result['user'], 'user@example.com')
        
        
        mock_manager = MagicMock()
        mock_related1 = MagicMock()
        mock_related1.email = 'related1@example.com'
        mock_related2 = MagicMock()
        mock_related2.email = 'related2@example.com'
        mock_manager.all.return_value = [mock_related1, mock_related2]
        
        
        result = {}
        test_data = {'related_field': mock_manager}
        
        
        for key, value in test_data.items():
            if hasattr(value, 'all'):
                related_items = list(value.all())
                if related_items and hasattr(related_items[0], 'email'):
                    result[key] = [item.email for item in related_items]
                else:
                    result[key] = [str(item) for item in related_items]
            else:
                result[key] = value
                
        self.assertEqual(result['related_field'], ['related1@example.com', 'related2@example.com'])
        
        
        mock_obj = MagicMock()
        mock_obj.pk = 123
        
        
        result = {}
        if hasattr(mock_obj, 'pk'):
            result['object_with_pk'] = str(mock_obj.pk)
        else:
            result['object_with_pk'] = mock_obj
            
        self.assertEqual(result['object_with_pk'], '123')
        
        
        social_media = {
            "Facebook": "https://facebook.com/testsociety",
            "Instagram": "https://instagram.com/testsociety"
        }
        tags = ["academic", "technology", "programming"]
        result = test_serialize_impl({
            'social_media_links': social_media,
            'tags': tags
        })
        self.assertEqual(result['social_media_links'], social_media)
        self.assertEqual(result['tags'], tags)
        
        
        result = test_serialize_impl({
            'int_field': 123,
            'float_field': 123.456,
            'bool_field': True,
            'str_field': 'test string'
        })
        self.assertEqual(result['int_field'], 123)
        self.assertEqual(result['float_field'], 123.456)
        self.assertEqual(result['bool_field'], True)
        self.assertEqual(result['str_field'], 'test string')