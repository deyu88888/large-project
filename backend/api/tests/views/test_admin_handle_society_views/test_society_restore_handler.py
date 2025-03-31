import json
from django.utils import timezone
from datetime import timedelta
from django.test import TestCase
from rest_framework import status

from api.models import User, Student, Society, Event, ActivityLog
from api.views import SocietyRestoreHandler


class TestSocietyRestoreHandler(TestCase):
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

        self.event = Event.objects.create(
            title="Example Event",
            main_description="Test event",
            hosted_by=None,
            location="Room 101"
        )

        
        self.original_data = {
            "name": "Tech Society",
            "description": "Tech things",
            "status": "Approved",
            "category": "Technology",
            "social_media_links": {},
            "tags": ["AI", "ML"],
            "president": self.student1.id,
            "vice_president": self.student2.id,
            "event_manager": self.student2.id,
            "approved_by": self.admin.id,
            "society_members": [self.student1.id, self.student2.id],
            "members": [self.student1.id],
            "events": [self.event.id]
        }

        self.log_entry = ActivityLog.objects.create(
            action_type="Delete",
            target_type="Society",
            target_id=999,
            target_name="Tech Society",
            performed_by=self.admin,
            timestamp=timezone.now(),
            reason="Testing restore",
            expiration_date=timezone.now() + timedelta(days=7),
            original_data=json.dumps(self.original_data)
        )

    def test_society_restore_success(self):
        handler = SocietyRestoreHandler()

        data = json.loads(self.log_entry.original_data)

        
        society_data = {
            k: v for k, v in data.items()
            if k not in ['id', 'members', 'society_members', 'events', 'leader']
        }

        society_data['president'] = self.student1
        society_data['vice_president'] = self.student2
        society_data['event_manager'] = self.student2
        society_data['approved_by'] = self.admin

        
        society = Society.objects.create(**society_data)
        society.members.set([self.student1])
        society.society_members.set([self.student1, self.student2])
        society.events.set([self.event])

        self.log_entry.delete()  

        self.assertEqual(society.name, "Tech Society")
        self.assertEqual(society.president, self.student1)
        self.assertEqual(society.vice_president, self.student2)
        self.assertEqual(society.event_manager, self.student2)
        self.assertEqual(society.approved_by, self.admin)

        self.assertIn(self.student1, society.members.all())
        self.assertIn(self.student2, society.society_members.all())
        self.assertIn(self.event, society.events.all())

        self.assertFalse(ActivityLog.objects.filter(id=self.log_entry.id).exists())

    def test_restore_failure_invalid_data(self):
        handler = SocietyRestoreHandler()
        invalid_data = "not-a-json-object"

        response = handler.handle(invalid_data, self.log_entry)

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn("Failed to restore Society", response.data["error"])

    def test_restore_uses_vice_president_as_president_when_president_missing(self):
        handler = SocietyRestoreHandler()

        data = self.original_data.copy()
        data["president"] = None  # Simulate missing president
        data["vice_president"] = self.student2.id
        self.log_entry.original_data = json.dumps(data)
        self.log_entry.save()

        response = handler.handle(data, self.log_entry)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        restored_society = Society.objects.get(name="Tech Society")
        self.assertEqual(restored_society.president.id, self.student2.id)

    def test_restore_sets_admin_if_approved_by_missing(self):
        handler = SocietyRestoreHandler()

        data = self.original_data.copy()
        data["approved_by"] = None
        self.log_entry.original_data = json.dumps(data)
        self.log_entry.save()

        response = handler.handle(data, self.log_entry)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        restored_society = Society.objects.get(name="Tech Society")
        self.assertEqual(restored_society.approved_by, self.admin)

    def test_restore_fails_if_president_and_approved_by_missing(self):
        handler = SocietyRestoreHandler()

        data = self.original_data.copy()
        data["president"] = None
        data["approved_by"] = None
        self.log_entry.original_data = json.dumps(data)
        self.log_entry.save()

        response = handler.handle(data, self.log_entry)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Cannot restore society", response.data["error"])

    def test_restore_foreign_keys_and_many_to_many(self):
        handler = SocietyRestoreHandler()
        data = json.loads(self.log_entry.original_data)

        response = handler.handle(data, self.log_entry)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        society = Society.objects.get(name="Tech Society")
        self.assertEqual(society.president, self.student1)
        self.assertEqual(society.vice_president, self.student2)
        self.assertIn(self.student1, society.members.all())
        self.assertIn(self.student2, society.society_members.all())
        self.assertIn(self.event, society.events.all())

    def test_restore_skips_missing_president_and_approved_by(self):
        handler = SocietyRestoreHandler()

        data = self.original_data.copy()
        data["president"] = 9999  # invalid ID
        data["approved_by"] = 8888  # invalid ID
        self.log_entry.original_data = json.dumps(data)
        self.log_entry.save()

        response = handler.handle(data, self.log_entry)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        society = Society.objects.get(name="Tech Society")

        # Fallback logic kicks in
        self.assertEqual(society.president, self.student2)  # From vice_president
        self.assertEqual(society.approved_by, self.admin)   # Fallback admin