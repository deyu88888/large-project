from io import BytesIO
from PIL import Image
from django.core.files.base import ContentFile
from django.core.exceptions import ValidationError
from django.test import TestCase
from api.models import Society, Admin, Student
from django.core.files.uploadedfile import SimpleUploadedFile
from api.tests.file_deletion import delete_file

class SocietyModelTestCase(TestCase):
    """ Unit tests for the Society model """

    def setUp(self):
        self.admin = Admin(
            username='admin_user',
            first_name='John',
            last_name='Smith',
            email='admin@example.com',
            role='admin',
            password='adminpassword',
        )
        self.admin.save()

        self.student1 = Student(
            username='QWERTY',
            first_name='QWE',
            last_name='RTY',
            email='qwerty@gmail.com',
            role='student',
            major='CompSci',
        )
        self.student1.save()

        self.student2 = Student(
            username='Ja-Smith',
            first_name='Jane',
            last_name='Smith',
            email='jasmith@gmail.com',
            role='student',
            major='Mathematics',
        )
        self.student2.save()

        self.society = Society(
            name='Tech',
            president=self.student1,
            approved_by=self.admin,
            category='Technology',
            social_media_links={"Email": "techsociety@example.com"},
            membership_requirements="Members must attend at least 3 events per semester",
            upcoming_projects_or_plans="Plan to host a Tech Fest in May",
        )
        self.society.save()
        self.society.society_members.add(self.student2)  # pylint: disable=no-member

    def test_valid_society(self):
        """ Test to ensure valid societies are accepted """
        self._assert_society_is_valid()

    def test_blank_admin(self):
        """ Test to ensure an admin must be specified """
        # In Django's ORM, directly changing ForeignKey to None won't always trigger validation
        # Create a new society instance without an admin for proper validation testing
        test_society = Society(
            name='TestNoAdmin',
            president=self.student1,
            approved_by=None,  # Explicitly set to None
            category='Technology',
            social_media_links={"Email": "test@example.com"},
            membership_requirements="Test requirements",
            upcoming_projects_or_plans="Test plans",
        )
        
        # This should raise ValidationError
        with self.assertRaises(ValidationError):
            test_society.full_clean()

    def test_blank_president(self):
        """ Test to ensure a president must be specified """
        self.society.president = None
        self._assert_society_is_invalid()

    def test_string_representation(self):
        """ Test to ensure the title is returned when cast to str """
        self.assertEqual(str(self.society), self.society.name)

    def test_name_char_limit(self):
        """ Test to ensure society name can't surpass 30 characters """
        self.society.name = 'a' * 31
        self._assert_society_is_invalid()

    def test_blank_members(self):
        """ Test to ensure a society is valid without members """
        self.society.society_members.remove(self.student2)  # pylint: disable=no-member
        self._assert_society_is_valid()

    def test_roles_field(self):
        """ Test roles JSON field functionality """
        self.society.roles = {"President": self.student1.id, "Vice-President": self.student2.id}
        self.society.save()
        self.assertEqual(self.society.roles["President"], self.student1.id)

    def test_change_president(self):
        """ Test to ensure changing the president works correctly """
        self.society.president = self.student2
        self.society.save()
        self.assertEqual(self.society.president, self.student2)

    def test_social_media_links(self):
        """ Test the social_media_links JSON field """
        # Fix: Check if there's a 'mailto:' prefix and handle it accordingly
        email = self.society.social_media_links["Email"]
        if email.startswith("mailto:"):
            email = email[7:]  # Remove 'mailto:' prefix
        self.assertEqual(email, "techsociety@example.com")

    def test_membership_requirements(self):
        """ Test the membership_requirements field """
        self.assertEqual(
            self.society.membership_requirements,
            "Members must attend at least 3 events per semester"
        )

    def test_upcoming_projects_or_plans(self):
        """ Test the upcoming_projects_or_plans field """
        self.assertEqual(self.society.upcoming_projects_or_plans, "Plan to host a Tech Fest in May")

    def test_icon_default(self):
        """Asserts that when no icon is specified it is initialized to a default"""
        self.assertNotEqual(self.society.icon.name, None)

    def test_icon_upload(self):
        """Test that an icon can be uploaded and saved"""
        image = Image.new("RGB", (100, 100), color="red")

        buffer = BytesIO()
        image.save(buffer, format='JPEG')
        buffer.seek(0)

        delete_file(self.society.icon.path)
        self.society.icon.save("default_icon.jpeg", ContentFile(buffer.getvalue()), save=True)
        self.society.save()

        self.assertTrue(self.society.icon.name.startswith("society_icons/"))

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
                
    def test_president_always_member(self):
        """
        Test that after saving, the society's president is always included in society_members.
        """
        # Create a new society without manually adding the president.
        society = Society.objects.create(
            name="president Membership Test",
            president=self.student1,
            approved_by=self.admin,
            status="Approved",
            category="General",
            social_media_links={},
            membership_requirements="",
            upcoming_projects_or_plans="",
        )
        # After saving, the president should be in society_members.
        self.assertIn(self.student1, society.society_members.all())

    def test_default_icon_generated(self):
        """
        Test that if no icon is provided when creating a society, the save() method generates a default icon.
        """
        # Create a society without specifying an icon.
        society = Society.objects.create(
            name="Icon Generation Test",
            president=self.student1,
            approved_by=self.admin,
            status="Approved",
            category="General",
            social_media_links={},
            membership_requirements="",
            upcoming_projects_or_plans="",
        )
        # The society.save() call in the model should have generated an icon.
        self.assertIsNotNone(society.icon)
        self.assertNotEqual(society.icon.name, "")
        # Optionally, check that the generated icon filename contains the expected prefix.
        self.assertTrue(society.icon.name.startswith("society_icons/default_society_icon_"))

    def test_icon_not_overwritten_if_provided(self):
        """
        Test that if an icon is provided during society creation, it is not overwritten by the default icon generation.
        """
        # Create a custom icon file.
        image = Image.new("RGB", (50, 50), color="blue")
        buffer = BytesIO()
        image.save(buffer, format="JPEG")
        buffer.seek(0)
        custom_icon = SimpleUploadedFile("custom_icon.jpg", buffer.getvalue(), content_type="image/jpeg")

        society = Society.objects.create(
            name="Custom Icon Test",
            president=self.student1,
            approved_by=self.admin,
            status="Approved",
            category="General",
            social_media_links={},
            membership_requirements="",
            upcoming_projects_or_plans="",
            icon=custom_icon
        )
        # The provided custom icon should remain.
        self.assertIn("custom_icon", society.icon.name)

    def test_social_media_links_update(self):
        """
        Test updating the social_media_links JSON field and ensuring it is saved correctly.
        """
        # Use the society from setUp.
        # Fix: Use the correct capitalization for "Facebook" platform
        new_links = {"Facebook": "https://facebook.com/techsociety", "Email": "newemail@example.com"}
        self.society.social_media_links = new_links
        self.society.save()
        self.assertEqual(self.society.social_media_links, new_links)