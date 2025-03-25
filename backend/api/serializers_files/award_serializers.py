from api.models import Award, AwardStudent, Student
from api.serializers import StudentSerializer
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

class AwardSerializer(serializers.ModelSerializer):
    """
    Serializer for the Award model
    """
    class Meta:
        """Metadata for AwardSerializer"""
        model = Award
        fields = '__all__'


class AwardStudentSerializer(serializers.ModelSerializer):
    """
    Serializer for the AwardStudent model
    """
    award = AwardSerializer(read_only=True)
    student = StudentSerializer(read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(
        source='student',
        queryset=Student.objects.all(),
        write_only=True
    )
    award_id = serializers.PrimaryKeyRelatedField(
        source='award',
        queryset=Award.objects.all(),
        write_only=True
    )

    class Meta:
        """Metadata for AwardStudentSerializer"""
        model = AwardStudent
        fields = ["id", "award", "student", "student_id", "award_id", "awarded_at"]
        read_only_fields = ["awarded_at"]


class StudentAwardSerializer(serializers.ModelSerializer):
    """
    Serializer for the Student model.
    """
    awards = AwardStudentSerializer(source='award_students', many=True, read_only=True)

    class Meta:
        """Metadata for StudentAwardSerializer"""
        model = Student
        fields = ["award_students"]
        read_only_fields = ["award_students"]
