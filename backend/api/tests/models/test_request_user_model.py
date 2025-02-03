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
            intent="CreateUse",
            major="CompSci"
        )

    def test_valid_user_request(self):
        """Test that our example request is valid"""
        self._assert_user_request_is_valid()

    def test_name_not_required(self):
        """Test that the name field doesn't have to be populated"""
        self.user_request.major = None
        self._assert_user_request_is_valid()

    def _assert_user_request_is_valid(self):
        try:
            self.user_request.full_clean()
        except ValidationError:
            self.fail("Test society should be valid")

    def _assert_user_request_is_invalid(self):
        with self.assertRaises(ValidationError):
            self.user_request.full_clean()
