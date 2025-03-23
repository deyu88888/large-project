from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils.timezone import now
from api.models import Award, Student, AwardStudent

# pylint: disable=no-member


class AwardStudentModelTestCase(TestCase):
    """Unit tests for the Award model"""
    def setUp(self):
        self.award = Award.objects.create(
            rank="Bronze",
            title="Event Attender",
            description="For attending all events for their society"
        )
        self.student = Student.objects.create(
            username='test_student',
            first_name='Alice',
            last_name='Johnson',
            email='alice.johnson@example.com',
            major='Computer Science',
        )
        self.award_student = AwardStudent.objects.create(
            award=self.award,
            student=self.student
        )

    def test_validity(self):
        """Test that defined self.award_student is valid"""
        self._assert_award_student_is_valid()

    def test_timestamp(self):
        """Test that upon awarding, the time is recorded in awarded_at"""
        self.award_student.award = self.award
        time = now()
        self.assertEqual(self.award_student.awarded_at.hour, time.hour)
        self.assertEqual(self.award_student.awarded_at.minute, time.minute)
        self.assertEqual(self.award_student.awarded_at.second, time.second)

    def test_foreign_key_integrity(self):
        """Test that foreign keys must point to valid references"""
        self.award_student.award = None
        self._assert_award_student_is_invalid()
        self.award_student.award = self.award
        self.award_student.student = None
        self._assert_award_student_is_invalid()

    def test_string_representation(self):
        """Test that AwardStudent string is represented properly"""
        self.assertEqual(
            str(self.award_student),
            f"{self.student}, ({self.award})"
        )

    def _assert_award_student_is_valid(self):
        try:
            self.award_student.full_clean()
        except ValidationError:
            self.fail('Test award_student should be valid')

    def _assert_award_student_is_invalid(self):
        with self.assertRaises(ValidationError):
            self.award_student.full_clean()
