class OptionsAuthExemptMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Skip authentication for OPTIONS requests
        if request.method == 'OPTIONS':
            response = self.get_response(request)
            response['Allow'] = 'GET, POST, PUT, DELETE, OPTIONS'
            return response
        return self.get_response(request)


class TokenDebugMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Check if this is a token refresh attempt
        if request.path == '/api/user/token/refresh':
            try:
                import json
                body = json.loads(request.body.decode('utf-8'))
                if 'refresh' not in body:
                    print(f"WARNING: Token refresh missing 'refresh' key. Received: {body.keys()}")
            except Exception as e:
                print(f"Error parsing refresh token request: {e}")
                
        response = self.get_response(request)
        
        # Log 401 responses for debugging
        if response.status_code == 401:
            print(f"401 Unauthorized: {request.path} | Auth header present: {'Authorization' in request.headers}")
            
        return response