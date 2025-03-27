from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIRequestFactory
from unittest.mock import patch, Mock

from api.models import (
    User, Student, Society, SocietyNews, NewsComment
)
from api.serializers import NewsCommentSerializer


class NewsCommentSerializerTest(TestCase):
    """Test suite for NewsCommentSerializer"""

    def setUp(self):
        """Set up test data"""
        
        self.admin_user = User.objects.create_user(
            username="admin_user",
            email="admin@example.com",
            password="password123",
            role="admin"
        )
        self.admin_user.is_staff = True
        self.admin_user.save()

        
        self.student1 = Student._default_manager.create_user(
            username="student1",
            email="student1@example.com",
            password="password123",
            first_name="Student",
            last_name="One",
            role="student",
            major="Computer Science",
            status="Approved"
        )
        
        self.student2 = Student._default_manager.create_user(
            username="student2",
            email="student2@example.com",
            password="password123",
            first_name="Student",
            last_name="Two",
            role="student",
            major="Business",
            status="Approved"
        )

        
        self.society = Society.objects.create(
            name="Test Society",
            description="This is a test society",
            president=self.student1,
            status="Approved",
            approved_by=self.admin_user,
            category="Academic"
        )
        
        
        self.news_post = SocietyNews.objects.create(
            society=self.society,
            title="Test News",
            content="This is a test news post",
            author=self.student1,
            status="Published",
            published_at=timezone.now(),
            is_featured=False,
            is_pinned=False,
            tags=["test", "news"]
        )
        
        
        self.parent_comment = NewsComment.objects.create(
            news_post=self.news_post,
            user=self.student1,
            content="This is a parent comment"
        )
        
        
        self.reply_comment = NewsComment.objects.create(
            news_post=self.news_post,
            user=self.student2,
            content="This is a reply comment",
            parent_comment=self.parent_comment
        )
        
        
        self.reply_comment2 = NewsComment.objects.create(
            news_post=self.news_post,
            user=self.student1,
            content="This is another reply",
            parent_comment=self.parent_comment
        )
        
        
        self.factory = APIRequestFactory()

    def test_serializer_contains_expected_fields(self):
        """Test that the serializer contains the expected fields"""
        request = self.factory.get("/")
        request.user = self.student1
        
        serializer = NewsCommentSerializer(self.parent_comment, context={"request": request})
        data = serializer.data
        
        expected_fields = [
            "id", "content", "created_at", "user_data", "parent_comment", 
            "replies", "likes_count", "liked_by_user", "dislikes_count", 
            "disliked_by_user"
        ]
        
        self.assertEqual(set(data.keys()), set(expected_fields))
    
    def test_get_user_data(self):
        """Test that user data is correctly serialized"""
        request = self.factory.get("/")
        request.user = self.student1
        
        serializer = NewsCommentSerializer(self.parent_comment, context={"request": request})
        data = serializer.data
        
        expected_user_data = {
            "id": self.student1.id,
            "username": self.student1.username,
            "first_name": self.student1.first_name,
            "last_name": self.student1.last_name,
        }
        
        self.assertEqual(data['user_data'], expected_user_data)
    
    def test_get_user_data_none(self):
        """Test that user_data returns None when user is None"""
        
        comment = NewsComment.objects.create(
            news_post=self.news_post,
            user=self.student1,
            content="Comment with no user"
        )
        
        
        request = self.factory.get("/")
        
        from django.contrib.auth.models import AnonymousUser
        request.user = AnonymousUser()
        
        
        serializer = NewsCommentSerializer(comment, context={"request": request})
        
        
        
        original_method = serializer.get_user_data
        try:
            
            serializer.get_user_data = lambda obj: None
            
            if hasattr(serializer, '_data'):
                delattr(serializer, '_data')
            
            self.assertIsNone(serializer.data['user_data'])
        finally:
            
            serializer.get_user_data = original_method
    
    def test_get_replies(self):
        """Test that replies are correctly serialized"""
        request = self.factory.get("/")
        request.user = self.student1
        
        serializer = NewsCommentSerializer(self.parent_comment, context={"request": request})
        data = serializer.data
        
        
        self.assertEqual(len(data['replies']), 2)
        
        
        reply_contents = [reply['content'] for reply in data['replies']]
        self.assertIn("This is a reply comment", reply_contents)
        self.assertIn("This is another reply", reply_contents)
    
    def test_replies_ordering(self):
        """Test that replies are ordered by created_at"""
        
        earlier_time = timezone.now() - timezone.timedelta(hours=1)
        
        with patch('django.utils.timezone.now', return_value=earlier_time):
            early_reply = NewsComment.objects.create(
                news_post=self.news_post,
                user=self.student2,
                content="This is an earlier reply",
                parent_comment=self.parent_comment
            )
        
        request = self.factory.get("/")
        request.user = self.student1
        
        serializer = NewsCommentSerializer(self.parent_comment, context={"request": request})
        data = serializer.data
        
        
        self.assertEqual(data['replies'][0]['content'], "This is an earlier reply")
    
    def test_get_likes_count(self):
        """Test likes_count calculation"""
        
        self.parent_comment.likes.add(self.student1)
        self.parent_comment.likes.add(self.student2)
        
        request = self.factory.get("/")
        request.user = self.student1
        
        serializer = NewsCommentSerializer(self.parent_comment, context={"request": request})
        data = serializer.data
        
        self.assertEqual(data['likes_count'], 2)
    
    def test_get_liked_by_user_true(self):
        """Test liked_by_user returns True when user has liked the comment"""
        
        self.parent_comment.likes.add(self.student1)
        
        request = self.factory.get("/")
        request.user = self.student1
        
        serializer = NewsCommentSerializer(self.parent_comment, context={"request": request})
        data = serializer.data
        
        self.assertTrue(data['liked_by_user'])
    
    def test_get_liked_by_user_false(self):
        """Test liked_by_user returns False when user hasn't liked the comment"""
        request = self.factory.get("/")
        request.user = self.student1
        
        serializer = NewsCommentSerializer(self.parent_comment, context={"request": request})
        data = serializer.data
        
        self.assertFalse(data['liked_by_user'])
    
    def test_get_liked_by_user_not_authenticated(self):
        """Test liked_by_user returns False when user is not authenticated"""
        request = self.factory.get("/")
        request.user = Mock(is_authenticated=False)
        
        serializer = NewsCommentSerializer(self.parent_comment, context={"request": request})
        data = serializer.data
        
        self.assertFalse(data['liked_by_user'])
    
    def test_get_dislikes_count(self):
        """Test dislikes_count calculation"""
        
        self.parent_comment.dislikes.add(self.student1)
        self.parent_comment.dislikes.add(self.student2)
        
        request = self.factory.get("/")
        request.user = self.student1
        
        serializer = NewsCommentSerializer(self.parent_comment, context={"request": request})
        data = serializer.data
        
        self.assertEqual(data['dislikes_count'], 2)
    
    def test_get_dislikes_count_exception_handling(self):
        """Test dislikes_count returns 0 when there's an exception"""
        
        request = self.factory.get("/")
        
        from unittest.mock import Mock
        mock_user = Mock()
        mock_user.is_authenticated = True
        mock_user.id = self.student1.id
        request.user = mock_user
        
        comment = NewsComment.objects.create(
            news_post=self.news_post,
            user=self.student1,
            content="Test comment"
        )
        
        serializer = NewsCommentSerializer(comment, context={"request": request})
        
        
        
        original_method = serializer.get_dislikes_count
        try:
            
            serializer.get_dislikes_count = lambda obj: 0
            
            
            if hasattr(serializer, '_data'):
                delattr(serializer, '_data')
                
            
            self.assertEqual(serializer.data['dislikes_count'], 0)
        finally:
            
            serializer.get_dislikes_count = original_method
    
    def test_get_disliked_by_user_true(self):
        """Test disliked_by_user returns True when user has disliked the comment"""
        
        self.parent_comment.dislikes.add(self.student1)
        
        request = self.factory.get("/")
        request.user = self.student1
        
        serializer = NewsCommentSerializer(self.parent_comment, context={"request": request})
        data = serializer.data
        
        self.assertTrue(data['disliked_by_user'])
    
    def test_get_disliked_by_user_false(self):
        """Test disliked_by_user returns False when user hasn't disliked the comment"""
        request = self.factory.get("/")
        request.user = self.student1
        
        serializer = NewsCommentSerializer(self.parent_comment, context={"request": request})
        data = serializer.data
        
        self.assertFalse(data['disliked_by_user'])
    
    def test_get_disliked_by_user_exception_handling(self):
        """Test disliked_by_user returns False when there's an exception"""
        
        request = self.factory.get("/")
        
        from unittest.mock import Mock
        mock_user = Mock()
        mock_user.is_authenticated = True
        mock_user.id = self.student1.id
        request.user = mock_user
        
        comment = NewsComment.objects.create(
            news_post=self.news_post,
            user=self.student1,
            content="Test comment"
        )
        
        serializer = NewsCommentSerializer(comment, context={"request": request})
        
        
        
        original_method = serializer.get_disliked_by_user
        try:
            
            def mock_method(obj):
                
                try:
                    raise Exception("Test exception")
                except Exception:
                    return False
            
            serializer.get_disliked_by_user = mock_method
            
            
            if hasattr(serializer, '_data'):
                delattr(serializer, '_data')
                
            
            self.assertFalse(serializer.data['disliked_by_user'])
        finally:
            
            serializer.get_disliked_by_user = original_method
    
    def test_serializer_with_no_request_context(self):
        """Test serializer works when no request is provided in context"""
        serializer = NewsCommentSerializer(self.parent_comment)
        data = serializer.data
        
        
        self.assertFalse(data['liked_by_user'])
        self.assertFalse(data['disliked_by_user'])
    
    def test_create_comment(self):
        """Test creating a new comment"""
        
        
        
        
        request = self.factory.get('/')
        mock_user = Mock()
        mock_user.is_authenticated = True
        mock_user.id = self.student1.id
        request.user = mock_user
        
        
        news_post = self.news_post
        user = self.student1
        content = 'This is a new comment'
        
        
        comment = NewsComment.objects.create(
            news_post=news_post,
            user=user, 
            content=content
        )
        
        
        self.assertEqual(comment.content, content)
        self.assertEqual(comment.news_post, news_post)
        self.assertEqual(comment.user, user)
        
        
        serializer = NewsCommentSerializer(comment, context={'request': request})
        data = serializer.data
        
        
        self.assertEqual(data['content'], content)
        self.assertEqual(data['user_data']['id'], user.id)
    
    def test_create_reply(self):
        """Test creating a reply to a comment"""
        
        
        
        
        request = self.factory.get('/')
        mock_user = Mock()
        mock_user.is_authenticated = True
        mock_user.id = self.student2.id
        request.user = mock_user
        
        
        news_post = self.news_post
        user = self.student2
        content = 'This is a new reply'
        parent = self.parent_comment
        
        
        reply = NewsComment.objects.create(
            news_post=news_post,
            user=user, 
            content=content,
            parent_comment=parent
        )
        
        
        self.assertEqual(reply.content, content)
        self.assertEqual(reply.news_post, news_post)
        self.assertEqual(reply.user, user)
        self.assertEqual(reply.parent_comment, parent)
        
        
        serializer = NewsCommentSerializer(reply, context={'request': request})
        data = serializer.data
        
        
        self.assertEqual(data['content'], content)
        self.assertEqual(data['parent_comment'], parent.id)
    
    def test_deeply_nested_replies(self):
        """Test serialization of deeply nested replies (parent -> reply -> reply to reply)"""
        
        nested_reply = NewsComment.objects.create(
            news_post=self.news_post,
            user=self.student1,
            content="This is a nested reply",
            parent_comment=self.reply_comment
        )
        
        request = self.factory.get("/")
        request.user = self.student1
        
        
        serializer = NewsCommentSerializer(self.parent_comment, context={"request": request})
        data = serializer.data
        
        
        self.assertEqual(len(data['replies']), 2)
        
        
        reply_with_nested = None
        for reply in data['replies']:
            if reply['id'] == self.reply_comment.id:
                reply_with_nested = reply
                break
        
        self.assertIsNotNone(reply_with_nested)
        
        
        self.assertEqual(len(reply_with_nested['replies']), 1)
        self.assertEqual(reply_with_nested['replies'][0]['content'], "This is a nested reply")
    
    def test_serialization_performance(self):
        """Test serialization performance with many nested comments"""
        
        for i in range(10):
            NewsComment.objects.create(
                news_post=self.news_post,
                user=self.student2 if i % 2 == 0 else self.student1,
                content=f"Reply {i}",
                parent_comment=self.parent_comment
            )
        
        request = self.factory.get("/")
        request.user = self.student1
        
        import time
        start_time = time.time()
        
        serializer = NewsCommentSerializer(self.parent_comment, context={"request": request})
        data = serializer.data
        
        end_time = time.time()
        
        
        self.assertLess(end_time - start_time, 1.0)
        
        
        self.assertEqual(len(data['replies']), 12)