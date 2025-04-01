import unittest
from unittest.mock import MagicMock
from django.test import TestCase, RequestFactory
from django.http import HttpResponse

from api.middleware import OptionsAuthExemptMiddleware

class TestOptionsAuthExemptMiddleware(TestCase):
    def setUp(self):
        """Set up test environment."""
        self.factory = RequestFactory()
        self.get_response_mock = MagicMock(return_value=HttpResponse())
        self.middleware = OptionsAuthExemptMiddleware(self.get_response_mock)
    
    def test_init(self):
        """Test middleware initialization."""
        middleware = OptionsAuthExemptMiddleware(self.get_response_mock)
        self.assertEqual(middleware.get_response, self.get_response_mock)
    
    def test_call_options_method(self):
        """Test middleware handling of OPTIONS requests."""
        request = self.factory.options('/api/test-endpoint/')
        response = self.middleware.__call__(request)
        self.get_response_mock.assert_called_once_with(request)
        self.assertIn('Allow', response)
        self.assertEqual(response['Allow'], 'GET, POST, PUT, DELETE, OPTIONS')
    
    def test_call_non_options_method(self):
        """Test middleware handling of non-OPTIONS requests."""
        http_methods = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'PATCH']
        
        for method in http_methods:
            self.get_response_mock.reset_mock()
            request_method = getattr(self.factory, method.lower())
            request = request_method('/api/test-endpoint/')
            
            response = self.middleware.__call__(request)
            self.get_response_mock.assert_called_once_with(request)
            self.assertNotIn('Allow', response)
    
    def test_middleware_chaining(self):
        """Test that middleware correctly chains with subsequent middleware."""
        inner_response = HttpResponse()
        inner_response['X-Inner-Middleware'] = 'Called'
        inner_middleware_mock = MagicMock(return_value=inner_response)
        
        middleware = OptionsAuthExemptMiddleware(inner_middleware_mock)
        request = self.factory.options('/api/test-endpoint/')
        response = middleware(request)
        inner_middleware_mock.assert_called_once_with(request)
        
        self.assertIn('Allow', response)
        self.assertEqual(response['Allow'], 'GET, POST, PUT, DELETE, OPTIONS')
        self.assertIn('X-Inner-Middleware', response)
        self.assertEqual(response['X-Inner-Middleware'], 'Called')
    
    def test_with_authenticated_options_request(self):
        """Test middleware with a simulated authenticated OPTIONS request."""
        request = self.factory.options('/api/test-endpoint/')
        request.META['HTTP_AUTHORIZATION'] = 'Bearer faketoken123'
        
        response = self.middleware.__call__(request)
        self.assertIn('Allow', response)
        self.assertEqual(response['Allow'], 'GET, POST, PUT, DELETE, OPTIONS')
    
    def test_response_status_preserved(self):
        """Test that response status from the inner middleware is preserved."""
        inner_response = HttpResponse(status=201)
        get_response_mock = MagicMock(return_value=inner_response)
        middleware = OptionsAuthExemptMiddleware(get_response_mock)
        
        request = self.factory.options('/api/test-endpoint/')
        response = middleware(request)
        
        self.assertEqual(response.status_code, 201)
        self.assertIn('Allow', response)
        self.assertEqual(response['Allow'], 'GET, POST, PUT, DELETE, OPTIONS')
    
    def test_custom_response_headers_preserved(self):
        """Test that custom headers from inner middleware are preserved."""
        inner_response = HttpResponse()
        inner_response['X-Custom-Header'] = 'CustomValue'
        inner_response['Content-Type'] = 'application/json'
        get_response_mock = MagicMock(return_value=inner_response)
        
        middleware = OptionsAuthExemptMiddleware(get_response_mock)
        request = self.factory.options('/api/test-endpoint/')
        response = middleware(request)
        
        self.assertIn('X-Custom-Header', response)
        self.assertEqual(response['X-Custom-Header'], 'CustomValue')
        self.assertIn('Content-Type', response)
        self.assertEqual(response['Content-Type'], 'application/json')
        
        self.assertIn('Allow', response)
        self.assertEqual(response['Allow'], 'GET, POST, PUT, DELETE, OPTIONS')

if __name__ == '__main__':
    unittest.main()