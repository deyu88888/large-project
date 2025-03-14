from django.test import TestCase
from api.models import User, Event, Comment


class CommentModelTestCase(TestCase):
    """Unit tests for the Comment model."""

    def setUp(self):
        self.user = User.objects.create(
            username="testuser",
            email="testuser@example.com",
            password="securepassword"
        )

        self.event = Event.objects.create(
            title="Test Event",
            description="This is a test event",
            location="Online"
        )

        self.comment = Comment.objects.create(
            event=self.event,
            user=self.user,
            content="This is a test comment"
        )

    def test_comment_creation(self):
        """Test if a comment can be created correctly."""
        self.assertEqual(self.comment.content, "This is a test comment")
        self.assertEqual(self.comment.user, self.user)
        self.assertEqual(self.comment.event, self.event)

    def test_comment_has_creation_timestamp(self):
        """Test that a comment has an automatically generated creation timestamp."""
        self.assertIsNotNone(self.comment.create_at)

    def test_comment_str_representation(self):
        """Test the string representation of a comment."""
        self.assertEqual(str(self.comment), "testuser: This is a test comment")

    def test_comment_likes(self):
        """Test liking a comment."""
        self.comment.likes.add(self.user)
        self.assertEqual(self.comment.total_likes(), 1)

    def test_comment_dislikes(self):
        """Test disliking a comment."""
        self.comment.dislikes.add(self.user)
        self.assertEqual(self.comment.total_dislikes(), 1)

    def test_reply_to_comment(self):
        """Test creating a reply to a comment."""
        reply = Comment.objects.create(
            event=self.event,
            user=self.user,
            content="This is a reply",
            parent_comment=self.comment
        )
        self.assertEqual(reply.parent_comment, self.comment)
        self.assertIn(reply, self.comment.replies.all())
