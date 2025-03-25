from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from api.models import Event, EventModule, Society, Student, User


class EventModuleTestCase(TestCase):
    """Tests for the EventModule model."""

    def setUp(self):
        self.admin = User.objects.create(
            username="admin_user",
            email="admin@example.com",
            password="adminpassword",
            role="admin"
        )

        self.student = Student.objects.create(
            username="student_user",
            email="student@example.com",
            password="studentpassword",
            major="Engineering"
        )

        self.society = Society.objects.create(
            name="AI Society",
            president=self.student,
            approved_by=self.admin
        )

        self.event = Event.objects.create(
            title="AI Talk",
            main_description="Discussion on AI",
            location="Auditorium",
            hosted_by=self.society
        )

    def test_create_text_module(self):
        """Test creating a subtitle/description module with text_value"""
        module = EventModule.objects.create(
            event=self.event,
            type="subtitle",
            text_value="Welcome to the event"
        )
        self.assertEqual(module.type, "subtitle")
        self.assertEqual(module.text_value, "Welcome to the event")
        self.assertFalse(bool(module.file_value))
        self.assertFalse(module.is_participant_only)

    def test_create_file_module(self):
        """Test creating a file module with a dummy uploaded file"""
        dummy_file = SimpleUploadedFile("test.pdf", b"PDF content", content_type="application/pdf")
        module = EventModule.objects.create(
            event=self.event,
            type="file",
            file_value=dummy_file
        )
        self.assertEqual(module.type, "file")
        self.assertIsNone(module.text_value)
        self.assertIn("test", module.file_value.name)
        self.assertTrue(module.file_value.name.endswith(".pdf"))

    def test_create_participant_only_module(self):
        """Test the is_participant_only flag works correctly"""
        module = EventModule.objects.create(
            event=self.event,
            type="description",
            text_value="Private instructions",
            is_participant_only=True
        )
        self.assertTrue(module.is_participant_only)

    def test_str_method_with_text(self):
        """Test __str__ returns type and text_value"""
        module = EventModule.objects.create(
            event=self.event,
            type="subtitle",
            text_value="Hello everyone"
        )
        self.assertEqual(str(module), "subtitle - Hello everyone")

    def test_str_method_with_file(self):
        """Test __str__ returns type and file name when no text_value"""
        dummy_file = SimpleUploadedFile("image.png", b"image content", content_type="image/png")
        module = EventModule.objects.create(
            event=self.event,
            type="image",
            file_value=dummy_file
        )
        result = str(module)

        self.assertTrue(result.startswith("image - event_modules_files/"))
        self.assertTrue(result.endswith(".png"))
        self.assertIn("image_", result)

