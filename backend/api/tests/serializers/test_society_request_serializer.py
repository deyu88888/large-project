from django.test import TestCase
from api.models import Society, Admin, Student, SocietyRequest
from api.serializers import SocietyRequestSerializer


class SocietySerializerTestCase(TestCase):
    """ Unit tests for the Society serializer """

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
            roles={"Treasurer": self.student2.id},
        )
        self.society.society_members.add(self.student2)

        # Serializer data
        self.serializer = None
        self.data = {
            "name": "Music",
            "leader": self.student1.id,
            "society_members": [self.student2.id],
            "approved_by": self.admin.id,
            "roles": [],
        }

    def test_society_serialization(self):
        """ Test to ensure the serializer is correctly serializing """

        self.serializer = SocietyRequestSerializer(instance=self.society)
        data = self.serializer.data

    def test_society_deserialization(self):
        """ Test to ensure deserialization functions correctly """

        self.serializer = SocietyRequestSerializer(data=self.data)
        self._assert_serializer_is_valid()

        society = self.serializer.save()

    def test_society_create(self):
        """ Test society creation function correctly """

        self.serializer = SocietyRequestSerializer(data=self.data)
        self._assert_serializer_is_valid()

        society = self.serializer.save()

    def test_society_request_update(self):
        """ Test society update functions correctly """

        self.serializer = SocietyRequestSerializer(
            instance=self.society,
            data=self.data,
            partial=True,
        )
        self._assert_serializer_is_valid()

        self.serializer.save()

    def _assert_serializer_is_valid(self):
        if not self.serializer.is_valid():
            self.fail("Test serializer should be valid")

    def _assert_serializer_is_invalid(self):
        if self.serializer.is_valid():
            self.fail("Test serializer should be invalid")