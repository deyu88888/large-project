from django.test import TestCase
from django.core.exceptions import ValidationError
from api.models import validate_social_media_links


class TestSocialMediaLinksValidator(TestCase):
    """Test cases for the validate_social_media_links validator function."""

    def test_valid_social_media_links(self):
        """Test validation succeeds with valid social media links."""
        valid_links = {
            'Facebook': 'https://facebook.com/test',
            'Instagram': 'https://instagram.com/test',
            'X': 'https://x.com/test',
            'WhatsApp': 'https://wa.me/1234567890',
            'Email': 'mailto:test@example.com',
            'Other': 'https://example.com/profile'
        }
        
        try:
            validate_social_media_links(valid_links)
        except ValidationError:
            self.fail("validate_social_media_links raised ValidationError unexpectedly with valid links")
        
        valid_subset = {
            'Facebook': 'https://facebook.com/test',
            'Email': 'mailto:test@example.com'
        }
        
        try:
            validate_social_media_links(valid_subset)
        except ValidationError:
            self.fail("validate_social_media_links raised ValidationError unexpectedly with valid subset")
        
        try:
            validate_social_media_links({})
        except ValidationError:
            self.fail("validate_social_media_links raised ValidationError unexpectedly with empty dict")

    def test_non_dictionary_input(self):
        """Test validation fails when input is not a dictionary."""
        with self.assertRaises(ValidationError) as context:
            validate_social_media_links(['https://facebook.com/test'])
        self.assertIn("Social media links must be provided as a dictionary", str(context.exception))
        
        with self.assertRaises(ValidationError) as context:
            validate_social_media_links("https://facebook.com/test")
        
        self.assertIn("Social media links must be provided as a dictionary", str(context.exception))
        
        with self.assertRaises(ValidationError) as context:
            validate_social_media_links(None)
        
        self.assertIn("Social media links must be provided as a dictionary", str(context.exception))

    def test_invalid_platform_keys(self):
        """Test validation fails with invalid platform keys."""
        invalid_platform = {
            'Facebook': 'https://facebook.com/test',
            'Twitter': 'https://twitter.com/test'
        }
        
        with self.assertRaises(ValidationError) as context:
            validate_social_media_links(invalid_platform)
        
        self.assertIn("'Twitter' is not a valid social media platform", str(context.exception))
        
        multiple_invalid = {
            'LinkedIn': 'https://linkedin.com/test',
            'TikTok': 'https://tiktok.com/test',
            'Snapchat': 'https://snapchat.com/test'
        }
        
        with self.assertRaises(ValidationError) as context:
            validate_social_media_links(multiple_invalid)
        
        self.assertIn("'LinkedIn' is not a valid social media platform", str(context.exception))

    def test_non_string_link_values(self):
        """Test validation fails when link values are not strings."""
        with self.assertRaises(ValidationError) as context:
            validate_social_media_links({'Facebook': 12345})
        
        self.assertIn("The value for 'Facebook' must be a string URL", str(context.exception))
        
        with self.assertRaises(ValidationError) as context:
            validate_social_media_links({'Instagram': ['https://instagram.com/test']})
        
        self.assertIn("The value for 'Instagram' must be a string URL", str(context.exception))
        
        with self.assertRaises(ValidationError) as context:
            validate_social_media_links({'WhatsApp': {'url': 'https://wa.me/1234567890'}})
        
        self.assertIn("The value for 'WhatsApp' must be a string URL", str(context.exception))

    def test_invalid_url_format(self):
        """Test validation fails with invalid URL formats."""
        with self.assertRaises(ValidationError) as context:
            validate_social_media_links({'Facebook': 'facebook.com/test'})
        self.assertIn("The link for 'Facebook' must be a valid URL starting with", str(context.exception))
        
        with self.assertRaises(ValidationError) as context:
            validate_social_media_links({'X': 'ftp://x.com/test'})
        self.assertIn("The link for 'X' must be a valid URL starting with", str(context.exception))
        
        try:
            validate_social_media_links({'Email': ''})
        except ValidationError:
            self.fail("validate_social_media_links raised ValidationError unexpectedly with empty string URL")
        
        with self.assertRaises(ValidationError) as context:
            validate_social_media_links({'Email': 'email:test@example.com'})
        self.assertIn("The link for 'Email' must be a valid URL starting with", str(context.exception))

    def test_mixed_valid_and_invalid_links(self):
        """Test validation with mixed valid and invalid links."""
        mixed_links = {
            'Facebook': 'https://facebook.com/test',
            'Instagram': 'instagram.com/test',
            'X': 'https://x.com/test',
            'WhatsApp': ['https://wa.me/1234567890'],
            'LinkedIn': 'https://linkedin.com/test'
        }
        
        with self.assertRaises(ValidationError) as context:
            validate_social_media_links(mixed_links)
        error_message = str(context.exception)
        self.assertTrue(
            "'LinkedIn' is not a valid social media platform" in error_message or
            "The value for 'WhatsApp' must be a string URL" in error_message or
            "The link for 'Instagram' must be a valid URL" in error_message
        )

    def test_case_sensitivity(self):
        """Test that platform keys are case sensitive."""
        invalid_case = {
            'facebook': 'https://facebook.com/test',
            'instagram': 'https://instagram.com/test'
        }
        
        with self.assertRaises(ValidationError) as context:
            validate_social_media_links(invalid_case)
        self.assertIn("'facebook' is not a valid social media platform", str(context.exception))