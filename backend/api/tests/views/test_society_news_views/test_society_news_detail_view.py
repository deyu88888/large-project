import tempfile
from datetime import datetime, timedelta
from django.utils import timezone
from PIL import Image
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APIClient
from api.models import Society, SocietyNews, NewsPublicationRequest, Student


def create_test_image():
    image = Image.new("RGB", (10, 10), "red")
    tmp = tempfile.NamedTemporaryFile(suffix=".jpg")
    image.save(tmp, format="JPEG")
    tmp.seek(0)
    return SimpleUploadedFile("test.jpg", tmp.read(), content_type="image/jpeg")


class SocietyNewsDetailViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.student = Student.objects.create_user(
            username="teststudent",
            password="12345678",
            email="student@example.com"
        )
        self.client.force_authenticate(user=self.student)

        self.society = Society.objects.create(
            name="Test Society",
            description="desc",
            approved_by=self.student,
            status="Approved",
            president=self.student
        )
        self.student.president_of = self.society
        self.student.save()
        self.society.society_members.add(self.student)

        self.news_post = SocietyNews.objects.create(
            society=self.society,
            title="Draft",
            content="Original content",
            status="Draft",
            author=self.student
        )

        self.published_post = SocietyNews.objects.create(
            society=self.society,
            title="Published",
            content="Published content",
            status="Published",
            author=self.student
        )

        self.called_cancel_ids = []

    def test_get_news_post(self):
        url = reverse("society_news_detail", kwargs={"news_id": self.news_post.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.news_post.refresh_from_db()
        self.assertEqual(self.news_post.view_count, 1)

    def test_put_draft_update(self):
        url = reverse("society_news_detail", kwargs={"news_id": self.news_post.id})
        data = {"title": "Updated", "content": "Updated content"}
        res = self.client.put(url, data, format="multipart")
        self.assertEqual(res.status_code, 200)
        self.news_post.refresh_from_db()
        self.assertEqual(self.news_post.title, "Updated")

    def test_put_direct_publish_error(self):
        url = reverse("society_news_detail", kwargs={"news_id": self.news_post.id})
        data = {"status": "Published"}
        res = self.client.put(url, data, format="multipart")
        self.assertEqual(res.status_code, 400)
        self.assertIn("use_publication_request", res.data.get("code", ""))

    def test_put_published_content_change_triggers_pending(self):
        url = reverse("society_news_detail", kwargs={"news_id": self.published_post.id})
        data = {"content": "New content"}
        res = self.client.put(url, data, format="multipart")
        self.assertEqual(res.status_code, 200)
        self.published_post.refresh_from_db()
        self.assertEqual(self.published_post.status, "PendingApproval")
        self.assertTrue(NewsPublicationRequest.objects.filter(news_post=self.published_post).exists())

    def test_put_rejected_with_resubmit(self):
        rejected = SocietyNews.objects.create(
            society=self.society,
            title="Rejected",
            content="no",
            status="Rejected",
            author=self.student
        )
        url = reverse("society_news_detail", kwargs={"news_id": rejected.id})
        data = {"resubmit": "true", "content": "revised"}
        res = self.client.put(url, data, format="multipart")
        self.assertEqual(res.status_code, 200)
        rejected.refresh_from_db()
        self.assertEqual(rejected.status, "PendingApproval")

    def test_put_pendingapproval_cancel(self):
        self.news_post.status = "PendingApproval"
        self.news_post.save()
        url = reverse("society_news_detail", kwargs={"news_id": self.news_post.id})
        data = {"status": "Draft"}

        with patch("api.views_files.society_news_views.cancel_pending_requests") as mock_cancel:
            res = self.client.put(url, data, format="multipart")
            self.assertEqual(res.status_code, 200)
            self.news_post.refresh_from_db()
            self.assertEqual(self.news_post.status, "Draft")
            mock_cancel.assert_called_once_with(self.news_post)

    def test_put_with_file_upload(self):
        url = reverse("society_news_detail", kwargs={"news_id": self.published_post.id})
        img = create_test_image()
        data = {"image": img, "content": "with file"}
        res = self.client.put(url, data, format="multipart")
        self.assertEqual(res.status_code, 200)
        self.published_post.refresh_from_db()
        self.assertEqual(self.published_post.status, "PendingApproval")

    def test_put_invalid_data(self):
        url = reverse("society_news_detail", kwargs={"news_id": self.published_post.id})
        data = {"title": "", "content": "valid"}
        res = self.client.put(url, data, format="multipart")
        self.assertEqual(res.status_code, 400)
        self.assertIn("title", res.data)

    def test_delete_news_post(self):
        url = reverse("society_news_detail", kwargs={"news_id": self.news_post.id})
        res = self.client.delete(url)
        self.assertEqual(res.status_code, 204)
        self.assertFalse(SocietyNews.objects.filter(id=self.news_post.id).exists())

    def test_get_404_permission_rejects_first(self):
        url = reverse("society_news_detail", kwargs={"news_id": 99999})
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_put_404_permission_rejects_first(self):
        url = reverse("society_news_detail", kwargs={"news_id": 99999})
        data = {"content": "anything"}
        res = self.client.put(url, data, format="multipart")
        self.assertEqual(res.status_code, 403)

    def test_delete_404_permission_rejects_first(self):
        url = reverse("society_news_detail", kwargs={"news_id": 99999})
        res = self.client.delete(url)
        self.assertEqual(res.status_code, 403)

    def test_put_clear_image_field(self):
        self.published_post.status = "Published"
        self.published_post.save()

        url = reverse("society_news_detail", kwargs={"news_id": self.published_post.id})

        with patch("api.views_files.society_news_views.SocietyNewsSerializer") as mock_serializer_class:
            mock_serializer = MagicMock()
            mock_serializer.is_valid.return_value = True
            mock_serializer.save.return_value = self.published_post
            mock_serializer.data = {"status": "PendingApproval"}
            mock_serializer_class.return_value = mock_serializer

            data = {
                "image": "",
                "content": "new content"
            }

            response = self.client.put(url, data, format="multipart")
            self.assertEqual(response.status_code, 200)

    def test_put_file_only_in_files_not_data(self):
        self.published_post.status = "Published"
        self.published_post.save()

        url = reverse("society_news_detail", kwargs={"news_id": self.published_post.id})

        file = SimpleUploadedFile("x.pdf", b"abc", content_type="application/pdf")

        with patch("api.views_files.society_news_views.SocietyNewsSerializer") as mock_class:
            mock_instance = MagicMock()
            mock_instance.is_valid.return_value = True
            mock_instance.save.return_value = self.published_post
            mock_instance.data = {"status": "PendingApproval"}
            mock_class.return_value = mock_instance

            response = self.client.put(
                url,
                data={"content": "triggered"},
                format="multipart"
            )
            self.assertEqual(response.status_code, 200)

    def test_admin_notes_both_exist_approved_later(self):
        self.published_post.status = "Published"
        self.published_post.save()
        now = timezone.now()

        NewsPublicationRequest.objects.create(
            news_post=self.published_post, status="Superseded_Approved",
            reviewed_at=now, requested_by=self.student
        )
        NewsPublicationRequest.objects.create(
            news_post=self.published_post, status="Superseded_Rejected",
            reviewed_at=now - timedelta(days=1), requested_by=self.student
        )

        url = reverse("society_news_detail", kwargs={"news_id": self.published_post.id})

        with patch("api.views_files.society_news_views.SocietyNewsSerializer") as mock_class:
            mock_instance = MagicMock()
            mock_instance.is_valid.return_value = True
            mock_instance.save.return_value = self.published_post
            mock_instance.data = {"status": "PendingApproval"}
            mock_class.return_value = mock_instance

            res = self.client.put(url, {"content": "change"}, format="multipart")
            self.assertEqual(res.status_code, 200)

    def test_admin_notes_both_exist_rejected_later(self):
        self.published_post.status = "Published"
        self.published_post.save()
        now = timezone.now()

        NewsPublicationRequest.objects.create(
            news_post=self.published_post, status="Superseded_Approved",
            reviewed_at=now - timedelta(days=1), requested_by=self.student
        )
        NewsPublicationRequest.objects.create(
            news_post=self.published_post, status="Superseded_Rejected",
            reviewed_at=now, requested_by=self.student
        )

        url = reverse("society_news_detail", kwargs={"news_id": self.published_post.id})

        with patch("api.views_files.society_news_views.SocietyNewsSerializer") as mock_class:
            mock_instance = MagicMock()
            mock_instance.is_valid.return_value = True
            mock_instance.save.return_value = self.published_post
            mock_instance.data = {"status": "PendingApproval"}
            mock_class.return_value = mock_instance

            res = self.client.put(url, {"content": "change"}, format="multipart")
            self.assertEqual(res.status_code, 200)

    def test_admin_notes_only_approved(self):
        self.published_post.status = "Published"
        self.published_post.save()
        now = timezone.now()

        NewsPublicationRequest.objects.create(
            news_post=self.published_post, status="Superseded_Approved",
            reviewed_at=now, requested_by=self.student
        )

        url = reverse("society_news_detail", kwargs={"news_id": self.published_post.id})

        with patch("api.views_files.society_news_views.SocietyNewsSerializer") as mock_class:
            mock_instance = MagicMock()
            mock_instance.is_valid.return_value = True
            mock_instance.save.return_value = self.published_post
            mock_instance.data = {"status": "PendingApproval"}
            mock_class.return_value = mock_instance

            res = self.client.put(url, {"content": "change"}, format="multipart")
            self.assertEqual(res.status_code, 200)

    def test_admin_notes_only_rejected(self):
        self.published_post.status = "Published"
        self.published_post.save()
        now = timezone.now()

        NewsPublicationRequest.objects.create(
            news_post=self.published_post, status="Superseded_Rejected",
            reviewed_at=now, requested_by=self.student
        )

        url = reverse("society_news_detail", kwargs={"news_id": self.published_post.id})

        with patch("api.views_files.society_news_views.SocietyNewsSerializer") as mock_class:
            mock_instance = MagicMock()
            mock_instance.is_valid.return_value = True
            mock_instance.save.return_value = self.published_post
            mock_instance.data = {"status": "PendingApproval"}
            mock_class.return_value = mock_instance

            res = self.client.put(url, {"content": "change"}, format="multipart")
            self.assertEqual(res.status_code, 200)

    def test_put_status_as_admin_triggers_pass_branch(self):
        admin = Student.objects.create_user(
            username="adminuser",
            password="12345678",
            email="admin@example.com"
        )
        admin.is_admin = lambda: True
        self.client.force_authenticate(user=admin)

        self.news_post.status = "Draft"
        self.news_post.save()

        url = reverse("society_news_detail", kwargs={"news_id": self.news_post.id})
        data = {
            "status": "Published",
            "title": self.news_post.title,
            "content": self.news_post.content
        }

        with patch("api.views_files.society_news_views.SocietyNewsSerializer") as mock_class:
            mock_instance = MagicMock()
            mock_instance.is_valid.return_value = True
            mock_instance.save.return_value = self.news_post
            mock_instance.data = {"status": "Draft"}
            mock_class.return_value = mock_instance

            response = self.client.put(url, data, format="multipart")
            self.assertEqual(response.status_code, 200)

    def test_put_parses_tags_field(self):
        self.news_post.status = "Draft"
        self.news_post.save()

        url = reverse("society_news_detail", kwargs={"news_id": self.news_post.id})

        with patch("api.views_files.society_news_views.SocietyNewsSerializer") as mock_class:
            mock_instance = MagicMock()
            mock_instance.is_valid.return_value = True
            mock_instance.save.return_value = self.news_post
            mock_instance.data = {"status": "Draft"}
            mock_class.return_value = mock_instance

            data = {
                "tags": '["sports", "fun"]',
                "title": self.news_post.title,
                "content": self.news_post.content
            }

            response = self.client.put(url, data, format="multipart")
            self.assertEqual(response.status_code, 200)

    def test_put_serializer_invalid_triggers_400(self):
        self.news_post.status = "Draft"
        self.news_post.save()

        url = reverse("society_news_detail", kwargs={"news_id": self.news_post.id})

        with patch("api.views_files.society_news_views.SocietyNewsSerializer") as mock_class:
            mock_instance = MagicMock()
            mock_instance.is_valid.return_value = False
            mock_instance.errors = {"title": ["This field is required."]}
            mock_class.return_value = mock_instance

            data = {"title": "", "content": "something"}
            response = self.client.put(url, data, format="multipart")
            self.assertEqual(response.status_code, 400)
            self.assertIn("title", response.data)
