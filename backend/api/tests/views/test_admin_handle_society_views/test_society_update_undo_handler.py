import json
from django.utils import timezone
from datetime import timedelta
from django.test import TestCase
from rest_framework import status

from api.models import User, Student, Society, ActivityLog, SocietyShowreel
from api.views import SocietyUpdateUndoHandler

class TestSocietyUpdateUndoHandler(TestCase):
    def setUp(self):
        self.admin = User.objects.create(
            username="adminuser",
            email="admin@example.com",
            role="admin",
            first_name="Admin",
            last_name="User"
        )

        self.student1 = Student.objects.create(
            username="student1",
            email="student1@example.com",
            first_name="Stu",
            last_name="Dent1",
        )

        self.student2 = Student.objects.create(
            username="student2",
            email="student2@example.com",
            first_name="Stu",
            last_name="Dent2",
        )

        self.society = Society.objects.create(
            name="Tech Society",
            description="Old description",
            president=self.student1,
            approved_by=self.admin,
            status="Approved",
            category="Tech",
        )

        self.society.society_members.set([self.student1])
        self.showreel = SocietyShowreel.objects.create(society=self.society, caption="Initial", photo="society_showreel/test.jpg")

        self.original_data = {
            "name": "Tech Society",
            "description": "Updated description",
            "status": "Approved",
            "category": "Technology",
            "tags": ["AI", "ML"],
            "approved_by": self.admin.id,
            "vice_president": {"id": self.student2.id},
            "event_manager": {"id": self.student2.id},
            "social_media_links": {"Facebook": "https://facebook.com/techsociety"},
            "society_members": [self.student1.id, self.student2.id],
            "showreel_images": [self.showreel.id]
        }

        self.log_entry = ActivityLog.objects.create(
            action_type="Update",
            target_type="Society",
            target_id=self.society.id,
            target_name=self.society.name,
            performed_by=self.admin,
            timestamp=timezone.now(),
            reason="Testing update undo",
            expiration_date=timezone.now() + timedelta(days=7),
            original_data=json.dumps(self.original_data)
        )

    def test_society_update_undo_success(self):
        handler = SocietyUpdateUndoHandler()
        data = json.loads(self.log_entry.original_data)
        response = handler.handle(data, self.log_entry)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Society update undone successfully", response.data["message"])

        society = Society.objects.get(id=self.society.id)
        self.assertEqual(society.description, "Updated description")
        self.assertEqual(society.vice_president, self.student2)
        self.assertEqual(society.event_manager, self.student2)
        self.assertEqual(society.approved_by, self.admin)
        self.assertEqual(society.social_media_links["Facebook"], "https://facebook.com/techsociety")
        self.assertIn(self.student2, society.society_members.all())

        self.assertFalse(ActivityLog.objects.filter(id=self.log_entry.id).exists())

    def test_society_update_undo_not_found(self):
        
        self.society.delete()

        handler = SocietyUpdateUndoHandler()
        data = json.loads(self.log_entry.original_data)

        response = handler.handle(data, self.log_entry)

        print("Error Response:", response.data)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("Society not found", response.data["error"])
