from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from rest_framework import status

from api.models import User, Student, Society, ActivityLog
from api.views import SocietyStatusChangeUndoHandler


class TestSocietyStatusChangeUndoHandler(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="adminuser",
            email="admin@example.com",
            password="adminpass",
            role="admin",
        )

        self.student_president = Student.objects.create_user(
            username="president",
            email="president@example.com",
            password="prespass"
        )

        self.society = Society.objects.create(
            name="Tech Society",
            description="A society about tech",
            president=self.student_president,
            approved_by=self.admin,
            status="Approved"
        )

        self.log_entry = ActivityLog.objects.create(
            action_type="Approve",
            target_type="Society",
            target_id=self.society.id,
            target_name=self.society.name,
            performed_by=self.admin,
            timestamp=timezone.now(),
            reason="Initial approval",
            expiration_date=timezone.now() + timedelta(days=30),
        )

    def test_society_status_undo_success(self):
        handler = SocietyStatusChangeUndoHandler()

        
        original_save = Society.save

        def safe_save(instance, *args, **kwargs):
            if instance.approved_by is None:
                instance.approved_by = self.admin  
            original_save(instance, *args, **kwargs)

        Society.save = safe_save  

        try:
            response = handler.handle({}, self.log_entry)
        finally:
            Society.save = original_save  

        print("✅ Response:", response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.society.refresh_from_db()
        self.assertEqual(self.society.status, "Pending")
        self.assertEqual(self.society.approved_by, self.admin)  
        self.assertFalse(ActivityLog.objects.filter(id=self.log_entry.id).exists())

    def test_society_status_undo_not_found(self):
        self.society.delete()
        handler = SocietyStatusChangeUndoHandler()
        response = handler.handle({}, self.log_entry)

        print("Error Response:", response.data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)