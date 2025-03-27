from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from django.db import IntegrityError, transaction
from django.core.exceptions import ValidationError

from api.models import NewsPublicationRequest, SocietyNews, Student, User, Society


class NewsPublicationRequestModelTest(TestCase):
    def setUp(self):
        # 创建 admin 用户
        self.admin_user = User.objects.create_user(
            username='adminuser',
            email='admin@example.com',
            password='adminpassword',
            first_name='Admin',
            last_name='User',
            role='admin',
            is_staff=True
        )
        # 创建 student 用户
        self.student_user = Student.objects.create(
            username='studentuser',
            email='student@example.com',
            password='studentpassword',
            first_name='Student',
            last_name='User',
            role='student'
        )
        # 创建社团
        self.society = Society.objects.create(
            name='Test Society',
            description='Society for testing',
            president=self.student_user,
            approved_by=self.admin_user,
            status='Approved'
        )
        # 创建新闻帖子
        self.news_post = SocietyNews.objects.create(
            society=self.society,
            title='Test News Post',
            content='This is a test news post content',
            author=self.student_user,
            status='Draft'
        )
        # 创建初始的 publication request（fixture）
        self.publication_request = NewsPublicationRequest.objects.create(
            news_post=self.news_post,
            requested_by=self.student_user,
            status='Pending'
        )

    def test_create_publication_request(self):
        request = NewsPublicationRequest.objects.create(
            news_post=self.news_post,
            requested_by=self.student_user
        )
        self.assertEqual(request.news_post, self.news_post)
        self.assertEqual(request.requested_by, self.student_user)
        self.assertEqual(request.status, 'Pending')
        self.assertIsNone(request.reviewed_by)
        self.assertIsNone(request.reviewed_at)
        self.assertIsNone(request.admin_notes)
        self.assertIsNotNone(request.requested_at)
        now = timezone.now()
        self.assertTrue(abs((request.requested_at - now).total_seconds()) < 10)

    def test_string_representation(self):
        expected_string = f"Publication request for '{self.publication_request.news_post.title}' - {self.publication_request.status}"
        self.assertEqual(str(self.publication_request), expected_string)

    def test_ordering(self):
        # 创建两个新的请求
        first_req = NewsPublicationRequest.objects.create(
            news_post=self.news_post,
            requested_by=self.student_user
        )
        # 将 first_req 的时间设置为 1 天前
        first_req.requested_at = timezone.now() - timedelta(days=1)
        first_req.save(update_fields=['requested_at'])

        second_req = NewsPublicationRequest.objects.create(
            news_post=self.news_post,
            requested_by=self.student_user
        )
        # 获取所有针对同一新闻帖子的请求，按降序排序
        qs = list(NewsPublicationRequest.objects.filter(news_post=self.news_post).order_by("-requested_at"))
        # 注意：setUp 中的 publication_request 的 requested_at 是创建时刻，
        # second_req 的时间为当前时间，first_req 的时间为 1 天前，
        # 所以预期顺序应为: qs[0] == second_req, qs[1] == self.publication_request, qs[2] == first_req.
        self.assertEqual(qs[0].id, second_req.id)
        self.assertEqual(qs[1].id, self.publication_request.id)
        self.assertEqual(qs[2].id, first_req.id)

    def test_required_fields(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                NewsPublicationRequest.objects.create(
                    requested_by=self.student_user
                )
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                NewsPublicationRequest.objects.create(
                    news_post=self.news_post
                )

    def test_approve_request(self):
        self.assertEqual(self.publication_request.status, 'Pending')
        self.assertIsNone(self.publication_request.reviewed_by)
        self.assertIsNone(self.publication_request.reviewed_at)
        self.assertEqual(self.publication_request.news_post.status, 'Draft')

        self.publication_request.status = 'Approved'
        self.publication_request.reviewed_by = self.admin_user
        self.publication_request.save()

        self.publication_request.refresh_from_db()
        self.news_post.refresh_from_db()

        self.assertEqual(self.publication_request.status, 'Approved')
        self.assertEqual(self.publication_request.reviewed_by, self.admin_user)
        self.assertIsNotNone(self.publication_request.reviewed_at)
        self.assertEqual(self.news_post.status, 'Published')
        self.assertIsNotNone(self.news_post.published_at)

    def test_reject_request(self):
        self.assertEqual(self.publication_request.status, 'Pending')
        self.assertIsNone(self.publication_request.reviewed_by)
        self.assertIsNone(self.publication_request.reviewed_at)
        self.assertEqual(self.publication_request.news_post.status, 'Draft')

        self.publication_request.status = 'Rejected'
        self.publication_request.reviewed_by = self.admin_user
        self.publication_request.admin_notes = 'Content needs improvement'
        self.publication_request.save()

        self.publication_request.refresh_from_db()
        self.news_post.refresh_from_db()

        self.assertEqual(self.publication_request.status, 'Rejected')
        self.assertEqual(self.publication_request.reviewed_by, self.admin_user)
        self.assertIsNotNone(self.publication_request.reviewed_at)
        self.assertEqual(self.publication_request.admin_notes, 'Content needs improvement')
        self.assertEqual(self.news_post.status, 'Rejected')

    def test_save_without_status_change(self):
        self.assertIsNone(self.publication_request.reviewed_at)
        self.publication_request.admin_notes = 'Just a note'
        self.publication_request.save()
        self.assertIsNone(self.publication_request.reviewed_at)
        self.assertEqual(self.news_post.status, 'Draft')

    def test_delete_news_post_cascade(self):
        news_post = self.publication_request.news_post
        news_post_id = news_post.id
        news_post.delete()
        with self.assertRaises(NewsPublicationRequest.DoesNotExist):
            NewsPublicationRequest.objects.get(news_post_id=news_post_id)

    def test_delete_student_cascade(self):
        student = self.publication_request.requested_by
        request_id = self.publication_request.id
        Society.objects.filter(president=student).update(president=None)
        student.delete()
        with self.assertRaises(NewsPublicationRequest.DoesNotExist):
            NewsPublicationRequest.objects.get(id=request_id)

    def test_delete_reviewer_set_null(self):
        self.publication_request.status = 'Approved'
        self.publication_request.reviewed_by = self.admin_user
        self.publication_request.save()

        self.publication_request.refresh_from_db()
        self.assertEqual(self.publication_request.reviewed_by, self.admin_user)

        self.admin_user.delete()

        self.publication_request.refresh_from_db()
        self.assertIsNone(self.publication_request.reviewed_by)
        self.assertTrue(NewsPublicationRequest.objects.filter(id=self.publication_request.id).exists())

    def test_multiple_requests_for_same_news_post(self):
        # setUp 中已有一条 publication_request
        first_request = NewsPublicationRequest.objects.create(
            news_post=self.news_post,
            requested_by=self.student_user
        )
        second_request = NewsPublicationRequest.objects.create(
            news_post=self.news_post,
            requested_by=self.student_user
        )
        # 由于 setUp 中已有一条记录，所以总数应为 3
        self.assertEqual(NewsPublicationRequest.objects.filter(news_post=self.news_post).count(), 3)

    def test_invalid_status(self):
        self.publication_request.status = 'InvalidStatus'
        with self.assertRaises(ValidationError):
            self.publication_request.full_clean()

    def test_direct_status_transition(self):
        original_request_time = self.publication_request.requested_at
        time_before_approval = timezone.now()
        self.publication_request.status = 'Approved'
        self.publication_request.reviewed_by = self.admin_user
        self.publication_request.save()

        self.publication_request.refresh_from_db()
        self.assertEqual(self.publication_request.status, 'Approved')
        self.assertEqual(self.publication_request.requested_at, original_request_time)
        self.assertGreaterEqual(self.publication_request.reviewed_at, time_before_approval)

    def test_update_existing_review(self):
        self.publication_request.status = 'Approved'
        self.publication_request.reviewed_by = self.admin_user
        self.publication_request.save()

        first_review_time = self.publication_request.reviewed_at

        self.news_post.refresh_from_db()
        self.assertEqual(self.news_post.status, 'Published')

        self.publication_request.status = 'Rejected'
        self.publication_request.admin_notes = 'Changed my mind'
        self.publication_request.save()

        self.publication_request.refresh_from_db()
        self.news_post.refresh_from_db()

        # 期望第一次审核时间保持不变
        self.assertEqual(self.publication_request.reviewed_at, first_review_time)
        self.assertEqual(self.news_post.status, 'Published')
