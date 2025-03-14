from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from api.models import User, Event, Comment
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken


class EventCommentsViewTestCase(TestCase):
    """Unit tests for the Event Comments View."""

    def setUp(self):
        self.client = APIClient()

        self.user = User.objects.create_user(
            username="testuser",
            email="testuser@example.com",
            password="securepassword"
        )
        self.event = Event.objects.create(
            title="Test Event",
            description="This is a test event",
            location="Online",
            status="Approved"
        )
        self.comment = Comment.objects.create(
            event=self.event,
            user=self.user,
            content="This is a test comment"
        )

        # 生成 JWT Token
        refresh = RefreshToken.for_user(self.user)
        self.token = str(refresh.access_token)

        # 设置 JWT 认证头
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

    def test_get_event_comments(self):
        """Test retrieving all top-level comments for an event."""
        url = reverse("comment_list_create") + f"?event_id={self.event.id}"  # ✅ 正确方式
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["content"], "This is a test comment")

    def test_get_event_comments_missing_event_id(self):
        """Test retrieving comments without providing event_id should return 400."""
        response = self.client.get(reverse("comment_list_create"))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_post_event_comment(self):
        """Test creating a new comment on an event."""
        self.client.login(username="testuser", password="securepassword")
        payload = {
            "event": self.event.id,
            "content": "New event comment"
        }
        response = self.client.post(reverse("comment_list_create"), data=payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["content"], "New event comment")

    def test_post_event_comment_unauthenticated(self):
        """Test that unauthenticated users cannot post a comment."""
        self.client.logout()

        payload = {
            "event": self.event.id,
            "content": "New event comment"
        }
        response = self.client.post(reverse("comment_list_create"), data=payload)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_like_comment(self):
        """Test liking a comment."""
        self.client.login(username="testuser", password="securepassword")
        url = reverse("like_comment", kwargs={"comment_id": self.comment.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "liked")

    def test_dislike_comment(self):
        """Test disliking a comment."""
        self.client.login(username="testuser", password="securepassword")
        url = reverse("dislike_comment", kwargs={"comment_id": self.comment.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "disliked")
