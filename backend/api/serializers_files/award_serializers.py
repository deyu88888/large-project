from api.models import Award, AwardStudent, Student
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from user_serializers import StudentSerializer

class AwardSerializer(serializers.ModelSerializer):
    """
    Serializer for the Award model
    """
    class Meta:
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
        model = AwardStudent
        fields = ['id', 'award', 'student', 'student_id', 'award_id', 'awarded_at']