from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging

logger = logging.getLogger(__name__)

def broadcast_dashboard_stats():
    """
    Broadcasts updated dashboard statistics to all subscribed clients.
    Call this function whenever stats might have changed.
    """
    try:
        from api.models import Society, Event, Student
        
        stats = {
            "totalSocieties": Society.objects.count(),
            "totalEvents": Event.objects.count(),
            "pendingApprovals": Society.objects.filter(status="Pending").count(),
            "activeMembers": Student.objects.count(),
        }
        
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "channel_dashboard/stats",
            {
                "type": "dashboard_stats_update",
                "data": stats
            }
        )
        
        logger.info("Dashboard stats broadcast sent")
        return True
    except Exception as e:
        logger.error(f"Error broadcasting dashboard stats: {e}")
        return False

def broadcast_activities(activities=None):
    """
    Broadcasts updated activities to all subscribed clients.
    Call this function when new activities are created.
    
    Args:
        activities: Optional list of activity dictionaries to broadcast.
                   If None, will fetch recent activities from the database.
    """
    try:
        if activities is None:
            # Fetch recent activities from the database
            from api.models import Activity
            db_activities = Activity.objects.order_by('-created_at')[:10]
            activities = [{"description": activity.description} for activity in db_activities]
        
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "channel_dashboard/activities",
            {
                "type": "dashboard_activities_update",
                "data": activities
            }
        )
        
        logger.info("Activities broadcast sent")
        return True
    except Exception as e:
        logger.error(f"Error broadcasting activities: {e}")
        return False

def broadcast_notifications(user_id=None, notifications=None):
    """
    Broadcasts updated notifications to subscribed clients.
    
    Args:
        user_id: Optional user ID to send notifications to a specific user.
                If None, will broadcast to all users.
        notifications: Optional list of notification dictionaries to broadcast.
                      If None, will fetch recent notifications from the database.
    """
    try:
        if notifications is None and user_id is not None:
            # Fetch notifications for the specified user from the database
            from api.models import Notification
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            try:
                user = User.objects.get(id=user_id)
                db_notifications = Notification.objects.filter(user=user).order_by('-created_at')[:10]
                notifications = [{"message": notification.message} for notification in db_notifications]
            except User.DoesNotExist:
                logger.warning(f"User {user_id} not found for notification broadcast")
                return False
        
        if not notifications:
            logger.warning("No notifications to broadcast")
            return False
            
        channel_layer = get_channel_layer()
        
        # Broadcast to all users subscribed to the notifications channel
        async_to_sync(channel_layer.group_send)(
            "channel_dashboard/notifications",
            {
                "type": "dashboard_notifications_update",
                "data": notifications
            }
        )
        
        logger.info("Notifications broadcast sent")
        return True
    except Exception as e:
        logger.error(f"Error broadcasting notifications: {e}")
        return False

def broadcast_event_update(event):
    """
    Broadcasts an event update to all subscribed clients.
    Call this function when events are created, updated or deleted.
    
    Args:
        event: The Event model instance that has been updated.
    """
    try:
        # Convert the event to a dictionary format
        event_dict = {
            "id": event.id,
            "title": event.title,
            "date": event.date.isoformat(),
            "startTime": event.start_time.isoformat() if hasattr(event, 'start_time') else "",
            "duration": event.duration if hasattr(event, 'duration') else "",
        }
        
        # First update dashboard stats since an event change affects them
        broadcast_dashboard_stats()
        
        # Then broadcast the specific event update
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "dashboard",  # Use the main dashboard group
            {
                "type": "update_events",
                "events": [event_dict]
            }
        )
        
        logger.info(f"Event update broadcast sent for event {event.id}")
        return True
    except Exception as e:
        logger.error(f"Error broadcasting event update: {e}")
        return False