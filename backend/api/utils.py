import json
import random
from django.core.mail import send_mail
from django.http.response import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.cache import cache
from backend.settings import EMAIL_HOST_USER
from rest_framework import status

OTP_VALIDITY_MINUTES = 5

def generate_otp():
    return str(random.randint(100000, 999999))

def send_otp_email(email, otp):
    subject = 'Your OTP code'
    message = f"Your OTP code is: {otp}. It is valid for {OTP_VALIDITY_MINUTES} minutes."

    send_mail(subject,
              message,
              EMAIL_HOST_USER,
              [email],
              fail_silently=False)

@csrf_exempt
def request_otp(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            email = data.get("email")

            if not email or not email.endswith("@kcl.ac.uk"):
                return JsonResponse({"error": "Only KCL emails are allowed"}, status=status.HTTP_400_BAD_REQUEST)

            otp = generate_otp()

            cache.set(f"otp_{email}", otp, timeout=OTP_VALIDITY_MINUTES * 60)

            send_otp_email(email, otp)
            return JsonResponse({"message": "OTP sent to your email"}, status=status.HTTP_200_OK)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return JsonResponse({"error": "Invalid request"}, status=status.HTTP_400_BAD_REQUEST)

@csrf_exempt
def verify_otp(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            email = data.get("email")
            otp = data.get("otp")

            if not email or not otp:
                return JsonResponse({"error": "Email and OTP are required."}, status=status.HTTP_400_BAD_REQUEST)

            stored_otp = cache.get(f"otp_{email}")

            if not stored_otp:
                return JsonResponse({"error": "OTP has expired or is invalid."}, status=status.HTTP_400_BAD_REQUEST)

            if otp != stored_otp:
                return JsonResponse({"error": "Invalid OTP. Please try again."}, status=status.HTTP_400_BAD_REQUEST)

            cache.delete(f"otp_{email}")

            return JsonResponse({"message": "OTP verified successfully."}, status=status.HTTP_200_OK)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return JsonResponse({"error": "Invalid request"}, status=status.HTTP_400_BAD_REQUEST)
