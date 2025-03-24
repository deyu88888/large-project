from io import BytesIO
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone
from api.models import Student, UserRequest
from api.serializers import UserRequestSerializer
from api.tests.file_deletion import delete_file

# pylint: disable=no-member


class UserRequestSerializerTestCase(TestCase):
    """
    Unit tests for the UserRequestSerializer class
    """

    def setUp(self):
        # create test data
        self.student = Student.objects.create(
            username='test_student',
            first_name='Alice',
            last_name='Johnson',
            email='alice.johnson@example.com',
            major='Computer Science',
        )

        self.user_request = UserRequest.objects.create(
            from_student=self.student,
            approved=False,
            intent="CreateUse",
            major="Computing",
            icon=self.get_image("0"),
        )

        # Serializer data
        self.serializer = None
        self.data = {
            "from_student": self.student.id,
            "requested_at": timezone.now(),
            "approved": True,
            "intent": "CreateUse",
            "major": "Computing",
            "icon": self.user_request.icon,
        }

    def test_user_request_serialization(self):
        """Test UserRequestSerializer serialization"""
        self.serializer = UserRequestSerializer(instance=self.user_request)
        data = self.serializer.data
        self.assertEqual(self.user_request.from_student.id, data["from_student"])
        self.assertEqual(self.user_request.approved, data["approved"])
        self.assertEqual(self.user_request.major, data["major"])
        self.assertEqual(self.user_request.intent, data["intent"])
        self.assertEqual(self.user_request.icon.url, data["icon"])
        self.assertEqual(
            self.user_request.from_student.id,
            data["from_student"]
        )

    def test_user_request_deserialization(self):
        """Test UserRequestSerializer deserialization"""
        self.serializer = UserRequestSerializer(data=self.data)
        self._assert_serializer_is_valid()
        user_request = self.serializer.save()

        self.assertEqual(user_request.from_student.id, self.data["from_student"])
        self.assertEqual(user_request.approved, self.data["approved"])
        self.assertEqual(user_request.major, self.data["major"])
        self.assertEqual(user_request.intent, self.data["intent"])
        self.assertEqual(user_request.icon, self.data["icon"])
        self.assertEqual(
            user_request.from_student.id,
            self.data["from_student"]
        )

    def test_user_requests_create(self):
        """Test UserRequestSerializer creation"""
        self.serializer = UserRequestSerializer(data=self.data)
        self._assert_serializer_is_valid()
        user_request = self.serializer.validated_data

        self.assertEqual(user_request["approved"], self.data["approved"])
        self.assertEqual(user_request["major"], self.data["major"])
        self.assertEqual(user_request["intent"], self.data["intent"])
        self.assertEqual(user_request["icon"], self.data["icon"])
        self.assertEqual(
            user_request["from_student"].id,
            self.data["from_student"]
        )

    def test_user_request_update(self):
        """Test UserRequestSerializer update"""
        self.assertFalse(self.user_request.approved)

        self.serializer = UserRequestSerializer(
            instance=self.user_request,
            data=self.data,
            partial=True,
        )
        self._assert_serializer_is_valid()
        self.serializer.save()

        self.assertTrue(self.user_request.approved)

    def _assert_serializer_is_valid(self):
        if not self.serializer.is_valid():
            print(f'Errors: {self.serializer.errors}')
            self.fail("Test serializer should be valid")

    def get_image(self, s):
        """Returns an image to be used for testing"""
        image = Image.new('RGB', (1, 1), color='red')
        buffer = BytesIO()
        image.save(buffer, format='JPEG')
        buffer.seek(0)

        upload_image = SimpleUploadedFile(
            f"test_photo{s}.jpeg",
            buffer.getvalue(),
            content_type="image/jpeg"
        )

        return upload_image

    def tearDown(self):
        for student in Student.objects.all():
            if student.icon:
                delete_file(student.icon.path)
        for request in UserRequest.objects.all():
            if request.icon:
                delete_file(request.icon.path)
