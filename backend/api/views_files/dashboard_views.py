from django.db.models import Count
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from api.models import Society, Event, Student
from api.serializers import SocietySerializer, EventSerializer, \
    StudentSerializer, DashboardStatisticSerializer


class DashboardStatsView(APIView):
    """
    View to provide aggregated statistics for the dashboard.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Gets aggregated statistics from the database"""
        total_societies = Society.objects.count()
        total_events = Event.objects.count()
        pending_approvals = Society.objects.filter(status="Pending").count()
        active_members = Student.objects.aggregate(active_members=Count("id"))["active_members"]

        stats = {
            "total_societies": total_societies,
            "total_events": total_events,
            "pending_approvals": pending_approvals,
            "active_members": active_members,
        }
        serializer = DashboardStatisticSerializer(stats)
        return Response(serializer.data, status=200)


class SearchView(APIView):
    """View to facilitate the search function"""
    permission_classes = [AllowAny]

    def get(self, request):
        """Gets students, events, and societies via search query"""
        query = request.query_params.get('q', '').strip()

        if not query:
            return Response({"error": "No search query provided."}, status=400)

        student_results = Student.objects.filter(username__icontains=query)
        student_serializer = StudentSerializer(
            student_results,
            many=True,
            context={'request': request}
        )

        event_results = Event.objects.filter(
            title__icontains=query,
            status="Approved"
        )
        event_serializer = EventSerializer(
            event_results,
            many=True,
            context={'request': request}
        )

        society_results = Society.objects.filter(name__icontains=query)
        society_serializer = SocietySerializer(
            society_results,
            many=True,
            context={'request': request}
        )

        return Response({
            "students": student_serializer.data,
            "events": event_serializer.data,
            "societies": society_serializer.data
        })
