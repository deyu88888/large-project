from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from api.models import Society, SocietyRequest
from api.serializers import StudentSerializer, SocietySerializer, SocietyRequestSerializer
from api.views_files.view_utility import student_has_no_role, get_student_if_user_is_student


class JoinedSocietiesView(APIView):
    """
    API View for managing societies that a student has joined.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get a users joined societies"""
        student, error = get_student_if_user_is_student(request.user, "manage")
        if error:
            return error

        societies = student.societies_belongs_to.all()
        serializer = SocietySerializer(societies, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, society_id):
        """
        Handle DELETE request to leave a society.
        """
        student, error = get_student_if_user_is_student(request.user, "leave")
        if error:
            return error

        try:
            society = Society.objects.get(id=society_id)
        except Society.DoesNotExist:
            return Response(
                {"error": "Society does not exist."},
                status=status.HTTP_404_NOT_FOUND
            )

        if not student.societies_belongs_to.filter(id=society_id).exists():
            return Response(
                {"error": "You are not a member of this society."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validates a student doesn't already have a role in a society
        error = student_has_no_role(student, False)
        if error:
            return error

        student.societies_belongs_to.remove(society)

        return Response(
            {"message": f"Successfully left society '{society.name}'."},
            status=status.HTTP_200_OK
        )


class SocietyMembersListView(APIView):
    """Lists the members of a society"""
    def get(self, request, society_id):
        """Gets a list of members belonging to a society referenced by society_id"""
        society = get_object_or_404(Society, pk=society_id)
        members = society.society_members.all()
        serializer = StudentSerializer(members, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class StudentSocietyDataView(APIView):
    """
    API View to inspect a specific society (accessible to anyone).
    """
    permission_classes = [AllowAny]

    def get(self, request, society_id):
        """Gets data pertinent to a society"""
        society = get_object_or_404(Society, id=society_id)
        serializer = SocietySerializer(society, context={"request": request})
        serializer_data = serializer.data

        if request.user.is_authenticated and hasattr(request.user, 'student'):
            is_member = society.society_members.filter(
                id=request.user.student.id
            ).exists()
            if is_member:
                serializer_data["is_member"] = 2
            else:
                request_exists = SocietyRequest.objects.filter(
                    society=society,
                    from_student=request.user.student,
                    intent="JoinSoc"
                ).exists()
                serializer_data["is_member"] = 1 if request_exists else 0

        return Response(serializer_data, status=status.HTTP_200_OK)



class PendingJoinRequestsView(APIView):
    """API View to retrieve all pending requests for the current user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Returns a list of pending society requests from a user."""
        user = request.user
        if not hasattr(user, "student"):
            return Response({"error": "Only students can view their requests."},
                            status=status.HTTP_403_FORBIDDEN)

        # Get all pending requests for this student
        pending_requests = SocietyRequest.objects.filter(
            from_student=user.student,
            approved=False
        )

        serializer = SocietyRequestSerializer(pending_requests, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class PublicSocietiesView(APIView):
    """
    API View for public users to view all societies.
    - **GET**: Retrieves a list of all societies with their details.
    """
    permission_classes = []
    
    def get(self, request):
        """
        Retrieves a list of all societies with their details.
        """
        societies = Society.objects.all()
        serializer = SocietySerializer(societies, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)