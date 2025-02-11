from django.test import TestCase
from django.utils import timezone
from api.models import Society, Admin, Student, SocietyRequest
from api.serializers import SocietyRequestSerializer

# pylint: disable=no-member


class SocietyRequestSerializerTestCase(TestCase):
    """
    Unit tests for the Society serializer
    """

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
            society=self.society,
            name="Tech",
            roles={"Treasurer": self.student2.id},
            leader=self.student1,
            category="Technology",
            from_student=self.student1,
            intent="CreateSoc",
        )

        # Serializer data
        self.serializer = None
        self.data = {
            "society": self.society.id,
            "name": "Tech",
            "roles": {"Treasurer": self.student2.id},
            "leader": self.student1.id,
            "category": "Technology",
            "requested_at": timezone.now(),
            "approved": True,
            "from_student": self.student1.id,
            "intent": "CreateSoc",
        }

    def test_society_request_serialization(self):
        """Test to ensure serialization function correctly"""
        self.serializer = SocietyRequestSerializer(instance=self.society_request)
        data = self.serializer.data

        self.assertEqual(self.society_request.society.id, data["society"])
        self.assertEqual(self.society_request.name, data["name"])
        self.assertEqual(self.society_request.roles, data["roles"])
        self.assertEqual(self.society_request.leader.id, data["leader"])
        self.assertEqual(self.society_request.category, data["category"])
        self.assertEqual(self.society_request.approved, data["approved"])
        self.assertEqual(self.society_request.intent, data["intent"])
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
        self.assertEqual(society_request["roles"], self.data["roles"])
        self.assertEqual(society_request["leader"].id, self.data["leader"])
        self.assertEqual(society_request["category"], self.data["category"])
        self.assertEqual(society_request["approved"], self.data["approved"])
        self.assertEqual(society_request["intent"], self.data["intent"])
        self.assertEqual(
            society_request["from_student"].id,
            self.data["from_student"],
        )

    def test_society_requests_create(self):
        """Test society request creation function correctly"""
        self.serializer = SocietyRequestSerializer(data=self.data)
        self._assert_serializer_is_valid()
        society_request = self.serializer.save()

        self.assertEqual(society_request.society.id, self.data["society"])
        self.assertEqual(society_request.name, self.data["name"])
        self.assertEqual(society_request.roles, self.data["roles"])
        self.assertEqual(society_request.leader.id, self.data["leader"])
        self.assertEqual(society_request.category, self.data["category"])
        self.assertEqual(society_request.approved, self.data["approved"])
        self.assertEqual(society_request.intent, self.data["intent"])
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
