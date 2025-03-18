from django.core.exceptions import ValidationError
from django.test import TestCase
from api.models import Student, Society, User, SocietyRequest
from api.tests.file_deletion import delete_file

# pylint: disable=no-member


class SocietyRequestTestCase(TestCase):
    """
    Unit Tests for the UserRequest model
    """

    def setUp(self):
        self.admin = User.objects.create(
            username="admin_user",
            first_name="John",
            last_name="Smith",
            email="admin@example.com",
            role="admin",
            password="adminpassword",
        )
        self.admin.save()

        self.student = Student.objects.create(
            username="test_student",
            first_name="Alice",
            last_name="Johnson",
            email="alice.johnson@example.com",
            major="Computer Science",
        )
        self.student.save()

        self.society = Society(
            name="Tech",
            president=self.student,
            approved_by=self.admin,
            category="Technology",
            social_media_links={"Email": "techsociety@example.com"},
            membership_requirements="Members must attend at least 3 events per semester",
            upcoming_projects_or_plans="Plan to host a Tech Fest in May",
        )
        self.society.save()

        self.society_request = SocietyRequest.objects.create(
            society=self.society,
            name="Tech",
            roles={"Treasurer": self.student.id},
            president=self.student,
            category="Technology",
            from_student=self.student,
            intent="CreateSoc",
        )

    def test_valid_society_request(self):
        """Test that our example request is valid"""
        self._assert_society_request_is_valid()

    def test_name_not_required(self):
        """Test that the name field doesn't have to be populated"""
        self.society_request.name = None
        self._assert_society_request_is_valid()

    def test_roles_not_required(self):
        """Test that the roles field doesn't have to be populated"""
        self.society_request.roles = None
        self._assert_society_request_is_valid()

    def test_president_not_required(self):
        """Test that the president field doesn't have to be populated"""
        self.society_request.president = None
        self._assert_society_request_is_valid()

    def test_category_not_required(self):
        """Test that the category field doesn't have to be populated"""
        self.society_request.category = None
        self._assert_society_request_is_valid()

    def _assert_society_request_is_valid(self):
        try:
            self.society_request.full_clean()
        except ValidationError:
            self.fail("Test society should be valid")

    def _assert_society_request_is_invalid(self):
        with self.assertRaises(ValidationError):
            self.society_request.full_clean()

    def tearDown(self):
        for society in Society.objects.all():
            if society.icon:
                delete_file(society.icon.path)
        for student in Student.objects.all():
            if student.icon:
                delete_file(student.icon.path)
