import io
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.exceptions import ValidationError
from django.test import TestCase
from api.models import Society, Admin, Student, SocietyShowreel
from api.tests.file_deletion import delete_file

class SocietyShowreelModelTestCase(TestCase):
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
            leader=self.student1,
            approved_by=self.admin,
            category='Technology',
            social_media_links={"email": "techsociety@example.com"},
            timetable="Weekly meetings on Fridays at 5 PM",
            membership_requirements="Members must attend at least 3 events per semester",
            upcoming_projects_or_plans="Plan to host a Tech Fest in May",
        )
        self.society.save()
        self.society.society_members.add(self.student2)  # pylint: disable=no-member

        self.society_showreel = None

        image = Image.new('RGB', (100, 100), color='red')
        image_io = io.BytesIO()
        image.save(image_io, format='JPEG')
        image_io.seek(0)

        self.default_photo = SimpleUploadedFile(
            "test_icon.jpg",
            image_io.getvalue(),
            content_type="image/jpeg"
        )

    def test_basic_showreel_valid(self):
        """Test that a 'correct' showreel is valid"""
        self.society_showreel = SocietyShowreel(
            society=self.society,
            caption="A photo of an event"
        )
        self.society_showreel.photo = self.default_photo
        self._assert_showreel_is_valid()

    def test_showreel_requires_society(self):
        """Test a showreel's creation requires a reference to a society"""
        self.society_showreel = SocietyShowreel(
            caption="A photo of an event"
        )
        self.society_showreel.photo = self.default_photo
        self._assert_showreel_is_invalid()

    def test_showreel_requires_photo(self):
        """Test a showreel's creation requires a photo"""
        self.society_showreel = SocietyShowreel(
            society=self.society,
            caption="A photo of an event"
        )
        self._assert_showreel_is_invalid()

    def test_showreel_not_requires_caption(self):
        """Test a showreel can be created without a caption"""
        self.society_showreel = SocietyShowreel(
            society=self.society,
        )
        self.society_showreel.photo = self.default_photo
        self._assert_showreel_is_valid()

    def test_society_max_images(self):
        """Test a society cannot have more than 10 showreel images"""
        for i in range(10):
            self.society_showreel = SocietyShowreel(
                society=self.society,
                caption=f"Test image {i+1}",
            )
            self.society_showreel.photo = self.default_photo
            self.society_showreel.save()
            self._assert_showreel_is_valid()

        self.society_showreel = SocietyShowreel(
            society=self.society,
            caption="Extra image",
        )
        self.society_showreel.photo = self.default_photo
        self._assert_showreel_is_invalid()

    def _assert_showreel_is_valid(self):
        try:
            self.society_showreel.full_clean()
        except ValidationError:
            self.fail("Test showreel should be valid")

    def _assert_showreel_is_invalid(self):
        with self.assertRaises(ValidationError):
            self.society_showreel.full_clean()

    def tearDown(self):
        for society in Society.objects.all():
            if society.icon:
                delete_file(society.icon.path)
        for student in Student.objects.all():
            if student.icon:
                delete_file(student.icon.path)
        for showreel in SocietyShowreel.objects.all():
            if showreel.photo:
                delete_file(showreel.photo.path)
