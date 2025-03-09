from io import BytesIO
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from api.models import Society, Admin, Student, SocietyShowreel
from api.serializers import SocietySerializer
from api.tests.file_deletion import delete_file


class SocietySerializerTestCase(TestCase):
    """ Unit tests for SocietySerializer """

    def setUp(self):
        # Create an Admin user
        self.admin = Admin.objects.create(
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

        # Create a Society
        self.society = Society.objects.create(
            name="Tech",
            leader=self.student1,
            approved_by=self.admin,
        )
        self.society.society_members.add(self.student2)

        # Serializer data
        self.serializer = None
        self.data = {
            "name": "Music",
            "leader_id": self.student1.id,
            "society_members": [self.student2.id, self.student1.id],
            "approved_by": self.admin.id,
        }

    def test_society_serialization(self):
        """ Test to ensure the serializer is correctly serializing """

        self.serializer = SocietySerializer(instance=self.society)
        data = self.serializer.data

        self.assertEqual(data["name"], self.society.name)
        self.assertEqual(data["leader"]["id"], self.society.leader.id)
        self.assertEqual(data["approved_by"], self.society.approved_by.id)
        self.assertEqual(
            data["society_members"],
            list(self.society.society_members.values_list("id", flat=True)),
        )

    def test_society_deserialization(self):
        """ Test to ensure deserialization functions correctly """

        self.serializer = SocietySerializer(data=self.data)
        self._assert_serializer_is_valid()

        society = self.serializer.save()

        self.assertEqual(society.name, self.data["name"])
        self.assertEqual(society.leader.id, self.data["leader_id"])
        self.assertEqual(
            list(society.society_members.values_list("id", flat=True)),
            self.data["society_members"],
        )
        self.assertEqual(society.approved_by.id, self.data["approved_by"])

    def test_society_create(self):
        """ Test society creation function correctly """

        self.serializer = SocietySerializer(data=self.data)
        self._assert_serializer_is_valid()

        society = self.serializer.save()

        self.assertEqual(society.name, self.data["name"])
        self.assertEqual(society.leader.id, self.data["leader_id"])
        self.assertEqual(
            list(society.society_members.values_list("id", flat=True)),
            self.data["society_members"],
        )
        self.assertEqual(society.approved_by.id, self.data["approved_by"])

    def test_society_update(self):
        """ Test society update functions correctly """

        self.serializer = SocietySerializer(
            instance=self.society,
            data=self.data,
            partial=True,
        )
        self._assert_serializer_is_valid()

        self.serializer.save()

        self.assertEqual(self.society.name, self.data["name"])
        self.assertEqual(self.society.leader.id, self.data["leader_id"])
        self.assertEqual(
            list(self.society.society_members.values_list("id", flat=True)),
            self.data["society_members"],
        )
        self.assertEqual(self.society.approved_by.id, self.data["approved_by"])

    def test_serializer_showreel_images(self):
        """Test that SocietySerializer returns showreel images correctly."""
        image1 = self.get_image("1")
        image2 = self.get_image("2")

        SocietyShowreel.objects.create(
            society=self.society,
            photo=image1,
            caption="First image caption"
        )
        SocietyShowreel.objects.create(
            society=self.society,
            photo=image2,
            caption="Second image caption"
        )

        serializer = SocietySerializer(instance=self.society)
        data = serializer.data

        self.assertIn("showreel_images", data)

        self.assertEqual(
            len(data["showreel_images"]), 2,
            f"showreel_images : {data['showreel_images']}"
        )

        photos = {img["photo"] for img in data["showreel_images"]}
        self.assertIn("/media/society_showreel/test_photo1.jpg", photos)
        self.assertIn("/media/society_showreel/test_photo2.jpg", photos)

        captions = {img["caption"] for img in data["showreel_images"]}
        self.assertIn("First image caption", captions)
        self.assertIn("Second image caption", captions)

    def _assert_serializer_is_valid(self):
        if not self.serializer.is_valid():
            self.fail(f"Test serializer should be valid: {self.serializer.errors}")

    def _assert_serializer_is_invalid(self):
        if self.serializer.is_valid():
            self.fail(f"Test serializer should be invalid: {self.serializer.errors}")

    def get_image(self, s):
        """Returns an image to be used for testing"""
        image = Image.new('RGB', (1, 1), color='red')
        image_io = BytesIO()
        image.save(image_io, format='JPEG')
        image_io.seek(0)

        uploaded_icon = SimpleUploadedFile(
            f"test_photo{s}.jpg",
            image_io.getvalue(),
            content_type="image/jpeg"
        )

        return uploaded_icon

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
