from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone
from api.models import Student, UserRequest

# pylint: disable=no-member


class RequestTestCase(TestCase):
    """
    Unit Tests for the Request model
    Testing only fields of the base class Request
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

        self.request = UserRequest.objects.create(
            from_student=self.student,
            approved=False,
            description="Attempting account creation",
            intent="CreateUse",
            student=self.student,
        )

    def test_valid_intent(self):
        """Test Request can take valid intent values"""
        self.assert_intent_validity("CreateSoc", True)
        self.assert_intent_validity("UpdateSoc", True)
        self.assert_intent_validity("CreateEve", True)
        self.assert_intent_validity("UpdateEve", True)
        self.assert_intent_validity("CreateUse", True)
        self.assert_intent_validity("UpdateUse", True)

    def test_invalid_intent(self):
        """Test Request can't take invalid intent values"""
        self.assert_intent_validity("CreateSociety", False)
        self.assert_intent_validity("AAA", False)
        self.assert_intent_validity(10, False)
        self.assert_intent_validity("Update", False)

    def assert_intent_validity(self, intent, valid):
        """Helper function to avoid code repetition"""
        self.request.intent = intent
        if valid:
            self._assert_request_is_valid()
        else:
            self._assert_request_is_invalid()

    def test_requested_at_is_now(self):
        """Test requested at is assigned to now when created"""
        now = timezone.now()
        self.request.save()
        self.assertEqual(now.hour, self.request.requested_at.hour)
        self.assertEqual(now.minute, self.request.requested_at.minute)
        self.assertEqual(now.second, self.request.requested_at.second)

    def test_approved_defaults_false(self):
        """Test Request.approved defaults to False"""
        temp_request = UserRequest.objects.create(
            from_student=self.student,
            description="Attempting account creation",
            intent="CreateUse",
            student=self.student,
        )
        self.assertFalse(temp_request.approved)

    def test_description_borderline(self):
        """Test Request.description can be 200 chars"""
        self.request.description = 'a' * 200
        self._assert_request_is_valid()

    def test_description_too_long(self):
        """Test Request.description can't be <200 chars"""
        self.request.description = 'a' * 201
        self._assert_request_is_invalid()

    def test_blank_description(self):
        """Test Request.description can be empty"""
        self.request.description = ""
        self._assert_request_is_valid()
        self.request.description = None
        self._assert_request_is_valid()

    def test_from_student_required(self):
        """Test Request.from_student is a required field"""
        self.request.from_student = None
        self._assert_request_is_invalid()

    def _assert_request_is_valid(self):
        try:
            self.request.full_clean()
        except ValidationError:
            self.fail("Test society should be valid")

    def _assert_request_is_invalid(self):
        with self.assertRaises(ValidationError):
            self.request.full_clean()
