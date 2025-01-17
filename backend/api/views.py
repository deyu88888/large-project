from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from api.models import User, Society, Event
from rest_framework import generics
from .serializers import UserSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny


class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


@login_required
def dashboard_stats(request):
    """
    API endpoint to provide dashboard statistics:
    - Total number of societies
    - Total number of events
    - Pending society approvals
    """
    stats = {
        "total_societies": Society.objects.count(),
        "total_events": Event.objects.count(),
        "pending_approvals": Society.objects.filter(approved_by=None).count(),
    }
    return JsonResponse(stats)

def root_view(request):
    return JsonResponse({"message": "Welcome to the Universal Student Society API!"})
