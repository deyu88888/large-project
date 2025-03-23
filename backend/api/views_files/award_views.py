from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from api.models import Award, AwardStudent
from api.serializers import AwardSerializer, AwardStudentSerializer


def get_award_student_if_exists(pk):
    """Gets an award_student object by pk if defined, else returns an error msg"""
    try:
        return AwardStudent.objects.get(pk=pk), None
    except AwardStudent.DoesNotExist:
        return None, Response(
            {"error": "Award assignment not found"},
            status=status.HTTP_404_NOT_FOUND
        )

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
            try:
                award = Award.objects.get(pk=pk)
                serializer = AwardSerializer(award)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Award.DoesNotExist:
                return Response(
                    {"error": "Award not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

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
        try:
            award = Award.objects.get(pk=pk)
        except Award.DoesNotExist:
            return Response(
                {"error": "Award not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = AwardSerializer(award, data=request.data)
        if serializer_is_valid_and_save(serializer):
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk: int) -> Response:
        """Delete an award by ID"""
        try:
            award = Award.objects.get(pk=pk)
        except Award.DoesNotExist:
            return Response(
                {"error": "Award not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        award.delete()
        return Response(
            {"message": "Award deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
        )


class AwardStudentView(APIView):
    """Handles listing, assigning, retrieving, updating, and deleting awards for students"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None) -> Response:
        """List all award assignments or retrieve a specific one if ID is provided"""
        if pk:
            award_student, error = get_award_student_if_exists(pk)
            if error:
                return error

            serializer = AwardStudentSerializer(award_student)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # List all award assignments
        awards_students = AwardStudent.objects.filter(student=request.user)
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
        try:
            award_student = AwardStudent.objects.get(pk=pk)
        except AwardStudent.DoesNotExist:
            return Response(
                {"error": "Award assignment not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        award_student.delete()
        return Response(
            {"message": "Award assignment deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
        )
