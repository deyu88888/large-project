"""Unit tests for the User model."""
import os

from django.conf import settings
from django.core.exceptions import ValidationError
from django.test import TestCase
from api.models import User


class UserModelTestCase(TestCase):
    """Unit tests for the User model."""

    fixtures = [
        os.path.join(settings.BASE_DIR, 'api', 'tests', 'fixtures', 'default_user.json'),
        os.path.join(settings.BASE_DIR, 'api', 'tests', 'fixtures', 'other_users.json'),
    ]

    def setUp(self):
        self.user = User.objects.get(username='johndoe')

    def test_valid_user(self):
        self._assert_user_is_valid()

    def test_username_cannot_be_blank(self):
        self.user.username = ''
        self._assert_user_is_invalid()

    def test_username_can_be_30_characters_long(self):
        self.user.username = 'x' * 30
        self._assert_user_is_valid()

    def test_username_cannot_be_over_30_characters_long(self):
        self.user.username = 'x' * 31
        self._assert_user_is_invalid()

    def test_username_with_invalid_characters(self):
        self.user.username = 'invalid@user!'
        self._assert_user_is_invalid()

    def test_username_with_spaces(self):
        self.user.username = 'invalid user'
        self._assert_user_is_invalid()

    def test_username_case_sensitivity(self):
        user1 = User.objects.create(username='UserName', email='user1@example.com')
        user2 = User(username='username', email='user2@example.com')
        with self.assertRaises(ValidationError):
            user2.full_clean()

    def test_username_must_be_unique(self):
        second_user = User.objects.get(username='janedoe')
        self.user.username = second_user.username
        self._assert_user_is_invalid()

    def test_first_name_must_not_be_blank(self):
        self.user.first_name = ''
        self._assert_user_is_invalid()

    def test_first_name_may_contain_50_characters(self):
        self.user.first_name = 'x' * 50
        self._assert_user_is_valid()

    def test_first_name_must_not_contain_more_than_50_characters(self):
        self.user.first_name = 'x' * 51
        self._assert_user_is_invalid()

    def test_last_name_must_not_be_blank(self):
        self.user.last_name = ''
        self._assert_user_is_invalid()

    def test_last_name_may_contain_50_characters(self):
        self.user.last_name = 'x' * 50
        self._assert_user_is_valid()

    def test_last_name_must_not_contain_more_than_50_characters(self):
        self.user.last_name = 'x' * 51
        self._assert_user_is_invalid()

    def test_email_must_not_be_blank(self):
        self.user.email = ''
        self._assert_user_is_invalid()

    def test_email_must_be_unique(self):
        second_user = User.objects.get(username='janedoe')
        self.user.email = second_user.email
        self._assert_user_is_invalid()

    def test_full_name_must_be_correct(self):
        full_name = self.user.full_name
        self.assertEqual(full_name, "John Doe")

    def test_user_role_defaults_to_student(self):
        new_user = User.objects.create(username='newstudent', email='newstudent@example.com')
        self.assertEqual(new_user.role, "student")

    def test_user_can_be_admin(self):
        self.user.role = "admin"
        self.user.save()
        self.assertTrue(self.user.is_admin())
        self.assertFalse(self.user.is_student())

    def test_user_can_be_student(self):
        self.user.role = "student"
        self.user.save()
        self.assertTrue(self.user.is_student())
        self.assertFalse(self.user.is_admin())

    def test_following_relationship(self):
        second_user = User.objects.get(username='janedoe')
        self.user.following.add(second_user)
        self.assertIn(second_user, self.user.following.all())

    def test_meta_ordering(self):
        users = User.objects.all()
        self.assertEqual(list(users), sorted(users, key=lambda u: (u.first_name, u.last_name)))

    def _assert_user_is_valid(self):
        try:
            self.user.full_clean()
        except ValidationError:
            self.fail('Test user should be valid')

    def _assert_user_is_invalid(self):
        with self.assertRaises(ValidationError):
            self.user.full_clean()
