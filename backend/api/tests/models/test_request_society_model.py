from django.core.exceptions import ValidationError
from django.test import TestCase
from api.models import Student, Society, Admin, SocietyRequest

# pylint: disable=no-member


class UserRequestTestCase(TestCase):
    """
    Unit Tests for the UserRequest model
    """

    def setUp(self):
        self.admin = Admin(
            username='admin_user',
            first_name='John',
            last_name='Smith',
            email='admin@example.com',
            role='admin',
            password='adminpassword',
        )
        self.admin.save()

        self.student = Student.objects.create(
            username='test_student',
            first_name='Alice',
            last_name='Johnson',
            email='alice.johnson@example.com',
            major='Computer Science',
        )
        self.student.save()

        self.society = Society(
            name='Tech',
            leader=self.student,
            approved_by=self.admin,
            category='Technology',
            social_media_links={"email": "techsociety@example.com"},
            timetable="Weekly meetings on Fridays at 5 PM",
            membership_requirements="Members must attend at least 3 events per semester",
            upcoming_projects_or_plans="Plan to host a Tech Fest in May",
        )
        self.society.save()

        self.society_request = SocietyRequest.objects.create(
            from_student=self.student,
            approved=False,
            description="Attempting account creation",
            intent="CreateUse",
            society=self.society,
        )

    def test_student_required(self):
        """Test SocietyRequest.society is a required field """
        self._assert_society_request_is_valid()
        self.society_request.society = None
        self._assert_society_request_is_invalid()

    def _assert_society_request_is_valid(self):
        try:
            self.society_request.full_clean()
        except ValidationError:
            self.fail("Test society should be valid")

    def _assert_society_request_is_invalid(self):
        with self.assertRaises(ValidationError):
            self.society_request.full_clean()
