from django.core.exceptions import ValidationError
from django.test import TestCase
from api.models import Admin


class AdminModelTestCase(TestCase):
    def setUp(self):
        # 创建测试管理员
        self.admin = Admin.objects.create(
            username='test_admin',
            first_name='Bob',
            last_name='Smith',
            email='bob.smith@example.com',
        )

    def test_admin_creation(self):
        """测试管理员创建"""
        self.assertEqual(self.admin.username, 'test_admin')
        self.assertEqual(self.admin.first_name, 'Bob')
        self.assertEqual(self.admin.last_name, 'Smith')
        self.assertEqual(self.admin.email, 'bob.smith@example.com')

    def test_admin_role(self):
        """测试管理员角色"""
        self.assertEqual(self.admin.role, 'admin')

    def test_admin_superuser_status(self):
        """测试管理员是否是超级用户"""
        self.assertTrue(self.admin.is_superuser)
        self.assertTrue(self.admin.is_staff)

    def test_admin_full_name(self):
        """测试管理员的 full_name 属性"""
        self.assertEqual(self.admin.full_name, 'Bob Smith')