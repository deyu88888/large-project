from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from api.models import User
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken


class ToggleFollowTestCase(TestCase):
    """Unit tests for the toggle_follow view."""

    def setUp(self):
        self.client = APIClient()

        self.user1 = User.objects.create_user(username="user1", email="user1@example.com", password="password123")
        self.user2 = User.objects.create_user(username="user2", email="user2@example.com", password="password123")

        refresh = RefreshToken.for_user(self.user1)
        self.token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

    def test_follow_user(self):
        """Test following another user."""
        url = reverse("toggle_follow", kwargs={"user_id": self.user2.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Followed successfully.")
        self.assertTrue(self.user2 in self.user1.following.all())

    def test_unfollow_user(self):
        """Test unfollowing a user after following them."""
        self.user1.following.add(self.user2)
        url = reverse("toggle_follow", kwargs={"user_id": self.user2.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Unfollowed successfully.")
        self.assertFalse(self.user2 in self.user1.following.all())

    def test_cannot_follow_self(self):
        """Test that a user cannot follow themselves."""
        url = reverse("toggle_follow", kwargs={"user_id": self.user1.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "You cannot follow yourself.")

    def test_follow_unauthenticated(self):
        """Test that unauthenticated users cannot follow others."""
        self.client.logout()
        self.client.credentials()
        url = reverse("toggle_follow", kwargs={"user_id": self.user2.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
