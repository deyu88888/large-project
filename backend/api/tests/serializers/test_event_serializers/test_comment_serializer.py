from django.test import TestCase
from api.models import User, Event, Comment
from api.serializers import CommentSerializer


class CommentSerializerTestCase(TestCase):
    """Unit tests for the Comment serializer."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="testuser@example.com",
            password="securepassword"
        )

        self.event = Event.objects.create(
            title="Test Event",
            main_description="This is a test event",
            location="Online"
        )

        self.comment = Comment.objects.create(
            event=self.event,
            user=self.user,
            content="This is a test comment"
        )

    def test_comment_serialization(self):
        """Test if a comment is serialized correctly."""
        serializer = CommentSerializer(instance=self.comment)
        data = serializer.data
        self.assertEqual(data["content"], self.comment.content)
        self.assertEqual(data["user_data"], {"id": self.user.id, "username": self.user.username})
        self.assertEqual(data["likes"], 0)
        self.assertEqual(data["dislikes"], 0)

    def test_comment_deserialization(self):
        """Test if a comment can be deserialized correctly."""
        comment_data = {
            "event": self.event.id,
            "content": "New test comment"
        }
        serializer = CommentSerializer(data=comment_data, context={"request": self.get_request_with_user()})

        self.assertTrue(serializer.is_valid(), serializer.errors)
        comment = serializer.save(user=self.user, event=self.event)
        self.assertEqual(comment.content, "New test comment")
        self.assertEqual(comment.user, self.user)
        self.assertEqual(comment.event, self.event)

    def get_request_with_user(self):
        """Mock a request with an authenticated user."""
        from rest_framework.test import APIRequestFactory
        request = APIRequestFactory().post("/")
        request.user = self.user
        return request

    def test_comment_likes_dislikes(self):
        """Test if likes and dislikes are counted correctly."""
        self.comment.likes.add(self.user)
        serializer = CommentSerializer(instance=self.comment)
        self.assertEqual(serializer.data["likes"], 1)

        self.comment.dislikes.add(self.user)
        serializer = CommentSerializer(instance=self.comment)
        self.assertEqual(serializer.data["dislikes"], 1)

    def test_reply_to_comment(self):
        """Test if replies are serialized correctly."""
        reply = Comment.objects.create(
            event=self.event,
            user=self.user,
            content="This is a reply",
            parent_comment=self.comment
        )
        serializer = CommentSerializer(instance=self.comment)
        self.assertEqual(len(serializer.data["replies"]), 1)
        self.assertEqual(serializer.data["replies"][0]["content"], "This is a reply")

    def test_get_liked_by_user(self):
        """Test if get_liked_by_user works correctly."""
        self.comment.likes.add(self.user)

        request = self.client.get("/")
        request.user = self.user

        serializer = CommentSerializer(instance=self.comment, context={"request": request})
        self.assertTrue(serializer.data["liked_by_user"])

    def test_get_disliked_by_user(self):
        """Test if get_disliked_by_user works correctly."""
        self.comment.dislikes.add(self.user)

        request = self.client.get("/")
        request.user = self.user

        serializer = CommentSerializer(instance=self.comment, context={"request": request})
        self.assertTrue(serializer.data["disliked_by_user"])

