from django.core.exceptions import ValidationError
from django.test import TestCase
from api.models import Admin


class AdminModelTestCase(TestCase):
    def setUp(self):
        # create admin user
        self.admin = Admin.objects.create(
            username='test_admin',
            first_name='Bob',
            last_name='Smith',
            email='bob.smith@example.com',
        )

    def test_admin_creation(self):
        """test admin is created"""
        self.assertEqual(self.admin.username, 'test_admin')
        self.assertEqual(self.admin.first_name, 'Bob')
        self.assertEqual(self.admin.last_name, 'Smith')
        self.assertEqual(self.admin.email, 'bob.smith@example.com')

    def test_admin_role(self):
        """test admin role is admin"""
        self.assertEqual(self.admin.role, 'admin')

    def test_admin_superuser_status(self):
        """test admin is superuser and staff"""
        self.assertTrue(self.admin.is_superuser)
        self.assertTrue(self.admin.is_staff)

    def test_admin_full_name(self):
        """test full_name property"""
        self.assertEqual(self.admin.full_name, 'Bob Smith')