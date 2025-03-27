from django.test import TestCase
from django.utils.timezone import now
from api.models import Award, Student, AwardStudent
from api.serializers import AwardStudentSerializer

# pylint: disable=no-member


class AwardSerializerTestCase(TestCase):
    """ Unit tests for the Event Serializer """

    def setUp(self):
        """Set up Award and AwardSerializer objects"""
        self.award = Award.objects.create(
            rank="Bronze",
            title="Event Attender",
            description="For attending all events for their society",
            is_custom=True
        )

        self.student = Student.objects.create_user(
            username="existing_student",
            password="Password123",
            first_name="Jane",
            last_name="Doe",
            email="existing_email@example.com",
            role="student",
            major="Computer Science",
        )

        self.award_student = AwardStudent.objects.create(
            award=self.award,
            student=self.student
        )

        # Serializer data
        self.serializer = None
        self.data = {
            "award_id": self.award.id,
            "student_id": self.student.id,
            "awarded_at": now(),
        }

    def test_award_student_serialization(self):
        """Test to ensure the serializer is correctly serializing"""
        self.serializer = AwardStudentSerializer(instance=self.award_student)
        data = self.serializer.data

        self.assertEqual(data["award"]["id"], self.award_student.award.id)
        self.assertEqual(data["student"]["id"], self.award_student.student.id)
        self.compare_string_to_datetime(
            data["awarded_at"],
            self.award_student.awarded_at
        )

    def test_award_student_deserialization(self):
        """Test to ensure deserialization functions correctly"""
        self.serializer = AwardStudentSerializer(data=self.data)
        self._assert_serializer_is_valid()
        award_student = self.serializer.validated_data

        self.assertEqual(award_student["award"].id, self.data["award_id"])
        self.assertEqual(award_student["student"].id, self.data["student_id"])

    def test_award_student_create(self):
        """Test society request creation function correctly"""
        self.serializer = AwardStudentSerializer(data=self.data)
        self._assert_serializer_is_valid()
        award_student = self.serializer.save()

        self.assertEqual(award_student.award.id, self.data["award_id"])
        self.assertEqual(award_student.student.id, self.data["student_id"])
        self.assertEqual(award_student.awarded_at.year, self.data["awarded_at"].year)
        self.assertEqual(award_student.awarded_at.month, self.data["awarded_at"].month)
        self.assertEqual(award_student.awarded_at.day, self.data["awarded_at"].day)
        self.assertEqual(award_student.awarded_at.hour, self.data["awarded_at"].hour)
        self.assertEqual(award_student.awarded_at.minute, self.data["awarded_at"].minute)
        self.assertAlmostEqual(award_student.awarded_at.second, self.data["awarded_at"].second)

    def test_award_student_update(self):
        """Test society request update functions correctly"""
        student2 = Student.objects.create_user(
            username="also_existing_student",
            password="Password123",
            first_name="John",
            last_name="Doe",
            email="also_existing_email@example.com",
            role="student",
            major="Computer Science",
        )

        self.assertEqual(self.award_student.student.id, self.student.id)
        self.data["student_id"] = student2.id

        self.serializer = AwardStudentSerializer(
            instance=self.award_student,
            data=self.data,
            partial=True,
        )
        self._assert_serializer_is_valid()
        self.serializer.save()

        self.assertEqual(self.award_student.student.id, student2.id)

    def _assert_serializer_is_valid(self):
        if not self.serializer.is_valid():
            self.fail(f"Test serializer should be valid\n{self.serializer.errors}")

    def _assert_serializer_is_invalid(self):
        if self.serializer.is_valid():
            self.fail("Test serializer should be invalid")

    def compare_string_to_datetime(self, s, d):
        """Evaluates whether the string is equivalent to a datetime representation"""
        s_list = s.split("T")
        s_list[0] = s_list[0].split("-")
        s_list[1] = s_list[1].split(":")
        s_list[1][2] = s_list[1][2].split(".")[0]

        self.assertEqual(int(s_list[0][0]), d.year)
        self.assertEqual(int(s_list[0][1]), d.month)
        self.assertEqual(int(s_list[0][2]), d.day)
        self.assertEqual(int(s_list[1][0]), d.hour)
        self.assertEqual(int(s_list[1][1]), d.minute)
        self.assertEqual(int(s_list[1][2]), d.second)
