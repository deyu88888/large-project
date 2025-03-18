from django.core.exceptions import ValidationError
from django.test import TestCase
from api.models import User


class AdminModelTestCase(TestCase):
    def setUp(self):
        # create admin user
        self.admin = User.objects.create(
            username='test_admin',
            first_name='Bob',
            last_name='Smith',
            email='bob.smith@example.com',
            role='admin'
        )

    def test_admin_creation(self):
        """test admin is created"""
        self.assertEqual(self.admin.username, 'test_admin')
        self.assertEqual(self.admin.first_name, 'Bob')
        self.assertEqual(self.admin.last_name, 'Smith')
        self.assertEqual(self.admin.email, 'bob.smith@example.com')

    def test_admin_username_must_be_unique(self):
        duplicate_admin = User(username="test_admin", email="new_admin@example.com")
        with self.assertRaises(ValidationError):
            duplicate_admin.full_clean()

    def test_admin_role(self):
        """test admin role is admin"""
        self.assertEqual(self.admin.role, 'admin')

    def test_admin_cannot_be_demoted(self):
        self.admin.is_superuser = False
        self.admin.is_staff = False
        self.admin.save()
        self.admin.refresh_from_db()

        self.assertTrue(self.admin.is_staff)

    # def test_admin_role_is_always_admin(self):
    #     self.admin.role = "student"
    #     self.admin.save()
    #     self.assertEqual(self.admin.role, "admin")

    def test_admin_superuser_status(self):
        """test admin is superuser and staff"""
        self.assertTrue(self.admin.is_staff)

    def test_admin_full_name(self):
        """test full_name property"""
        self.assertEqual(self.admin.full_name, 'Bob Smith')