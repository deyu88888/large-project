from io import BytesIO
from PIL import Image
from django.core.files.base import ContentFile
from django.core.exceptions import ValidationError
from django.test import TestCase
from api.models import Society, User, Student, validate_social_media_links
from django.core.files.uploadedfile import SimpleUploadedFile
from api.tests.file_deletion import delete_file
from unittest.mock import patch

class SocietyModelTestCase(TestCase):
    """ Unit tests for the Society model """

    def setUp(self):
        self.admin = User.objects.create(
            username='admin_user',
            first_name='John',
            last_name='Smith',
            email='admin@example.com',
            role='admin',
            password='adminpassword',
        )

        self.student1 = Student.objects.create(
            username='QWERTY',
            first_name='QWE',
            last_name='RTY',
            email='qwerty@gmail.com',
            role='student',
            major='CompSci',
        )

        self.student2 = Student.objects.create(
            username='Ja-Smith',
            first_name='Jane',
            last_name='Smith',
            email='jasmith@gmail.com',
            role='student',
            major='Mathematics',
        )

        self.society = Society.objects.create(
            name='Tech',
            president=self.student1,
            approved_by=self.admin,
            category='Technology',
            social_media_links={"Email": "techsociety@example.com"},
            membership_requirements="Members must attend at least 3 events per semester",
            upcoming_projects_or_plans="Plan to host a Tech Fest in May",
        )
        self.society.society_members.add(self.student2)

    def test_valid_society(self):
        """Test to ensure valid societies are accepted."""
        self._assert_society_is_valid()

    def test_required_fields(self):
        """Test required fields validation."""
        test_society = Society(
            name='TestNoAdmin',
            president=self.student1,
            approved_by=None,
            category='Technology',
            social_media_links={"Email": "test@example.com"},
        )
        try:
            test_society.full_clean()
        except ValidationError:
            self.fail("Society.full_clean() raised ValidationError unexpectedly for optional approved_by.")

        # Test blank president (still required)
        self.society.president = None
        self._assert_society_is_invalid()


    def test_string_representation(self):
        """Test string representation."""
        self.assertEqual(str(self.society), self.society.name)

    def test_name_char_limit(self):
        """Test name character limit."""
        self.society.name = 'a' * 31
        self._assert_society_is_invalid()

    def test_society_members(self):
        """Test society members functionality."""
        self.society.society_members.remove(self.student2)
        self._assert_society_is_valid()

        society = Society.objects.create(
            name="President Member Test",
            president=self.student1,
            approved_by=self.admin,
            category="General",
            social_media_links={},
        )
        self.assertIn(self.student1, society.society_members.all())

    def test_roles_field(self):
        """Test roles JSON field functionality."""
        self.society.roles = {"President": self.student1.id, "Vice-President": self.student2.id}
        self.society.save()
        self.assertEqual(self.society.roles["President"], self.student1.id)

    def test_icon_handling(self):
        """Test icon generation and management."""
        self.assertNotEqual(self.society.icon.name, None)
        self.assertTrue(self.society.icon.name.startswith("society_icons/"))
        
        image = Image.new("RGB", (100, 100), color="red")
        buffer = BytesIO()
        image.save(buffer, format='JPEG')
        buffer.seek(0)

        delete_file(self.society.icon.path)
        self.society.icon.save("custom_icon.jpeg", ContentFile(buffer.getvalue()), save=True)
        self.society.save()

        self.assertTrue(self.society.icon.name.startswith("society_icons/custom_icon"))
        
        image = Image.new("RGB", (50, 50), color="blue")
        buffer = BytesIO()
        image.save(buffer, format="JPEG")
        buffer.seek(0)
        custom_icon = SimpleUploadedFile("different_icon.jpg", buffer.getvalue(), content_type="image/jpeg")

        society = Society.objects.create(
            name="Custom Icon Test",
            president=self.student1,
            approved_by=self.admin,
            category="General",
            social_media_links={},
            icon=custom_icon
        )
        self.assertIn("different_icon", society.icon.name)
        
        society = Society(
            name="Missing Icon Society",
            president=self.student1,
            approved_by=self.admin,
            category="General",
            social_media_links={},
        )
        society.save()
        self.assertIsNotNone(society.icon)
        self.assertTrue("default_society_icon" in society.icon.name)

    def test_social_media_links_comprehensive(self):
        """Comprehensive test of social media links validation."""
        email = self.society.social_media_links["Email"]
        if email.startswith("mailto:"):
            email = email[7:]
        self.assertEqual(email, "techsociety@example.com")
        
        new_links = {"Facebook": "https://facebook.com/techsociety", "Email": "newemail@example.com"}
        self.society.social_media_links = new_links
        self.society.save()
        self.assertEqual(self.society.social_media_links, new_links)
        
        valid_links = {
            'Facebook': 'https://facebook.com/test',
            'Instagram': 'http://instagram.com/test',
            'Email': 'mailto:test@example.com',
            'WhatsApp': 'https://wa.me/1234567890',
            'X': 'https://x.com/test',
            'Other': 'https://otherplatform.com/test'
        }
        self.society.social_media_links = valid_links
        self.society.full_clean()
        self.society.save()
        
        self.society.social_media_links = {
            'Facebook': 'https://facebook.com/test',
            'Instagram': '',
            'X': 'https://x.com/test'
        }
        self.society.full_clean()
        self.society.save()
        saved_society = Society.objects.get(pk=self.society.pk)
        self.assertEqual(saved_society.social_media_links['Instagram'], '')
        
        self.society.social_media_links = {
            'Facebook': 'https://facebook.com/test',
            'Instagram': 123
        }
        with self.assertRaises(ValidationError) as context:
            self.society.full_clean()
        error_dict = context.exception.message_dict
        self.assertIn("The value for 'Instagram' must be a string URL", str(error_dict['social_media_links']))
        
        self.society.social_media_links = {
            'Email': 'society@example.com'
        }
        self.society.full_clean()
        self.society.save()
        saved_society = Society.objects.get(pk=self.society.pk)
        self.assertEqual(saved_society.social_media_links['Email'], 'mailto:society@example.com')
        
        self.society.social_media_links = {
            'Facebook': 'facebook.com/test'
        }
        with self.assertRaises(ValidationError) as context:
            self.society.full_clean()
        error_dict = context.exception.message_dict
        self.assertIn("The link for 'Facebook' must be a valid URL starting with http:// or https://", 
                    str(error_dict['social_media_links']))
        
        self.society.social_media_links = {
            "Email": "techsociety@example.com",
            "Tiktok": "https://example.com"
        }
        with self.assertRaises(ValidationError):
            self.society.full_clean()
        
        self.society.social_media_links = ["Email", "techsociety@example.com"]
        with self.assertRaises(ValidationError):
            self.society.full_clean()

    def test_role_management(self):
        """Test vice president and event manager role handling."""
        vice_president = Student.objects.create(
            username='vice_pres',
            first_name='Vice',
            last_name='President',
            email='vp@example.com',
            role='student',
            major='Engineering',
        )
        
        new_vice_president = Student.objects.create(
            username='new_vp',
            first_name='New',
            last_name='VP',
            email='newvp@example.com',
            role='student',
            major='Business',
        )
        
        event_manager = Student.objects.create(
            username='event_mgr',
            first_name='Event',
            last_name='Manager',
            email='em@example.com',
            role='student',
            major='Events',
        )
        
        new_event_manager = Student.objects.create(
            username='new_em',
            first_name='New',
            last_name='EM',
            email='newem@example.com',
            role='student',
            major='Marketing',
        )
        
        with patch.object(Student, 'save') as mock_save:
            self.society.vice_president = vice_president
            self.society.save()
            self.society.vice_president = new_vice_president
            self.society.save()
            self.society.vice_president = None
            self.society.save()
        
        with patch.object(Student, 'save') as mock_save:
            self.society.event_manager = event_manager
            self.society.save()
            self.society.event_manager = new_event_manager
            self.society.save()
            self.society.event_manager = None
            self.society.save()

    def test_save_without_president(self):
        """Test saving a society without a president."""
        with patch.object(Society, 'full_clean'):
            society = Society(
                name="No President Society",
                approved_by=self.admin,
                category="General",
                social_media_links={},
            )
            society.save()
            
            saved_society = Society.objects.get(name="No President Society")
            self.assertIsNone(saved_society.president)

    def test_save_calls_full_clean(self):
        """Test that save method calls full_clean."""
        invalid_society = Society(
            name="a" * 50,
            president=self.student1,
            approved_by=self.admin,
            category="General",
            social_media_links={},
        )
        
        with self.assertRaises(ValidationError):
            invalid_society.save()

    def test_save_checks_previous_state(self):
        """Test that save method can access the previous state for comparison."""
        society = Society.objects.create(
            name="State Check Society",
            president=self.student1,
            approved_by=self.admin,
            category="General",
            social_media_links={},
        )
        
        society.name = "Updated State Check Society"
        society.save()
        
        updated_society = Society.objects.get(pk=society.pk)
        self.assertEqual(updated_society.name, "Updated State Check Society")

    def _assert_society_is_valid(self):
        try:
            self.society.full_clean()
        except ValidationError:
            self.fail("Test society should be valid")

    def _assert_society_is_invalid(self):
        with self.assertRaises(ValidationError):
            self.society.full_clean()

    def tearDown(self):
        for society in Society.objects.all():
            if society.icon:
                delete_file(society.icon.path)
        for student in Student.objects.all():
            if student.icon:
                delete_file(student.icon.path)