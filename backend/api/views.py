from django.shortcuts import render
from api.models import User
from rest_framework import generics, status
from .serializers import UserSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Student, User


# class NoteListCreate(generics.ListCreateAPIView):
#     serializer_class = NoteSerializer
#     permission_classes = [IsAuthenticated]

#     def get_queryset(self):
#         user = self.request.user
#         return Note.objects.filter(author=user)

#     def perform_create(self, serializer):
#         if serializer.is_valid():
#             serializer.save(author=self.request.user)
#         else:
#             print(serializer.errors)


# class NoteDelete(generics.DestroyAPIView):
#     serializer_class = NoteSerializer
#     permission_classes = [IsAuthenticated]

#     def get_queryset(self):
#         user = self.request.user
#         return Note.objects.filter(author=user)


class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]



class RegisterView(APIView):
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        major = request.data.get("major")
        department = request.data.get("department")  # Optional
        societies = request.data.get("societies")  # Optional
        print("DEBUG: Received data:", request.data)
        print(f"DEBUG: Username: {username}, Password: {password}, Major: {major}")

        if not username or not password or not major:
            return Response({"error": "Username, password, and major are required."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already exists."}, status=status.HTTP_400_BAD_REQUEST)

        # Create the student user
        student = Student.objects.create_user(
            username=username,
            password=password,
            major=major,
        )

        # Add optional advisor-related fields if provided
        if department:
            student.department = department
        if societies:
            student.societies.add(*societies.split(","))  

        student.save()
        return Response({"message": "Student registered successfully."}, status=status.HTTP_201_CREATED)
