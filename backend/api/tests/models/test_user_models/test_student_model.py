from io import BytesIO
from PIL import Image
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from api.models import User, Student, Society
from api.tests.file_deletion import delete_file


class StudentModelTestCase(TestCase):
    def setUp(self):
        # create test data
        self.admin = User.objects.create(
            username='admin_user',
            first_name='Admin',
            last_name='User',
            email='admin@example.com',
            password='adminpassword',
        )
        self.student = Student.objects.create(
            username='test_student',
            first_name='Alice',
            last_name='Johnson',
            email='alice.johnson@example.com',
            major='Computer Science',
        )
        
        # Create a second student to be the president of society2
        self.student2 = Student.objects.create(
            username='second_student',
            first_name='Bob',
            last_name='Smith',
            email='bob.smith@example.com',
            major='Mathematics',
        )
        
        self.society1 = Society.objects.create(
            name='Science Club',
            president=self.student,
            approved_by=self.admin
        )
        
        self.society2 = Society.objects.create(
            name='Math Club',
            president=self.student2,
            approved_by=self.admin
        )

    def test_student_creation(self):
        """test student creation"""
        self.assertEqual(self.student.username, 'test_student')
        self.assertEqual(self.student.first_name, 'Alice')
        self.assertEqual(self.student.last_name, 'Johnson')
        self.assertEqual(self.student.major, 'Computer Science')
        self.assertEqual(self.student.role, 'student') 

    def test_student_full_name(self):
        """test full_name property"""
        self.assertEqual(self.student.full_name, 'Alice Johnson')

    def test_username_must_be_unique(self):
        """Test student's username must be unique"""
        duplicate_student = Student(username="test_student", email="new@example.com")
        with self.assertRaises(ValidationError):
            duplicate_student.full_clean()

    def test_student_role_is_always_student(self):
        """Test Student role must be always student"""
        self.student.role = "admin"
        self.student.save()
        self.assertEqual(self.student.role, "student")

    def test_student_societies_relationship(self):
        """test societies many-to-many relationship"""
        # add student to two societies
        self.student.societies.add(self.society1, self.society2)
        self.assertEqual(self.student.societies.count(), 2)
        self.assertIn(self.society1, self.student.societies.all())
        self.assertIn(self.society2, self.student.societies.all())

    def test_student_president_of_relationship(self):
        """test president_of many-to-many relationship and is_president property"""
        # confirm student is not a president
        self.assertFalse(self.student.is_president)

        # set student as president of one society
        self.student.president_of = self.society1
        self.student.save()

        self.student.refresh_from_db()
        self.assertTrue(self.student.is_president)

        # clear president_of relationship and verify is_president is updated
        self.student.president_of = None
        self.student.save()

        self.student.refresh_from_db()
        self.assertFalse(self.student.is_president)

    def test_signal_update_is_president(self):
        """test m2m_changed signal for updating is_president"""
        # set student as president of one society and verify is_president is updated
        self.student.president_of = self.society1
        self.student.save()

        self.student.refresh_from_db()
        self.assertTrue(self.student.is_president)

        # clear president_of relationship and verify is_president is updated
        self.student.president_of = None
        self.student.save()

        self.student.refresh_from_db()
        self.assertFalse(self.student.is_president)

    def test_icon_default(self):
        """Asserts that when no icon is specified it is initialized to a default"""
        self.assertNotEqual(self.student.icon.name, None)

    def test_icon_upload(self):
        """Test that an icon can be uploaded and saved"""
        image = Image.new('RGB', (1, 1), color='red')
        image_io = BytesIO()
        image.save(image_io, format='JPEG')
        image_io.seek(0)

        uploaded_icon = SimpleUploadedFile(
            "test_icon.jpg",
            image_io.getvalue(),
            content_type="image/jpeg"
        )

        delete_file(self.student.icon.path)
        self.student.icon = uploaded_icon
        self.student.save()

        self.assertTrue(self.student.icon.name.startswith('student_icons/'))

    def test_icon_generation_format(self):
        """Test that an icon format must be JPEG"""
        buffer = BytesIO(self.student.icon.read())
        image = Image.open(buffer)
        self.assertEqual(image.format, "JPEG")

    def tearDown(self):
        for society in Society.objects.all():
            if society.icon:
                delete_file(society.icon.path)
        for student in Student.objects.all():
            if student.icon:
                delete_file(student.icon.path)
