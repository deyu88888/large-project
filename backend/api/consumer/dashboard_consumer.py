import json
import logging
import traceback
import sys
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import get_user_model
import re

logger = logging.getLogger(__name__)

console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.DEBUG)
formatter = logging.Formatter(
    '[%(levelname)s] %(asctime)s - %(name)s - %(message)s')
console_handler.setFormatter(formatter)

User = get_user_model()


def sanitize_channel_name(channel: str) -> str:
    """
    Replaces any character that is not alphanumeric, underscore, hyphen, or 
    period with an underscore.
    """
    return re.sub(r'[^\w\.-]', '_', channel)


class DashboardConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for dashboard data.
    Provides real-time updates for dashboard statistics, activities, and 
    notifications.
    Public access is allowed by default.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = None
        self.is_authenticated = True
        self.group_name = "dashboard"
        self.channel_name = None
        self.subscribed_channels = set()
        self.connection_id = id(self)
        self.client_info = None
        self.message_log = []

    async def connect(self):
        """
        Handles WebSocket connection establishment for the dashboard.
        Accepts the connection, adds it to the dashboard group, and sends 
        initial public data.
        """
        self.client_info = {
            'client_addr': self.scope.get('client', ['Unknown'])[0] if self.scope.get('client') else 'Unknown',
            'headers': dict(self.scope.get('headers', [])),
            'path': self.scope.get('path', 'Unknown'),
            'user_agent': next((v.decode() for k, v in self.scope.get('headers', []) if k.decode().lower() == 'user-agent'), 'Unknown')
        }

        try:
            self.channel_name = f"dashboard_{self.connection_id}"

            await self.accept()

            await self.channel_layer.group_add(self.group_name, self.channel_name)

            initial_message = {
                'type': 'connection_established',
                'message': 'Connected to dashboard websocket. Public access enabled.',
                'available_channels': [
                    'dashboard/stats',
                    'dashboard/activities',
                    'dashboard/notifications'
                ]
            }
            await self.send(text_data=json.dumps(initial_message))
            self.message_log.append(('sent', initial_message))

            # Send initial data for public access
            await self.send_dashboard_stats()
            await self.send_activities()

        except Exception as e:

            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f"Connection failed: {str(e)}"
            }))

        await self.close()

    async def disconnect(self, close_code):
        """
        Handles WebSocket disconnection from the dashboard.
        Removes the connection from the main dashboard group and all 
        subscribed channels.
        """
        try:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

            for channel in self.subscribed_channels:
                channel_group = f"channel_{sanitize_channel_name(channel)}"
                await self.channel_layer.group_discard(channel_group, self.channel_name)
        except Exception:
            pass

    async def receive(self, text_data):
        """
        Handles incoming WebSocket messages from clients.
        Processes different message types like authentication, subscription, 
        and data requests.
        """
        try:
            data = json.loads(text_data)
            message_type = data.get("type", "")

            self.message_log.append(('received', data))

            if message_type == "authenticate":
                token = data.get("token", "")
                mode = data.get("mode", "")

                if mode == "public":
                    await self.authenticate(None)
                else:
                    await self.authenticate(token)
                return

            if message_type == "subscribe":
                channel = data.get("channel", "")
                if channel:
                    await self.subscribe_to_channel(channel)
                return

            if message_type == "unsubscribe":
                channel = data.get("channel", "")
                if channel:
                    await self.unsubscribe_from_channel(channel)
                return

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

            await self.send_error(f"Unknown message type: {message_type}")

        except json.JSONDecodeError:
            await self.send_error("Invalid JSON format")
        except Exception as e:
            await self.send_error(f"Error processing message: {str(e)}")

    async def authenticate(self, token):
        """
        Authenticates the WebSocket connection using a JWT token.
        Optional for dashboard - enhances with user-specific data if available.
        Public access is maintained even if authentication fails.
        """
        if not token:
            auth_response = {
                'type': 'auth_response',
                'status': 'success',
                'message': 'Public access mode',
                'available_channels': [
                    'dashboard/stats',
                    'dashboard/activities',
                    'dashboard/notifications'
                ]
            }

            await self.send(text_data=json.dumps(auth_response))
            self.message_log.append(('sent', auth_response))
            return

        try:
            user = await self.get_user_from_token(token)

            if user and not isinstance(user, AnonymousUser):
                self.user = user

                auth_response = {
                    'type': 'auth_response',
                    'status': 'success',
                    'message': f'Authenticated as {user.username}',
                    'available_channels': [
                        'dashboard/stats',
                        'dashboard/activities',
                        'dashboard/notifications'
                    ]
                }

                await self.send(text_data=json.dumps(auth_response))
                self.message_log.append(('sent', auth_response))

                await self.send_notifications()
            else:
                auth_response = {
                    'type': 'auth_response',
                    'status': 'success',
                    'message': 'Public access mode',
                    'available_channels': [
                        'dashboard/stats',
                        'dashboard/activities',
                        'dashboard/notifications'
                    ]
                }

                await self.send(text_data=json.dumps(auth_response))
                self.message_log.append(('sent', auth_response))
        except Exception:
            auth_response = {
                'type': 'auth_response',
                'status': 'success',
                'message': 'Public access mode',
                'available_channels': [
                    'dashboard/stats',
                    'dashboard/activities',
                    'dashboard/notifications'
                ]
            }

            await self.send(text_data=json.dumps(auth_response))
            self.message_log.append(('sent', auth_response))

    @database_sync_to_async
    def get_user_from_token(self, token):
        """
        Validates JWT token and returns the corresponding user.
        Returns AnonymousUser if token is invalid or user doesn't exist.
        """
        try:
            access_token = AccessToken(token)
            user_id = access_token.payload.get('user_id')

            if not user_id:
                return AnonymousUser()

            user = User.objects.get(id=user_id)
            return user
        except (TokenError, User.DoesNotExist, Exception):
            return AnonymousUser()

    async def subscribe_to_channel(self, channel):
        """
        Subscribe to a specific data channel.
        Adds connection to channel group and sends initial data for the channel.
        """
        if channel not in ['dashboard/stats', 'dashboard/activities', 'dashboard/notifications']:
            await self.send_error(f"Unknown channel: {channel}")
            return

        channel_group = f"channel_{sanitize_channel_name(channel)}"

        try:
            await self.channel_layer.group_add(channel_group, self.channel_name)
            self.subscribed_channels.add(channel)
        except Exception as e:
            await self.send_error(f"Error subscribing to channel: {str(e)}")
            return

        subscription_response = {
            'type': 'subscription_update',
            'channel': channel,
            'status': 'subscribed'
        }

        await self.send(text_data=json.dumps(subscription_response))
        self.message_log.append(('sent', subscription_response))

        if channel == 'dashboard/stats':
            await self.send_dashboard_stats()
        elif channel == 'dashboard/activities':
            await self.send_activities()
        elif channel == 'dashboard/notifications':
            await self.send_notifications()

    async def unsubscribe_from_channel(self, channel):
        """
        Unsubscribe from a specific data channel.
        Removes connection from channel group and confirms unsubscription.
        """
        channel_group = f"channel_{sanitize_channel_name(channel)}"

        try:
            await self.channel_layer.group_discard(channel_group, self.channel_name)

            if channel in self.subscribed_channels:
                self.subscribed_channels.remove(channel)
        except Exception as e:
            await self.send_error(f"Error unsubscribing from channel: {str(e)}")
            return

        unsubscription_response = {
            'type': 'subscription_update',
            'channel': channel,
            'status': 'unsubscribed'
        }

        await self.send(text_data=json.dumps(unsubscription_response))
        self.message_log.append(('sent', unsubscription_response))

    async def send_error(self, message):
        """
        Sends an error message to the client.
        """
        error_message = {
            'type': 'error',
            'message': message
        }

        await self.send(text_data=json.dumps(error_message))
        self.message_log.append(('sent', error_message))

    async def send_dashboard_stats(self):
        """
        Fetches and sends dashboard statistics to the client.
        """
        try:
            stats = await self.get_dashboard_stats()

            response = {
                'type': 'dashboard.stats',
                'channel': 'dashboard/stats',
                'data': stats
            }

            await self.send(text_data=json.dumps(response))
            self.message_log.append(('sent', response))
        except Exception as e:
            await self.send_error(f"Error fetching dashboard stats: {str(e)}")

    async def send_activities(self):
        """
        Fetches and sends recent activities to the client.
        Handles error reporting if activities cannot be retrieved.
        """
        try:
            activities = await self.get_recent_activities()

            response = {
                'type': 'dashboard.activities',
                'channel': 'dashboard/activities',
                'data': activities
            }

            await self.send(text_data=json.dumps(response))
            self.message_log.append(('sent', response))
        except Exception as e:
            await self.send_error(f"Error fetching activities: {str(e)}")

    async def send_notifications(self):
        """
        Fetches and sends notifications to the client.
        Handles error reporting if notifications cannot be retrieved.
        """
        try:
            notifications = await self.get_notifications()

            response = {
                'type': 'dashboard.notifications',
                'channel': 'dashboard/notifications',
                'data': notifications
            }

            await self.send(text_data=json.dumps(response))
            self.message_log.append(('sent', response))
        except Exception as e:
            await self.send_error(f"Error fetching notifications: {str(e)}")

    async def dashboard_stats_update(self, event):
        """
        Broadcast handler for dashboard statistics updates.
        Forwards updates received from the channel layer to the client.
        """
        try:
            response = {
                'type': 'dashboard.stats',
                'channel': 'dashboard/stats',
                'data': event["data"]
            }

            await self.send(text_data=json.dumps(response))
            self.message_log.append(('sent', response))
        except Exception:
            pass

    async def dashboard_activities_update(self, event):
        """
        Broadcast handler for activities updates.
        Forwards updates received from the channel layer to the client.
        """
        try:
            response = {
                'type': 'dashboard.activities',
                'channel': 'dashboard/activities',
                'data': event["data"]
            }

            await self.send(text_data=json.dumps(response))
            self.message_log.append(('sent', response))
        except Exception:
            pass

    async def dashboard_notifications_update(self, event):
        """
        Broadcast handler for notifications updates.
        Forwards updates received from the channel layer to the client.
        """
        try:
            response = {
                'type': 'dashboard.notifications',
                'channel': 'dashboard/notifications',
                'data': event["data"]
            }

            await self.send(text_data=json.dumps(response))
            self.message_log.append(('sent', response))
        except Exception:
            pass

    @sync_to_async
    def get_dashboard_stats(self):
        """
        Fetches dashboard statistics from the database.
        Returns counts of societies, events, pending approvals, and active members.
        """
        try:
            from api.models import Society, Event, Student

            society_count = Society.objects.count()
            event_count = Event.objects.count()
            pending_count = Society.objects.filter(status="Pending").count()
            student_count = Student.objects.count()

            return {
                "totalSocieties": society_count,
                "totalEvents": event_count,
                "pendingApprovals": pending_count,
                "activeMembers": student_count,
            }
        except Exception:
            return {"totalSocieties": 0, "totalEvents": 0, "pendingApprovals": 0, "activeMembers": 0}

    @sync_to_async
    def get_recent_activities(self):
        """
        Fetches recent activities from the database.
        Returns a list of the 10 most recent activities.
        """
        try:
            from ..models import Activity

            activities = Activity.objects.order_by('-created_at')[:10]

            result = [{"description": activity.description}
                      for activity in activities]
            return result
        except Exception:
            return []

    @sync_to_async
    def get_notifications(self):
        """
        Fetches notifications from the database.
        Returns user-specific notifications for authenticated users,
        or public notifications for unauthenticated users.
        """
        try:
            from api.models import Notification

            if self.user:
                notifications = Notification.objects.filter(
                    for_user=self.user).order_by('-send_time')[:10]
                return [{"message": f"{n.header}: {n.body}"} for n in notifications]
            else:
                try:
                    if hasattr(Notification, 'is_public'):
                        notifications = Notification.objects.filter(
                            is_public=True).order_by('-send_time')[:10]
                    else:
                        notifications = Notification.objects.order_by(
                            '-send_time')[:5]

                    return [{"message": f"{n.header}: {n.body}"} for n in notifications]
                except Exception:
                    return []
        except Exception:
            return []

    @sync_to_async
    def get_site_settings(self):
        """
        Fetches the SiteSettings from the database.
        Returns default settings if the database query fails.
        """
        try:
            from api.models import SiteSettings

            settings = SiteSettings.load()
            return settings
        except Exception:
            class DefaultSettings:
                introduction_title = "Welcome to Student Societies Dashboard"
                introduction_content = "This dashboard provides an overview of all student societies and their activities."
            return DefaultSettings()
