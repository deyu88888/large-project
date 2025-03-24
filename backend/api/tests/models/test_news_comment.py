from django.test import TestCase
from django.utils import timezone
from django.db import IntegrityError
from api.models import NewsComment, SocietyNews, Society, Student, User


class NewsCommentModelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin_user = User.objects.create_user(
            username="admin_user",
            email="admin@example.com",
            password="password123",
            role="admin",
            is_staff=True
        )
        
        cls.student1 = Student.objects.create_user(
            username="student1",
            email="student1@example.com",
            password="password123",
            role="student",
            first_name="Student",
            last_name="One",
            status="Approved"
        )
        
        cls.student2 = Student.objects.create_user(
            username="student2",
            email="student2@example.com",
            password="password123",
            role="student",
            first_name="Student",
            last_name="Two",
            status="Approved"
        )
        
        cls.society = Society.objects.create(
            name="Test Society",
            description="A test society",
            status="Approved",
            president=cls.student1,
            approved_by=cls.admin_user
        )
        
        cls.news_post = SocietyNews.objects.create(
            society=cls.society,
            title="Test News Post",
            content="This is a test news post content.",
            author=cls.student1,
            status="Published"
        )
        
        cls.comment = NewsComment.objects.create(
            news_post=cls.news_post,
            user=cls.student1,
            content="This is a test comment."
        )

    def test_comment_creation(self):
        self.assertEqual(self.comment.content, "This is a test comment.")
        self.assertEqual(self.comment.user, self.student1)
        self.assertEqual(self.comment.news_post, self.news_post)
        self.assertIsNone(self.comment.parent_comment)
        self.assertEqual(self.comment.total_likes, 0)
        self.assertEqual(self.comment.total_dislikes, 0)
        self.assertIsNotNone(self.comment.created_at)

    def test_string_representation(self):
        expected = f"Comment by {self.student1.username} on {self.news_post.title}"
        self.assertEqual(str(self.comment), expected)

    def test_reply_to_comment(self):
        reply = NewsComment.objects.create(
            news_post=self.news_post,
            user=self.student2,
            content="This is a reply to the test comment.",
            parent_comment=self.comment
        )
        
        self.assertEqual(reply.parent_comment, self.comment)
        self.assertEqual(self.comment.total_replies(), 1)
        self.assertIn(reply, self.comment.replies.all())

    def test_nested_replies(self):
        reply1 = NewsComment.objects.create(
            news_post=self.news_post,
            user=self.student2,
            content="First level reply",
            parent_comment=self.comment
        )
        
        reply2 = NewsComment.objects.create(
            news_post=self.news_post,
            user=self.student1,
            content="Second level reply",
            parent_comment=reply1
        )
        
        self.assertEqual(self.comment.total_replies(), 1)
        self.assertEqual(reply1.total_replies(), 1)
        self.assertEqual(reply2.total_replies(), 0)

    def test_like_comment(self):
        self.comment.likes.add(self.student2)
        
        self.assertEqual(self.comment.total_likes, 1)
        self.assertTrue(self.comment.liked_by(self.student2))
        self.assertFalse(self.comment.liked_by(self.student1))

    def test_dislike_comment(self):
        self.comment.dislikes.add(self.student2)
        
        self.assertEqual(self.comment.total_dislikes, 1)
        self.assertTrue(self.comment.disliked_by(self.student2))
        self.assertFalse(self.comment.disliked_by(self.student1))

    def test_like_and_dislike_same_comment(self):
        self.comment.likes.add(self.student2)
        self.comment.dislikes.add(self.student2)
        
        self.assertEqual(self.comment.total_likes, 1)
        self.assertEqual(self.comment.total_dislikes, 1)
        self.assertTrue(self.comment.liked_by(self.student2))
        self.assertTrue(self.comment.disliked_by(self.student2))

    def test_multiple_users_reactions(self):
        self.comment.likes.add(self.student1, self.student2)
        
        self.assertEqual(self.comment.total_likes, 2)
        self.assertTrue(self.comment.liked_by(self.student1))
        self.assertTrue(self.comment.liked_by(self.student2))

    def test_remove_like(self):
        self.comment.likes.add(self.student2)
        self.assertEqual(self.comment.total_likes, 1)
        
        self.comment.likes.remove(self.student2)
        self.assertEqual(self.comment.total_likes, 0)
        self.assertFalse(self.comment.liked_by(self.student2))

    def test_delete_news_post_cascades_to_comments(self):
        comment_id = self.comment.id
        self.news_post.delete()
        
        with self.assertRaises(NewsComment.DoesNotExist):
            NewsComment.objects.get(id=comment_id)

    def test_delete_user_cascades_to_comments(self):
        # Create a separate user that's not linked to other objects
        test_user = User.objects.create_user(
            username="test_only_user",
            email="testonly@example.com",
            password="password123"
        )
        
        # Create a comment by this user
        test_comment = NewsComment.objects.create(
            news_post=self.news_post,
            user=test_user,
            content="Comment that will be deleted with user"
        )
        
        comment_id = test_comment.id
        test_user.delete()
        
        with self.assertRaises(NewsComment.DoesNotExist):
            NewsComment.objects.get(id=comment_id)

    def test_delete_parent_comment_cascades_to_replies(self):
        reply = NewsComment.objects.create(
            news_post=self.news_post,
            user=self.student2,
            content="This will be deleted with parent",
            parent_comment=self.comment
        )
        
        reply_id = reply.id
        self.comment.delete()
        
        with self.assertRaises(NewsComment.DoesNotExist):
            NewsComment.objects.get(id=reply_id)

    def test_news_post_required(self):
        """Test that news_post is required"""
        with self.assertRaises(IntegrityError):
            NewsComment.objects.create(
                user=self.student2,
                content="Missing news_post"
            )
            
    def test_user_required(self):
        """Test that user is required"""
        # Skip this test if the previous test left a broken transaction
        # This ensures we don't run this test if the database is in a bad state
        from django.db import connection
        if getattr(connection, 'needs_rollback', False):
            self.skipTest("Previous transaction is in a broken state")
            
        # Use transaction.atomic to ensure this test is isolated
        from django.db import transaction
        try:
            with transaction.atomic():
                NewsComment.objects.create(
                    news_post=self.news_post,
                    content="Missing user"
                )
                # If we reach here, no exception was raised - test should fail
                self.fail("IntegrityError was not raised")
        except IntegrityError:
            # This is what we expect, test passes
            pass
    
    def test_ordering(self):
        newer_comment = NewsComment.objects.create(
            news_post=self.news_post,
            user=self.student2,
            content="This is a newer comment"
        )
        
        comments = NewsComment.objects.filter(news_post=self.news_post, parent_comment=None)
        
        self.assertEqual(comments[0], self.comment)
        self.assertEqual(comments[1], newer_comment)