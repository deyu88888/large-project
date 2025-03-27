from datetime import date, time, timedelta
from api.management.commands.seeding.event_generator import RandomEventDataGenerator
from django.test import TestCase

class SeedingTestCase(TestCase):
    """Unit test for the event data generation"""
    def setUp(self):
        self.generator = RandomEventDataGenerator()

    def test_generate_random_duration(self):
        """Test that generate_random_duration returns a timedelta of 1, 2, or 3 hours."""
        duration = self.generator.generate_random_duration()
        self.assertIsInstance(duration, timedelta)
        self.assertIn(duration, [timedelta(hours=1), timedelta(hours=2), timedelta(hours=3)])

    def test_generate_random_date(self):
        """Test that generate_random_date returns a date that is today or in the future."""
        generated_date = self.generator.generate_random_date(past=False)
        self.assertIsInstance(generated_date, date)
        today = date.today()
        self.assertGreaterEqual(generated_date, today)

    def test_generate_reasonable_time_future(self):
        """Test that generate_reasonable_time returns a valid time for a future date."""
        future_date = date.today() + timedelta(days=1)
        generated_time = self.generator.generate_reasonable_time(future_date)
        self.assertIsInstance(generated_time, time)
        self.assertGreaterEqual(generated_time, time(9, 0))
        self.assertLessEqual(generated_time.hour, 20)