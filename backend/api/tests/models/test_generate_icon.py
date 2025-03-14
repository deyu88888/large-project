from io import BytesIO
from PIL import Image
from django.test import TestCase
from api.models import generate_icon


class GenerateIconTestCase(TestCase):
    """Tests for the generate_icon function."""

    def test_generate_icon_creates_valid_image(self):
        """Test that generate_icon generates a valid icon image."""
        buffer = generate_icon("J", "D")
        self.assertIsInstance(buffer, BytesIO)

        image = Image.open(buffer)
        self.assertEqual(image.size, (100, 100))
        self.assertEqual(image.format, "JPEG")
