from django.core.exceptions import ValidationError
from django.test import TestCase
from api.models import Student, UserRequest

# pylint: disable=no-member


class UserRequestTestCase(TestCase):
    """
    Unit Tests for the UserRequest model
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
            description="Attempting account creation",
            intent="CreateUse",
            student=self.student,
        )

    def test_student_required(self):
        """Test UserRequest.student is a required field """
        self._assert_user_request_is_valid()
        self.user_request.student = None
        self._assert_user_request_is_invalid()

    def _assert_user_request_is_valid(self):
        try:
            self.user_request.full_clean()
        except ValidationError:
            self.fail("Test society should be valid")

    def _assert_user_request_is_invalid(self):
        with self.assertRaises(ValidationError):
            self.user_request.full_clean()
