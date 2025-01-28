from django.db.models.signals import m2m_changed, post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Student, Society, Notification

@receiver(m2m_changed, sender=Student.president_of.through)
def update_is_president_on_m2m_change(sender, instance, action, reverse, pk_set, **kwargs):
    """
    Update 'is_president' field and broadcast changes to the dashboard.
    """
    if action in ["post_add", "post_remove", "post_clear"]:
        if not reverse:
            instance.is_president = instance.president_of.exists()
            instance.save(update_fields=['is_president'])
        else:
            for student_pk in pk_set:
                try:
                    student = Student.objects.get(pk=student_pk)
                    student.is_president = student.president_of.exists()
                    student.save(update_fields=['is_president'])
                except Student.DoesNotExist:
                    pass
        
        # Broadcast the updated statistics
        broadcast_dashboard_update()


@receiver(post_save, sender=Society)
def notify_on_status_change(sender, instance, **kwargs):
    """
    Notify leader on society status change and broadcast updates.
    """
    if instance.status == "Approved":
        Notification.objects.create(
            for_event=None,
            for_student=instance.leader,
            message=f"Your request to create the society '{instance.name}' has been approved!"
        )
    elif instance.status == "Rejected":
        Notification.objects.create(
            for_event=None,
            for_student=instance.leader,
            message=f"Your request to create the society '{instance.name}' was rejected. Please contact the admin for details.",
        )
    
    # Broadcast the updated statistics
    broadcast_dashboard_update()


def broadcast_dashboard_update():
    """
    Fetch updated dashboard statistics and send them to the WebSocket group.
    """
    from .models import Society, Event, Student

    # Calculate the statistics
    stats = {
        "totalSocieties": Society.objects.count(),
        "totalEvents": Event.objects.count(),
        "pendingApprovals": Society.objects.filter(status="Pending").count(),
        "activeMembers": Student.objects.count(),
    }

    # Send the data through WebSocket
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "dashboard",  # Group name
        {
            "type": "dashboard.update",  # Event type
            "data": stats,               # Data payload
        }
    )