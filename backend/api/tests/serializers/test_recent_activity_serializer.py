from django.test import TestCase
from api.serializers import RecentActivitySerializer
from datetime import datetime, timedelta
from rest_framework.exceptions import ValidationError
import pytz  # To handle timezone normalization

class TestRecentActivitySerializer(TestCase):
    def test_valid_recent_activity(self):
        """Test that the serializer validates and serializes correct data."""
        valid_data = {
            "description": "User joined a new society.",
            "timestamp": datetime.now(pytz.UTC),  # Ensure UTC timezone
        }
        serializer = RecentActivitySerializer(data=valid_data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["timestamp"], valid_data["timestamp"])

    def test_invalid_description_length(self):
        """Test that the serializer fails if description exceeds max length."""
        invalid_data = {
            "description": "a" * 501,  # 501 characters, exceeds max length
            "timestamp": datetime.now(pytz.UTC),  # Ensure UTC timezone
        }
        serializer = RecentActivitySerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("description", serializer.errors)
        self.assertEqual(serializer.errors["description"][0].code, "max_length")

    def test_invalid_timestamp(self):
        """Test that the serializer fails with an invalid timestamp."""
        invalid_data = {
            "description": "User attended an event.",
            "timestamp": "invalid-timestamp",
        }
        serializer = RecentActivitySerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("timestamp", serializer.errors)

    def test_missing_fields(self):
        """Test that the serializer fails if required fields are missing."""
        invalid_data = {}
        serializer = RecentActivitySerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("description", serializer.errors)
        self.assertIn("timestamp", serializer.errors)

    def test_empty_description(self):
        """Test that the serializer fails if description is empty."""
        invalid_data = {
            "description": "",
            "timestamp": datetime.now(pytz.UTC),  # Ensure UTC timezone
        }
        serializer = RecentActivitySerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("description", serializer.errors)

    def test_future_timestamp(self):
        """Test that the serializer accepts future timestamps."""
        future_time = datetime.now(pytz.UTC) + timedelta(days=1)  # Ensure UTC timezone
        valid_data = {
            "description": "Scheduled an event.",
            "timestamp": future_time,
        }
        serializer = RecentActivitySerializer(data=valid_data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["timestamp"], future_time)