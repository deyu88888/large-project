from django.urls import path
from . import views

urlpatterns = [
    # Endpoint to create a new user
    path('users/create/', views.CreateUserView.as_view(), name='create_user'),

    # Endpoint for dashboard stats
    path('dashboard/stats/', views.dashboard_stats, name='dashboard_stats'),
]
