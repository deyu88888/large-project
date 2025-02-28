from django.test import TestCase
from api.models import Award
from api.serializers import AwardSerializer

# pylint: disable=no-member


class AwardSerializerTestCase(TestCase):
    """ Unit tests for the Event Serializer """

    def setUp(self):
        """Set up Award and AwardSerializer objects"""
        self.award = Award.objects.create(
            rank="Bronze",
            title="Event Attender",
            description="For attending all events for their society",
            is_custom=True
        )

        # Serializer data
        self.serializer = None
        self.data = {
            "rank": "Bronze",
            "title": "Event Attender",
            "description": "For attending all events for their society",
            "is_custom": False,
        }

    def test_award_serialization(self):
        """Test to ensure the serializer is correctly serializing"""
        self.serializer = AwardSerializer(instance=self.award)
        data = self.serializer.data

        self.assertEqual(data["rank"], self.award.rank)
        self.assertEqual(data["title"], self.award.title)
        self.assertEqual(data["description"], self.award.description)

    def test_award_deserialization(self):
        """Test to the serializer can correctly deserialize"""
        self.serializer = AwardSerializer(data=self.data)
        self._assert_serializer_is_valid()
        data = self.serializer.validated_data

        self.assertEqual(data["rank"], self.data["rank"])
        self.assertEqual(data["title"], self.data["title"])
        self.assertEqual(data["description"], self.data["description"])

    def test_award_create(self):
        """Test award creation creates an award object"""
        self.serializer = AwardSerializer(data=self.data)
        self._assert_serializer_is_valid()
        award = self.serializer.save()

        self.assertEqual(award.rank, self.data["rank"])
        self.assertEqual(award.title, self.data["title"])
        self.assertEqual(award.description, self.data["description"])

    def test_award_update(self):
        """Test award update alters an award object"""
        self.assertTrue(self.award.is_custom)

        self.serializer = AwardSerializer(
            instance=self.award,
            data=self.data,
        )
        self._assert_serializer_is_valid()
        self.serializer.save()

        self.assertFalse(self.award.is_custom)

    def _assert_serializer_is_valid(self):
        if not self.serializer.is_valid():
            self.fail("Test serializer should be valid")

    def _assert_serializer_is_invalid(self):
        if self.serializer.is_valid():
            self.fail("Test serializer should be invalid")
