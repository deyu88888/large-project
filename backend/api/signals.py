from django.db.models.signals import m2m_changed, post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from channels.exceptions import ChannelFull
from .models import AwardStudent, Student, Society, Notification

@receiver(m2m_changed, sender=Student.president_of.through)
def update_is_president_on_m2m_change(sender, instance, action, reverse, pk_set, **kwargs):
    """
    Update 'is_president' field and broadcast changes to the dashboard.
    """
    print(f"[m2m_changed] Triggered for {instance} with action {action}")

    if action in ["post_add", "post_remove", "post_clear"]:
        try:
            if not reverse:
                instance.is_president = instance.president_of.exists()
                instance.save(update_fields=['is_president'])
                print(f"Updated 'is_president' for {instance.username}")
            else:
                for student_pk in pk_set:
                    try:
                        student = Student.objects.get(pk=student_pk)
                        student.is_president = student.president_of.exists()
                        student.save(update_fields=['is_president'])
                        print(f"Updated 'is_president' for {student.username}")
                    except Student.DoesNotExist:
                        print(f"Student with ID {student_pk} does not exist.")
        except Exception as e:
            print(f"Error updating 'is_president': {e}")

        # Broadcast the updated statistics
        broadcast_dashboard_update()


@receiver(post_save, sender=Society)
def notify_on_status_change(sender, instance, **kwargs):
    """
    Notify leader on society status change and broadcast updates.
    """
    print(f"[post_save] Triggered for Society: {instance.name}")
    
    try:
        if instance.status == "Approved":
            Notification.objects.create(
                for_event=None,
                for_student=instance.leader,
                message=f"Your request to create the society '{instance.name}' has been approved!"
            )
            print(f"Notification created for Society Approval: {instance.name}")
        elif instance.status == "Rejected":
            Notification.objects.create(
                for_event=None,
                for_student=instance.leader,
                message=f"Your request to create the society '{instance.name}' was rejected. Please contact the admin for details.",
            )
            print(f"Notification created for Society Rejection: {instance.name}")
    except Exception as e:
        print(f"Error creating notification: {e}")
    
    # Broadcast the updated statistics
    broadcast_dashboard_update()


def broadcast_dashboard_update():
    """
    Fetch updated dashboard statistics and send them to the WebSocket group.
    """
    print("[broadcast_dashboard_update] Broadcasting updates...")
    from .models import Society, Event, Student

    try:
        # Calculate the statistics
        stats = {
            "totalSocieties": Society.objects.count(),
            "totalEvents": Event.objects.count(),
            "pendingApprovals": Society.objects.filter(status="Pending").count(),
            "activeMembers": Student.objects.count(),
        }
        print(f"Calculated stats: {stats}")

        # Send the data through WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "dashboard",  # Group name
            {
                "type": "dashboard.update",  # Event type
                "data": stats,               # Data payload
            }
        )
        print("[broadcast_dashboard_update] Successfully sent updates to WebSocket.")
    except ChannelFull:
        print("[broadcast_dashboard_update] Error: Channel is full, unable to send the message.")
    except Exception as e:
        print(f"[broadcast_dashboard_update] Error broadcasting updates: {e}")
        
@receiver(post_save, sender=AwardStudent)
def notify_student_award(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "award_notifications",
            {
                "type": "send_award_notification",
                "message": {
                    "student": str(instance.student),
                    "award": str(instance.award),
                    "awarded_at": instance.awarded_at.isoformat(),
                },
            },
        )