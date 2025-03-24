from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from api.models import Award, AwardStudent, Student
from api.serializers import AwardSerializer, AwardStudentSerializer
from api.views_files.view_utility import get_object_by_id_or_name


def get_award_if_exists(pk):
    """Gets an award object by pk if defined, else returns an error msg"""
    award = get_object_by_id_or_name(Award, pk)
    if not award:
        return None, Response(
            {"error": "Award not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    return award, None

def get_award_student_if_exists(pk):
    """Gets an award_student object by pk if defined, else returns an error msg"""
    award_student = get_object_by_id_or_name(AwardStudent, pk)
    if not award_student:
        return None, Response(
            {"error": "Award assignment not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    return award_student, None

def serializer_is_valid_and_save(serializer):
    """Saves the serializer if it is valid, and returns is_valid"""
    if serializer.is_valid():
        serializer.save()
    return serializer.is_valid()


class AwardView(APIView):
    """Handles listing, creating, retrieving, updating, and deleting awards"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None) -> Response:
        """List all awards or retrieve a specific award if ID is provided"""
        if pk:
            award, error = get_award_if_exists(pk)
            if error:
                return error
            serializer = AwardSerializer(award)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # List all awards if no ID is provided
        awards = Award.objects.all()
        serializer = AwardSerializer(awards, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request) -> Response:
        """Create a new award"""
        serializer = AwardSerializer(data=request.data)
        if serializer_is_valid_and_save(serializer):
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk: int) -> Response:
        """Update an award by ID"""
        award, error = get_award_if_exists(pk)
        if error:
            return error
        serializer = AwardSerializer(award, data=request.data)
        if serializer_is_valid_and_save(serializer):
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk: int) -> Response:
        """Delete an award by ID"""
        award, error = get_award_if_exists(pk)
        if error:
            return error

        award.delete()
        return Response(
            {"message": "Award deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
        )


class AwardStudentView(APIView):
    """Handles listing, assigning, retrieving, updating, and deleting awards for students"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None) -> Response:
        """List all award assignments of current, or specified user"""
        if not pk:
            user = request.user
            pk = user.pk
        try:
            student = Student.objects.get(pk=pk)
        except Student.DoesNotExist:
            return Response({"error": "Invalid student id."},
                status=status.HTTP_403_FORBIDDEN
            )

        # List all award assignments
        awards_students = AwardStudent.objects.filter(student=student)
        serializer = AwardStudentSerializer(awards_students, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request) -> Response:
        """Assign an award to a student"""
        serializer = AwardStudentSerializer(data=request.data)
        if serializer_is_valid_and_save(serializer):
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk: int) -> Response:
        """Update a specific award assignment"""
        award_student, error = get_award_student_if_exists(pk)
        if error:
            return error

        serializer = AwardStudentSerializer(award_student, data=request.data)
        if serializer_is_valid_and_save(serializer):
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk: int) -> Response:
        """Delete a specific award assignment"""
        award_student, error = get_award_student_if_exists(pk)
        if error:
            return error

        award_student.delete()
        return Response(
            {"message": "Award assignment deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
        )
