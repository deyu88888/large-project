from django.test import TestCase
from django.utils import timezone
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
            approved_by=None,
            roles={"Treasurer": self.student2.id},
            status="Pending",
            category="Informatics",
        )
        self.society.society_members.add(self.student2)

        # Create a request for a society
        self.society_request = SocietyRequest.objects.create(
            from_student=self.student1,
            approved=False,
            description="Saw no tech socieites",
            intent="CreateSoc",
            society=self.society,
        )

        # Serializer data
        self.serializer = None
        self.data = {
            "from_student": self.student1.id,
            "requested_at": timezone.now(),
            "approved": True,
            "description": "Saw no tech societies",
            "intent": "CreateSoc",
            "society": self.society.id,
        }

    def test_society_request_serialization(self):
        """Test to ensure serialization function correctly"""

        self.serializer = SocietyRequestSerializer(instance=self.society_request)
        data = self.serializer.data

        self.assertEqual(
            self.society_request.from_student.id,
            data["from_student"]
        )
        self.assertEqual(
            self.society_request.approved,
            data["approved"]
        )
        self.assertEqual(
            self.society_request.description,
            data["description"]
        )
        self.assertEqual(
            self.society_request.intent,
            data["intent"]
        )
        self.assertEqual(
            self.society_request.society.id,
            data["society"]
        )

    def test_society_request_deserialization(self):
        """Test to ensure deserialization functions correctly"""

        self.serializer = SocietyRequestSerializer(data=self.data)
        self._assert_serializer_is_valid()
        society_request = self.serializer.save()

        self.assertEqual(society_request.approved, self.data["approved"])
        self.assertEqual(society_request.intent, self.data["intent"])
        self.assertEqual(society_request.society.id, self.data["society"])

        self.assertEqual(
            society_request.description,
            self.data["description"]
        )
        self.assertEqual(
            society_request.from_student.id,
            self.data["from_student"]
        )

    def test_society_requests_create(self):
        """Test society request creation function correctly"""

        self.serializer = SocietyRequestSerializer(data=self.data)
        self._assert_serializer_is_valid()
        society_request = self.serializer.save()

        self.assertEqual(society_request.approved, self.data["approved"])
        self.assertEqual(society_request.intent, self.data["intent"])
        self.assertEqual(society_request.society.id, self.data["society"])

        self.assertEqual(
            society_request.description,
            self.data["description"]
        )
        self.assertEqual(
            society_request.from_student.id,
            self.data["from_student"]
        )

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

    def _assert_serializer_is_valid(self):
        if not self.serializer.is_valid():
            print(f'Errors: {self.serializer.errors}')
            self.fail("Test serializer should be valid")

    def _assert_serializer_is_invalid(self):
        if self.serializer.is_valid():
            self.fail("Test serializer should be invalid")
