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