from rest_framework.test import APITestCase
from api.serializers import DashboardStatisticSerializer


class TestDashboardStatisticSerializer(APITestCase):
    def test_valid_dashboard_statistics(self):
        data = {
            "total_societies": 5,
            "total_events": 10,
            "pending_approvals": 2,
            "active_members": 100
        }
        serializer = DashboardStatisticSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data, data)

    def test_invalid_dashboard_statistics(self):
        invalid_data = {
            "total_societies": "not-a-number",  # Invalid integer
            "total_events": 123,  # Valid integer
            "pending_approvals": "invalid",  # Invalid integer
            "active_members": None,  # Null value, which is invalid
        }
        serializer = DashboardStatisticSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("total_societies", serializer.errors)
        self.assertIn("pending_approvals", serializer.errors)
        self.assertIn("active_members", serializer.errors)
        self.assertNotIn("total_events", serializer.errors)  # `total_events` should not have errors