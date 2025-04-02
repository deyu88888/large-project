from io import BytesIO
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone
from api.models import Society, User, Student, SocietyRequest, SocietyShowreelRequest
from api.serializers import SocietyRequestSerializer
from api.tests.file_deletion import delete_file
from rest_framework.test import APIRequestFactory

# pylint: disable=no-member


class SocietyRequestSerializerTestCase(TestCase):
    """
    Unit tests for the Society serializer
    """

    def setUp(self):
        # Create an Admin user
        self.admin = User.objects.create(
            username="admin_user",
            first_name="Admin",
            last_name="User",
            email="admin@example.com",
            password="adminpassword",
        )

        # Create two Student users
        self.student1 = Student.objects.create(
            username="QWERTY",
            first_name="QWE",
            last_name="RTY",
            email="qwerty@gmail.com",
            major="CompSci",
        )

        self.student2 = Student.objects.create(
            username="Ja-Smith",
            first_name="Jane",
            last_name="Smith",
            email="jasmith@gmail.com",
            major="Mathematics",
        )

        # Create a Society with required approved_by field
        self.society = Society.objects.create(
            name="Tech",
            president=self.student1,
            approved_by=self.admin,  # Fixed: Set admin instead of None
            status="Pending",
            category="Informatics",
            social_media_links={"Email": "tech@example.com"}  # Added required field
        )
        self.society.society_members.add(self.student2)

        # Create a request for a society
        self.society_request = SocietyRequest.objects.create(
            society=self.society,
            name="Tech",
            president=self.student1,
            category="Technology",
            from_student=self.student1,
            intent="CreateSoc",
            icon=self.get_image("0"),
        )

        # Serializer data
        self.serializer = None
        self.data = {
            "society": self.society.id,
            "name": "Tech",
            "president": self.student1.id,
            "category": "Technology",
            "requested_at": timezone.now(),
            "approved": True,
            "from_student": self.student1.id,
            "intent": "CreateSoc",
            "icon": self.society_request.icon,
        }

    def test_society_request_serialization(self):
        """Test to ensure serialization function correctly"""
        self.serializer = SocietyRequestSerializer(instance=self.society_request)
        data = self.serializer.data

        self.assertEqual(self.society_request.society.id, data["society"])
        self.assertEqual(self.society_request.name, data["name"])
        self.assertEqual(self.society_request.president.id, data["president"]["id"])
        self.assertEqual(self.society_request.category, data["category"])
        self.assertEqual(self.society_request.approved, data["approved"])
        self.assertEqual(self.society_request.intent, data["intent"])
        self.assertEqual(self.society_request.icon.url, data["icon"])
        self.assertEqual(
            self.society_request.from_student.id,
            data["from_student"]
        )

    def test_society_request_deserialization(self):
        """Test to ensure deserialization functions correctly"""
        self.serializer = SocietyRequestSerializer(data=self.data)
        self._assert_serializer_is_valid()
        society_request = self.serializer.validated_data

        self.assertEqual(society_request["society"].id, self.data["society"])
        self.assertEqual(society_request["name"], self.data["name"])
        self.assertEqual(self.society_request.president.id, self.data["president"])
        self.assertEqual(society_request["category"], self.data["category"])
        self.assertEqual(society_request["approved"], self.data["approved"])
        self.assertEqual(society_request["intent"], self.data["intent"])
        self.assertEqual(society_request["icon"], self.data["icon"])
        self.assertEqual(
            society_request["from_student"].id,
            self.data["from_student"],
        )

    def test_society_requests_create(self):
        """Test society request creation function correctly"""
        factory = APIRequestFactory()
        request = factory.post("/")
        request.user = self.student1

        self.serializer = SocietyRequestSerializer(data=self.data, context={"request": request})
        self._assert_serializer_is_valid()
        society_request = self.serializer.save()

        self.assertEqual(society_request.society.id, self.data["society"])
        self.assertEqual(society_request.name, self.data["name"])
        self.assertEqual(society_request.category, self.data["category"])
        self.assertEqual(society_request.approved, self.data["approved"])
        self.assertEqual(society_request.intent, self.data["intent"])
        self.assertEqual(society_request.icon, self.data["icon"])
        self.assertEqual(society_request.from_student.id, self.data["from_student"])

    def test_society_request_update(self):
        """Test society request update functions correctly"""
        self.assertFalse(self.society_request.approved)

        self.serializer = SocietyRequestSerializer(
            instance=self.society_request,
            data=self.data,
            partial=True,
        )
        self._assert_serializer_is_valid()
        self.serializer.save()

        self.assertTrue(self.society_request.approved)
        self.assertIsNotNone(self.society_request.icon)

    def test_serializer_showreel_images(self):
        """Test that SocietyRequestSerializer returns showreel images correctly."""
        image1 = self.get_image("1")
        image2 = self.get_image("2")

        SocietyShowreelRequest.objects.create(
            society=self.society_request,
            photo=image1,
            caption="First image caption"
        )
        SocietyShowreelRequest.objects.create(
            society=self.society_request,
            photo=image2,
            caption="Second image caption"
        )

        serializer = SocietyRequestSerializer(instance=self.society_request)
        data = serializer.data

        self.assertIn("showreel_images_request", data)

        self.assertEqual(
            len(data["showreel_images_request"]), 2,
            f"showreel_images_request : {data['showreel_images_request']}"
        )

        photos = {img["photo"] for img in data["showreel_images_request"]}
        self.assertIn("/api/media/society_showreel_request/test_photo1.jpeg", photos)
        self.assertIn("/api/media/society_showreel_request/test_photo2.jpeg", photos)

        captions = {img["caption"] for img in data["showreel_images_request"]}
        self.assertIn("First image caption", captions)
        self.assertIn("Second image caption", captions)

    def _assert_serializer_is_valid(self):
        if not self.serializer.is_valid():
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
        for society in Society.objects.all():
            if society.icon:
                delete_file(society.icon.path)
        for society in SocietyRequest.objects.all():
            if society.icon:
                delete_file(society.icon.path)
        for student in Student.objects.all():
            if student.icon:
                delete_file(student.icon.path)
        for showreel in SocietyShowreelRequest.objects.all():
            if showreel.photo:
                delete_file(showreel.photo.path)