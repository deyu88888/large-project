# api/dashboard_consumers.py
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import get_user_model

# Set up logger
logger = logging.getLogger(__name__)

User = get_user_model()

class DashboardConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for dashboard data.
    Provides real-time updates for dashboard statistics, activities, and notifications.
    Public access is allowed by default.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = None
        self.is_authenticated = True  # Default to True for public access
        self.group_name = "dashboard"
        self.channel_name = None
        self.subscribed_channels = set()

    async def connect(self):
        """
        Handles WebSocket connection.
        Accepts the connection and allows public access by default.
        """
        try:
            # Create a unique channel name
            self.channel_name = f"dashboard_{id(self)}"

            # Accept the connection immediately
            await self.accept()
            
            logger.info(f"[DashboardConsumer] WebSocket connected: {self.channel_name}")

            # Initially join the main dashboard group
            await self.channel_layer.group_add(self.group_name, self.channel_name)

            # Let the client know we're connected with public access
            await self.send(text_data=json.dumps({
                'type': 'connection_established',
                'message': 'Connected to dashboard websocket. Public access enabled.',
                'available_channels': [
                    'dashboard/stats',
                    'dashboard/activities', 
                    'dashboard/notifications'
                ]
            }))
            
            # Immediately send initial data since this is public access
            await self.send_dashboard_stats()
            await self.send_activities()
            
        except Exception as e:
            logger.error(f"[DashboardConsumer] Connection error: {e}")
            await self.close()

    async def disconnect(self, close_code):
        """Handles WebSocket disconnection."""
        try:
            # Remove from the main dashboard group
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            
            # Remove from all subscribed channel groups
            for channel in self.subscribed_channels:
                await self.channel_layer.group_discard(f"channel_{channel}", self.channel_name)
            
            logger.info(f"[DashboardConsumer] Disconnected: {self.channel_name}, code: {close_code}")
        except Exception as e:
            logger.error(f"[DashboardConsumer] Disconnection error: {e}")

    async def receive(self, text_data):
        """Handles incoming WebSocket messages from clients."""
        try:
            data = json.loads(text_data)
            message_type = data.get("type", "")
            
            logger.debug(f"[DashboardConsumer] Received message: {message_type}")

            # Handle authentication (optional for additional permissions)
            if message_type == "authenticate":
                await self.authenticate(data.get("token", ""))
                return

            # Handle subscription requests - allow for all
            if message_type == "subscribe":
                channel = data.get("channel", "")
                if channel:
                    await self.subscribe_to_channel(channel)
                return
                
            # Handle unsubscription requests
            if message_type == "unsubscribe":
                channel = data.get("channel", "")
                if channel:
                    await self.unsubscribe_from_channel(channel)
                return

            # Handle data requests - allow for all
            if message_type == "request_data":
                channel = data.get("channel", "")
                if channel == "dashboard/stats":
                    await self.send_dashboard_stats()
                elif channel == "dashboard/activities":
                    await self.send_activities()
                elif channel == "dashboard/notifications":
                    await self.send_notifications()
                else:
                    await self.send_error(f"Unknown channel: {channel}")
                return

            # Unknown message type
            await self.send_error(f"Unknown message type: {message_type}")
            
        except json.JSONDecodeError:
            await self.send_error("Invalid JSON format")
        except Exception as e:
            logger.error(f"[DashboardConsumer] Error processing message: {e}")
            await self.send_error(f"Error processing message: {str(e)}")

    async def authenticate(self, token):
        """
        Authenticates the WebSocket connection using a JWT token.
        Optional for dashboard - enhances with user-specific data if available.
        """
        # Already authenticated for public access, token is optional
        if not token:
            await self.send(text_data=json.dumps({
                'type': 'auth_response',
                'status': 'success',
                'message': 'Public access mode',
                'available_channels': [
                    'dashboard/stats',
                    'dashboard/activities', 
                    'dashboard/notifications'
                ]
            }))
            return

        try:
            # Validate the token and get the user
            user = await self.get_user_from_token(token)
            
            if user and not isinstance(user, AnonymousUser):
                self.user = user
                logger.info(f"[DashboardConsumer] User authenticated: {user.username}")
                
                await self.send(text_data=json.dumps({
                    'type': 'auth_response',
                    'status': 'success',
                    'message': f'Authenticated as {user.username}',
                    'available_channels': [
                        'dashboard/stats',
                        'dashboard/activities', 
                        'dashboard/notifications'
                    ]
                }))
                
                # Send user-specific data after authentication
                await self.send_notifications()
            else:
                # Keep public access if token is invalid
                await self.send(text_data=json.dumps({
                    'type': 'auth_response',
                    'status': 'success',
                    'message': 'Public access mode',
                    'available_channels': [
                        'dashboard/stats',
                        'dashboard/activities', 
                        'dashboard/notifications'
                    ]
                }))
        except Exception as e:
            logger.error(f"[DashboardConsumer] Authentication error: {e}")
            await self.send(text_data=json.dumps({
                'type': 'auth_response',
                'status': 'success',  # Still success for public access
                'message': 'Public access mode',
                'available_channels': [
                    'dashboard/stats',
                    'dashboard/activities', 
                    'dashboard/notifications'
                ]
            }))

    @database_sync_to_async
    def get_user_from_token(self, token):
        """Validates JWT token and returns the corresponding user."""
        try:
            # Validate the token
            access_token = AccessToken(token)
            user_id = access_token.payload.get('user_id')
            
            if not user_id:
                return AnonymousUser()
                
            # Get the user from the database
            user = User.objects.get(id=user_id)
            return user
        except TokenError:
            logger.warning(f"[DashboardConsumer] Invalid token provided")
            return AnonymousUser()
        except User.DoesNotExist:
            logger.warning(f"[DashboardConsumer] User from token does not exist")
            return AnonymousUser()
        except Exception as e:
            logger.error(f"[DashboardConsumer] Token validation error: {e}")
            return AnonymousUser()

    async def subscribe_to_channel(self, channel):
        """Subscribe to a specific data channel."""
        if channel not in ['dashboard/stats', 'dashboard/activities', 'dashboard/notifications']:
            await self.send_error(f"Unknown channel: {channel}")
            return
            
        channel_group = f"channel_{channel}"
        
        # Add to channel group
        await self.channel_layer.group_add(channel_group, self.channel_name)
        self.subscribed_channels.add(channel)
        
        logger.info(f"[DashboardConsumer] Subscribed to channel: {channel}")
        
        # Send confirmation
        await self.send(text_data=json.dumps({
            'type': 'subscription_update',
            'channel': channel,
            'status': 'subscribed'
        }))
        
        # Send initial data for the channel
        if channel == 'dashboard/stats':
            await self.send_dashboard_stats()
        elif channel == 'dashboard/activities':
            await self.send_activities()
        elif channel == 'dashboard/notifications':
            await self.send_notifications()

    async def unsubscribe_from_channel(self, channel):
        """Unsubscribe from a specific data channel."""
        channel_group = f"channel_{channel}"
        
        # Remove from channel group
        await self.channel_layer.group_discard(channel_group, self.channel_name)
        
        if channel in self.subscribed_channels:
            self.subscribed_channels.remove(channel)
        
        logger.info(f"[DashboardConsumer] Unsubscribed from channel: {channel}")
        
        # Send confirmation
        await self.send(text_data=json.dumps({
            'type': 'subscription_update',
            'channel': channel,
            'status': 'unsubscribed'
        }))

    async def send_error(self, message):
        """Sends an error message to the client."""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': message
        }))

    async def send_dashboard_stats(self):
        """Fetches and sends dashboard statistics."""
        stats = await self.get_dashboard_stats()
        await self.send(text_data=json.dumps({
            'type': 'dashboard.stats',
            'channel': 'dashboard/stats',
            'data': stats
        }))

    async def send_activities(self):
        """Fetches and sends recent activities."""
        activities = await self.get_recent_activities()
        await self.send(text_data=json.dumps({
            'type': 'dashboard.activities',
            'channel': 'dashboard/activities',
            'data': activities
        }))

    async def send_notifications(self):
        """Fetches and sends notifications."""
        notifications = await self.get_notifications()
        await self.send(text_data=json.dumps({
            'type': 'dashboard.notifications',
            'channel': 'dashboard/notifications',
            'data': notifications
        }))

    # ---- Group message handlers ----

    async def dashboard_stats_update(self, event):
        """Broadcast handler for dashboard statistics updates."""
        await self.send(text_data=json.dumps({
            'type': 'dashboard.stats',
            'channel': 'dashboard/stats',
            'data': event["data"]
        }))

    async def dashboard_activities_update(self, event):
        """Broadcast handler for activities updates."""
        await self.send(text_data=json.dumps({
            'type': 'dashboard.activities',
            'channel': 'dashboard/activities',
            'data': event["data"]
        }))

    async def dashboard_notifications_update(self, event):
        """Broadcast handler for notifications updates."""
        await self.send(text_data=json.dumps({
            'type': 'dashboard.notifications',
            'channel': 'dashboard/notifications',
            'data': event["data"]
        }))

    # ---- Data retrieval methods ----

    @sync_to_async
    def get_dashboard_stats(self):
        """Fetches dashboard statistics from the database."""
        try:
            from api.models import Society, Event, Student
            return {
                "totalSocieties": Society.objects.count(),
                "totalEvents": Event.objects.count(),
                "pendingApprovals": Society.objects.filter(status="Pending").count(),
                "activeMembers": Student.objects.count(),
            }
        except Exception as e:
            logger.error(f"Error fetching dashboard stats: {e}")
            return {"totalSocieties": 0, "totalEvents": 0, "pendingApprovals": 0, "activeMembers": 0}

    @sync_to_async
    def get_recent_activities(self):
        """Fetches recent activities from the database."""
        try:
            from api.models import Activity
            activities = Activity.objects.order_by('-created_at')[:10]
            return [{"description": activity.description} for activity in activities]
        except Exception as e:
            logger.error(f"Error fetching recent activities: {e}")
            return []

    @sync_to_async
    def get_notifications(self):
        """Fetches notifications from the database."""
        try:
            from api.models import Notification
            if self.user:
                # For authenticated users, show their notifications
                notifications = Notification.objects.filter(user=self.user).order_by('-created_at')[:10]
                return [{"message": notification.message} for notification in notifications]
            else:
                # For public access, show public notifications
                try:
                    # Try to get public notifications first
                    notifications = Notification.objects.filter(is_public=True).order_by('-created_at')[:10]
                    return [{"message": notification.message} for notification in notifications]
                except:
                    # If is_public field doesn't exist, just get the most recent ones
                    notifications = Notification.objects.order_by('-created_at')[:5]
                    return [{"message": notification.message} for notification in notifications]
        except Exception as e:
            logger.error(f"Error fetching notifications: {e}")
            return []

    @sync_to_async
    def get_site_settings(self):
        """Fetches the SiteSettings from the database."""
        try:
            from api.models import SiteSettings
            return SiteSettings.load()
        except Exception as e:
            logger.error(f"Error fetching site settings: {e}")
            # Return a default object with sensible defaults
            class DefaultSettings:
                introduction_title = "Welcome to Student Societies Dashboard"
                introduction_content = "This dashboard provides an overview of all student societies and their activities."
            return DefaultSettings()