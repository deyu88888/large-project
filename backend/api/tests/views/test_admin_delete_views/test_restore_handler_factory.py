import unittest
from unittest.mock import patch

from api.views import RestoreHandlerFactory


class TestRestoreHandlerFactory(unittest.TestCase):
    """Tests for the RestoreHandlerFactory class.
    
    This test suite verifies that the RestoreHandlerFactory correctly returns
    the appropriate handler based on the action type and target type.
    """

    def setUp(self):
        """Set up the factory instance."""
        
        self.factory = RestoreHandlerFactory()
        
    def test_get_deletion_handlers(self):
        """Test that the factory returns the correct deletion handlers."""
        
        handler = self.factory.get_handler("Delete", "Student")
        self.assertIsNotNone(handler)
        self.assertTrue(handler.__class__.__name__.endswith('StudentRestoreHandler'))
        
        
        handler = self.factory.get_handler("Delete", "Society")
        self.assertIsNotNone(handler)
        self.assertTrue(handler.__class__.__name__.endswith('SocietyRestoreHandler'))
        
        
        handler = self.factory.get_handler("Delete", "Event")
        self.assertIsNotNone(handler)
        self.assertTrue(handler.__class__.__name__.endswith('EventRestoreHandler'))
        
    def test_get_update_handlers(self):
        """Test that the factory returns the correct update handlers."""
        
        handler = self.factory.get_handler("Update", "Society")
        self.assertIsNotNone(handler)
        self.assertTrue(handler.__class__.__name__.endswith('SocietyUpdateUndoHandler'))
        
        
        handler = self.factory.get_handler("Update", "Event")
        self.assertIsNotNone(handler)
        self.assertTrue(handler.__class__.__name__.endswith('EventUpdateUndoHandler'))
        
    def test_get_status_change_handlers(self):
        """Test that the factory returns the correct status change handlers."""
        
        handler = self.factory.get_handler("Approve", "Society")
        self.assertIsNotNone(handler)
        self.assertTrue(handler.__class__.__name__.endswith('SocietyStatusChangeUndoHandler'))
        
        
        handler = self.factory.get_handler("Reject", "Society")
        self.assertIsNotNone(handler)
        self.assertTrue(handler.__class__.__name__.endswith('SocietyStatusChangeUndoHandler'))
        
        
        handler = self.factory.get_handler("Approve", "Event")
        self.assertIsNotNone(handler)
        self.assertTrue(handler.__class__.__name__.endswith('EventStatusChangeUndoHandler'))
        
        
        handler = self.factory.get_handler("Reject", "Event")
        self.assertIsNotNone(handler)
        self.assertTrue(handler.__class__.__name__.endswith('EventStatusChangeUndoHandler'))
        
    def test_unsupported_combinations(self):
        """Test that the factory returns None for unsupported combinations."""
        
        handler = self.factory.get_handler("Unsupported", "Student")
        self.assertIsNone(handler)
        
        
        handler = self.factory.get_handler("Delete", "Unsupported")
        self.assertIsNone(handler)
        


if __name__ == '__main__':
    unittest.main()