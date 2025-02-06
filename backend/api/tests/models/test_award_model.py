from django.core.exceptions import ValidationError
from django.test import TestCase
from api.models import Award

# pylint: disable=no-member


class AwardModelTestCase(TestCase):
    """Unit tests for the Award model"""
    def setUp(self):
        self.award = Award.objects.create(
            rank="Bronze",
            title="Event Attender",
            description="For attending all events for their society"
        )

    def test_rank_choices(self):
        """Test that rank can take correct choices"""
        choices = ["Bronze", "Silver", "Gold"]
        for choice in choices:
            self.award.rank = choice
            self._assert_award_is_valid()

    def test_invalid_choices(self):
        """Test that rank cannot take invalid choices"""
        choices = ["Platinum", "", 123]
        for choice in choices:
            self.award.rank = choice
            self._assert_award_is_invalid()

    def test_is_custom_values(self):
        """Test that custom can take only True or False"""
        self.award.is_custom = True
        self._assert_award_is_valid()
        self.award.is_custom = False
        self._assert_award_is_valid()

    def test_is_custom_default(self):
        """Test that is_custom defaults to False"""
        self.assertFalse(self.award.is_custom)

    def test_title_length(self):
        """Test that title can be a string of 0<len<=20"""
        self.award.title = ""
        self._assert_award_is_invalid()
        self.award.title = "a"
        self._assert_award_is_valid()
        self.award.title = "a" * 20
        self._assert_award_is_valid()
        self.award.title = "a" * 21
        self._assert_award_is_invalid()

    def test_description_length(self):
        """Test that description can be a string of 0<len<=150"""
        self.award.description = ""
        self._assert_award_is_invalid()
        self.award.description = "a"
        self._assert_award_is_valid()
        self.award.description = "a" * 150
        self._assert_award_is_valid()
        self.award.description = "a" * 151
        self._assert_award_is_invalid()

    def test_string_representation(self):
        """Test that Award string is represented properly"""
        self.assertEqual(str(self.award), "Event Attender, Bronze")

    def _assert_award_is_valid(self):
        try:
            self.award.full_clean()
        except ValidationError:
            self.fail('Test award should be valid')

    def _assert_award_is_invalid(self):
        with self.assertRaises(ValidationError):
            self.award.full_clean()
