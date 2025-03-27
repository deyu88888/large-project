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

def sanitize_channel_name(channel: str) -> str:
    """
    Replaces any character that is not alphanumeric, underscore, hyphen, or period with an underscore.
    """
    return re.sub(r'[^\w\.-]', '_', channel)

logger = logging.getLogger(__name__)

console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('[%(levelname)s] %(asctime)s - %(name)s - %(message)s')
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)
logger.setLevel(logging.DEBUG)

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
        self.is_authenticated = True  
        self.group_name = "dashboard"
        self.channel_name = None
        self.subscribed_channels = set()
        self.connection_id = id(self)
        self.client_info = None
        self.message_log = []
        
        logger.debug(f"[WebSocket Debug] DashboardConsumer instance created: {self.connection_id}")

    async def connect(self):
        """
        Handles WebSocket connection.
        Accepts the connection and allows public access by default.
        """
        self.client_info = {
            'client_addr': self.scope.get('client', ['Unknown'])[0] if self.scope.get('client') else 'Unknown',
            'headers': dict(self.scope.get('headers', [])),
            'path': self.scope.get('path', 'Unknown'),
            'user_agent': next((v.decode() for k, v in self.scope.get('headers', []) if k.decode().lower() == 'user-agent'), 'Unknown')
        }
        
        logger.debug(f"[WebSocket Debug] Connection attempt from: {self.client_info['client_addr']}")
        logger.debug(f"[WebSocket Debug] User-Agent: {self.client_info['user_agent']}")
        logger.debug(f"[WebSocket Debug] Path: {self.client_info['path']}")
        
        try:
            self.channel_name = f"dashboard_{self.connection_id}"
            logger.debug(f"[WebSocket Debug] Channel name: {self.channel_name}")

            logger.debug(f"[WebSocket Debug] Accepting connection {self.connection_id}")
            await self.accept()
            logger.debug(f"[WebSocket Debug] Connection {self.connection_id} accepted")
            
            try:
                logger.debug(f"[WebSocket Debug] Adding {self.channel_name} to group: {self.group_name}")
                await self.channel_layer.group_add(self.group_name, self.channel_name)
                logger.debug(f"[WebSocket Debug] Successfully added to group {self.group_name}")
            except Exception as e:
                logger.error(f"[WebSocket Debug] Error adding to group {self.group_name}: {e}")
                logger.error(f"[WebSocket Debug] Traceback: {traceback.format_exc()}")
                raise

            try:
                initial_message = {
                    'type': 'connection_established',
                    'message': 'Connected to dashboard websocket. Public access enabled.',
                    'available_channels': [
                        'dashboard/stats',
                        'dashboard/activities', 
                        'dashboard/notifications'
                    ]
                }
                logger.debug(f"[WebSocket Debug] Sending initial message to {self.channel_name}: {initial_message}")
                await self.send(text_data=json.dumps(initial_message))
                self.message_log.append(('sent', initial_message))
                logger.debug(f"[WebSocket Debug] Initial message sent successfully")
            except Exception as e:
                logger.error(f"[WebSocket Debug] Error sending initial message: {e}")
                logger.error(f"[WebSocket Debug] Traceback: {traceback.format_exc()}")
                raise
            
            try:
                logger.debug(f"[WebSocket Debug] Sending initial dashboard stats")
                await self.send_dashboard_stats()
                logger.debug(f"[WebSocket Debug] Initial dashboard stats sent successfully")
            except Exception as e:
                logger.error(f"[WebSocket Debug] Error sending dashboard stats: {e}")
                logger.error(f"[WebSocket Debug] Traceback: {traceback.format_exc()}")
            
            try:
                logger.debug(f"[WebSocket Debug] Sending initial activities")
                await self.send_activities()
                logger.debug(f"[WebSocket Debug] Initial activities sent successfully")
            except Exception as e:
                logger.error(f"[WebSocket Debug] Error sending activities: {e}")
                logger.error(f"[WebSocket Debug] Traceback: {traceback.format_exc()}")
            
            logger.info(f"[WebSocket Debug] Connection {self.connection_id} fully initialized")
            
        except Exception as e:
            logger.error(f"[WebSocket Debug] Connection error in connect(): {e}")
            logger.error(f"[WebSocket Debug] Traceback: {traceback.format_exc()}")
            try:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': f"Connection failed: {str(e)}"
                }))
            except:
                pass
            await self.close()

    async def disconnect(self, close_code):
        """Handles WebSocket disconnection."""
        logger.debug(f"[WebSocket Debug] Disconnect called for {self.connection_id} with code {close_code}")
        
        try:
            logger.debug(f"[WebSocket Debug] Removing {self.channel_name} from group {self.group_name}")
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            logger.debug(f"[WebSocket Debug] Removed from group {self.group_name}")
            
            for channel in self.subscribed_channels:
                channel_group = f"channel_{sanitize_channel_name(channel)}"
                logger.debug(f"[WebSocket Debug] Removing from channel group {channel_group}")
                await self.channel_layer.group_discard(channel_group, self.channel_name)
            
            logger.info(f"[WebSocket Debug] Connection {self.connection_id} disconnected with code {close_code}")
        except Exception as e:
            logger.error(f"[WebSocket Debug] Disconnection error: {e}")
            logger.error(f"[WebSocket Debug] Traceback: {traceback.format_exc()}")

    async def receive(self, text_data):
        """Handles incoming WebSocket messages from clients."""
        logger.debug(f"[WebSocket Debug] Message received from connection {self.connection_id}")
        
        try:
            logger.debug(f"[WebSocket Debug] Raw message: {text_data}")
            data = json.loads(text_data)
            message_type = data.get("type", "")
            
            self.message_log.append(('received', data))
            
            logger.debug(f"[WebSocket Debug] Parsed message type: {message_type}")

            if message_type == "authenticate":
                logger.debug(f"[WebSocket Debug] Authentication request received")
                token = data.get("token", "")
                mode = data.get("mode", "")
                
                if mode == "public":
                    logger.debug(f"[WebSocket Debug] Public mode authentication requested")
                    await self.authenticate(None)  
                else:
                    logger.debug(f"[WebSocket Debug] Token authentication requested")
                    await self.authenticate(token)
                return

            if message_type == "subscribe":
                channel = data.get("channel", "")
                logger.debug(f"[WebSocket Debug] Subscription request for channel: {channel}")
                
                if channel:
                    await self.subscribe_to_channel(channel)
                else:
                    logger.warning(f"[WebSocket Debug] Subscription request with no channel specified")
                return
                
            if message_type == "unsubscribe":
                channel = data.get("channel", "")
                logger.debug(f"[WebSocket Debug] Unsubscription request for channel: {channel}")
                
                if channel:
                    await self.unsubscribe_from_channel(channel)
                else:
                    logger.warning(f"[WebSocket Debug] Unsubscription request with no channel specified")
                return

            if message_type == "request_data":
                channel = data.get("channel", "")
                logger.debug(f"[WebSocket Debug] Data request for channel: {channel}")
                
                if channel == "dashboard/stats":
                    await self.send_dashboard_stats()
                elif channel == "dashboard/activities":
                    await self.send_activities()
                elif channel == "dashboard/notifications":
                    await self.send_notifications()
                else:
                    logger.warning(f"[WebSocket Debug] Unknown channel in data request: {channel}")
                    await self.send_error(f"Unknown channel: {channel}")
                return

            logger.warning(f"[WebSocket Debug] Unknown message type received: {message_type}")
            await self.send_error(f"Unknown message type: {message_type}")
            
        except json.JSONDecodeError as e:
            logger.error(f"[WebSocket Debug] JSON Decode Error: {e}, Raw data: {text_data}")
            await self.send_error("Invalid JSON format")
        except Exception as e:
            logger.error(f"[WebSocket Debug] Error processing message: {e}")
            logger.error(f"[WebSocket Debug] Traceback: {traceback.format_exc()}")
            await self.send_error(f"Error processing message: {str(e)}")

    async def authenticate(self, token):
        """
        Authenticates the WebSocket connection using a JWT token.
        Optional for dashboard - enhances with user-specific data if available.
        """
        if not token:
            logger.debug(f"[WebSocket Debug] No token provided, using public access mode")
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
            
            logger.debug(f"[WebSocket Debug] Sending public access auth response: {auth_response}")
            await self.send(text_data=json.dumps(auth_response))
            self.message_log.append(('sent', auth_response))
            return

        try:
            logger.debug(f"[WebSocket Debug] Validating token")
            user = await self.get_user_from_token(token)
            
            if user and not isinstance(user, AnonymousUser):
                self.user = user
                logger.info(f"[WebSocket Debug] User authenticated: {user.username}")
                
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
                
                logger.debug(f"[WebSocket Debug] Sending user auth success response")
                await self.send(text_data=json.dumps(auth_response))
                self.message_log.append(('sent', auth_response))
                
                logger.debug(f"[WebSocket Debug] Sending user-specific notifications after auth")
                await self.send_notifications()
            else:
                logger.warning(f"[WebSocket Debug] Invalid token provided, falling back to public access")
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
                
                logger.debug(f"[WebSocket Debug] Sending fallback public auth response")
                await self.send(text_data=json.dumps(auth_response))
                self.message_log.append(('sent', auth_response))
        except Exception as e:
            logger.error(f"[WebSocket Debug] Authentication error: {e}")
            logger.error(f"[WebSocket Debug] Traceback: {traceback.format_exc()}")
            
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
            
            logger.debug(f"[WebSocket Debug] Sending error fallback public auth response")
            await self.send(text_data=json.dumps(auth_response))
            self.message_log.append(('sent', auth_response))

    @database_sync_to_async
    def get_user_from_token(self, token):
        """Validates JWT token and returns the corresponding user."""
        try:
            logger.debug(f"[WebSocket Debug] Validating JWT token")
            access_token = AccessToken(token)
            user_id = access_token.payload.get('user_id')
            
            if not user_id:
                logger.warning(f"[WebSocket Debug] No user_id in token payload")
                return AnonymousUser()
                
            logger.debug(f"[WebSocket Debug] Looking up user with id: {user_id}")
            user = User.objects.get(id=user_id)
            logger.debug(f"[WebSocket Debug] User found: {user.username}")
            return user
        except TokenError as e:
            logger.warning(f"[WebSocket Debug] Invalid token: {e}")
            return AnonymousUser()
        except User.DoesNotExist:
            logger.warning(f"[WebSocket Debug] User from token does not exist")
            return AnonymousUser()
        except Exception as e:
            logger.error(f"[WebSocket Debug] Token validation error: {e}")
            logger.error(f"[WebSocket Debug] Traceback: {traceback.format_exc()}")
            return AnonymousUser()

    async def subscribe_to_channel(self, channel):
        """Subscribe to a specific data channel."""
        logger.debug(f"[WebSocket Debug] Channel subscription request: {channel}")
        
        if channel not in ['dashboard/stats', 'dashboard/activities', 'dashboard/notifications']:
            logger.warning(f"[WebSocket Debug] Unknown channel subscription requested: {channel}")
            await self.send_error(f"Unknown channel: {channel}")
            return
            
        channel_group = f"channel_{sanitize_channel_name(channel)}"
        
        try:
            logger.debug(f"[WebSocket Debug] Adding to channel group: {channel_group}")
            await self.channel_layer.group_add(channel_group, self.channel_name)
            self.subscribed_channels.add(channel)
            logger.debug(f"[WebSocket Debug] Successfully added to channel group: {channel_group}")
        except Exception as e:
            logger.error(f"[WebSocket Debug] Error adding to channel group {channel_group}: {e}")
            logger.error(f"[WebSocket Debug] Traceback: {traceback.format_exc()}")
            await self.send_error(f"Error subscribing to channel: {str(e)}")
            return
        
        subscription_response = {
            'type': 'subscription_update',
            'channel': channel,
            'status': 'subscribed'
        }
        
        logger.debug(f"[WebSocket Debug] Sending subscription confirmation")
        await self.send(text_data=json.dumps(subscription_response))
        self.message_log.append(('sent', subscription_response))
        
        logger.debug(f"[WebSocket Debug] Sending initial data for channel: {channel}")
        if channel == 'dashboard/stats':
            await self.send_dashboard_stats()
        elif channel == 'dashboard/activities':
            await self.send_activities()
        elif channel == 'dashboard/notifications':
            await self.send_notifications()

    async def unsubscribe_from_channel(self, channel):
        """Unsubscribe from a specific data channel."""
        logger.debug(f"[WebSocket Debug] Channel unsubscription request: {channel}")
        
        channel_group = f"channel_{sanitize_channel_name(channel)}"
        
        try:
            logger.debug(f"[WebSocket Debug] Removing from channel group: {channel_group}")
            await self.channel_layer.group_discard(channel_group, self.channel_name)
            
            if channel in self.subscribed_channels:
                self.subscribed_channels.remove(channel)
                
            logger.debug(f"[WebSocket Debug] Successfully removed from channel group: {channel_group}")
        except Exception as e:
            logger.error(f"[WebSocket Debug] Error removing from channel group {channel_group}: {e}")
            logger.error(f"[WebSocket Debug] Traceback: {traceback.format_exc()}")
            await self.send_error(f"Error unsubscribing from channel: {str(e)}")
            return
        
        unsubscription_response = {
            'type': 'subscription_update',
            'channel': channel,
            'status': 'unsubscribed'
        }
        
        logger.debug(f"[WebSocket Debug] Sending unsubscription confirmation")
        await self.send(text_data=json.dumps(unsubscription_response))
        self.message_log.append(('sent', unsubscription_response))

    async def send_error(self, message):
        """Sends an error message to the client."""
        logger.debug(f"[WebSocket Debug] Sending error message: {message}")
        
        error_message = {
            'type': 'error',
            'message': message
        }
        
        await self.send(text_data=json.dumps(error_message))
        self.message_log.append(('sent', error_message))

    async def send_dashboard_stats(self):
        """Fetches and sends dashboard statistics."""
        logger.debug(f"[WebSocket Debug] Fetching dashboard stats")
        
        try:
            stats = await self.get_dashboard_stats()
            logger.debug(f"[WebSocket Debug] Stats fetched: {stats}")
            
            response = {
                'type': 'dashboard.stats',
                'channel': 'dashboard/stats',
                'data': stats
            }
            
            logger.debug(f"[WebSocket Debug] Sending dashboard stats")
            await self.send(text_data=json.dumps(response))
            self.message_log.append(('sent', response))
            logger.debug(f"[WebSocket Debug] Dashboard stats sent successfully")
        except Exception as e:
            logger.error(f"[WebSocket Debug] Error sending dashboard stats: {e}")
            logger.error(f"[WebSocket Debug] Traceback: {traceback.format_exc()}")
            await self.send_error(f"Error fetching dashboard stats: {str(e)}")

    async def send_activities(self):
        """Fetches and sends recent activities."""
        logger.debug(f"[WebSocket Debug] Fetching activities")
        
        try:
            activities = await self.get_recent_activities()
            logger.debug(f"[WebSocket Debug] Activities fetched: {len(activities)} items")
            
            response = {
                'type': 'dashboard.activities',
                'channel': 'dashboard/activities',
                'data': activities
            }
            
            logger.debug(f"[WebSocket Debug] Sending activities")
            await self.send(text_data=json.dumps(response))
            self.message_log.append(('sent', response))
            logger.debug(f"[WebSocket Debug] Activities sent successfully")
        except Exception as e:
            logger.error(f"[WebSocket Debug] Error sending activities: {e}")
            logger.error(f"[WebSocket Debug] Traceback: {traceback.format_exc()}")
            await self.send_error(f"Error fetching activities: {str(e)}")

    async def send_notifications(self):
        """Fetches and sends notifications."""
        logger.debug(f"[WebSocket Debug] Fetching notifications")
        
        try:
            notifications = await self.get_notifications()
            logger.debug(f"[WebSocket Debug] Notifications fetched: {len(notifications)} items")
            
            response = {
                'type': 'dashboard.notifications',
                'channel': 'dashboard/notifications',
                'data': notifications
            }
            
            logger.debug(f"[WebSocket Debug] Sending notifications")
            await self.send(text_data=json.dumps(response))
            self.message_log.append(('sent', response))
            logger.debug(f"[WebSocket Debug] Notifications sent successfully")
        except Exception as e:
            logger.error(f"[WebSocket Debug] Error sending notifications: {e}")
            logger.error(f"[WebSocket Debug] Traceback: {traceback.format_exc()}")
            await self.send_error(f"Error fetching notifications: {str(e)}")

    async def dashboard_stats_update(self, event):
        """Broadcast handler for dashboard statistics updates."""
        logger.debug(f"[WebSocket Debug] Received dashboard stats update from channel layer")
        
        try:
            response = {
                'type': 'dashboard.stats',
                'channel': 'dashboard/stats',
                'data': event["data"]
            }
            
            await self.send(text_data=json.dumps(response))
            self.message_log.append(('sent', response))
            logger.debug(f"[WebSocket Debug] Forwarded dashboard stats update to client")
        except Exception as e:
            logger.error(f"[WebSocket Debug] Error forwarding dashboard stats update: {e}")

    async def dashboard_activities_update(self, event):
        """Broadcast handler for activities updates."""
        logger.debug(f"[WebSocket Debug] Received activities update from channel layer")
        
        try:
            response = {
                'type': 'dashboard.activities',
                'channel': 'dashboard/activities',
                'data': event["data"]
            }
            
            await self.send(text_data=json.dumps(response))
            self.message_log.append(('sent', response))
            logger.debug(f"[WebSocket Debug] Forwarded activities update to client")
        except Exception as e:
            logger.error(f"[WebSocket Debug] Error forwarding activities update: {e}")

    async def dashboard_notifications_update(self, event):
        """Broadcast handler for notifications updates."""
        logger.debug(f"[WebSocket Debug] Received notifications update from channel layer")
        
        try:
            response = {
                'type': 'dashboard.notifications',
                'channel': 'dashboard/notifications',
                'data': event["data"]
            }
            
            await self.send(text_data=json.dumps(response))
            self.message_log.append(('sent', response))
            logger.debug(f"[WebSocket Debug] Forwarded notifications update to client")
        except Exception as e:
            logger.error(f"[WebSocket Debug] Error forwarding notifications update: {e}")

    @sync_to_async
    def get_dashboard_stats(self):
        """Fetches dashboard statistics from the database."""
        logger.debug(f"[WebSocket Debug] Executing get_dashboard_stats")
        
        try:
            from api.models import Society, Event, Student
            
            society_count = Society.objects.count()
            event_count = Event.objects.count()
            pending_count = Society.objects.filter(status="Pending").count()
            student_count = Student.objects.count()
            
            logger.debug(f"[WebSocket Debug] Counts: societies={society_count}, events={event_count}, pending={pending_count}, students={student_count}")
            
            return {
                "totalSocieties": society_count,
                "totalEvents": event_count,
                "pendingApprovals": pending_count,
                "activeMembers": student_count,
            }
        except Exception as e:
            logger.error(f"[WebSocket Debug] Error fetching dashboard stats from database: {e}")
            logger.error(f"[WebSocket Debug] Traceback: {traceback.format_exc()}")
            
            return {"totalSocieties": 0, "totalEvents": 0, "pendingApprovals": 0, "activeMembers": 0}

    @sync_to_async
    def get_recent_activities(self):
        """Fetches recent activities from the database."""
        logger.debug(f"[WebSocket Debug] Executing get_recent_activities")
        
        try:
            from ..models import Activity
            
            logger.debug(f"[WebSocket Debug] Activity model fields: {[f.name for f in Activity._meta.get_fields()]}")
            
            activities = Activity.objects.order_by('-created_at')[:10]
            logger.debug(f"[WebSocket Debug] Found {len(activities)} recent activities")
            
            result = [{"description": activity.description} for activity in activities]
            return result
        except Exception as e:
            logger.error(f"[WebSocket Debug] Error fetching recent activities from database: {e}")
            logger.error(f"[WebSocket Debug] Traceback: {traceback.format_exc()}")
            
            return []

    @sync_to_async
    def get_notifications(self):
        """Fetches notifications from the database."""
        logger.debug(f"[WebSocket Debug] Executing get_notifications")
        
        try:
            from api.models import Notification
            
            logger.debug(f"[WebSocket Debug] Notification model fields: {[f.name for f in Notification._meta.get_fields()]}")
            
            if self.user:
                logger.debug(f"[WebSocket Debug] Fetching user-specific notifications for {self.user.username}")
                notifications = Notification.objects.filter(for_user=self.user).order_by('-send_time')[:10]
                logger.debug(f"[WebSocket Debug] Found {len(notifications)} user-specific notifications")
                return [{"message": f"{n.header}: {n.body}"} for n in notifications]
            else:
                logger.debug(f"[WebSocket Debug] Fetching public notifications")
                try:
                    if hasattr(Notification, 'is_public'):
                        logger.debug(f"[WebSocket Debug] Using is_public filter")
                        notifications = Notification.objects.filter(is_public=True).order_by('-send_time')[:10]
                    else:
                        logger.debug(f"[WebSocket Debug] No is_public field, getting most recent")
                        notifications = Notification.objects.order_by('-send_time')[:5]
                    
                    logger.debug(f"[WebSocket Debug] Found {len(notifications)} public notifications")
                    return [{"message": f"{n.header}: {n.body}"} for n in notifications]
                except Exception as inner_e:
                    logger.error(f"[WebSocket Debug] Error in public notifications query: {inner_e}")
                    logger.error(f"[WebSocket Debug] Traceback: {traceback.format_exc()}")
                    return []
        except Exception as e:
            logger.error(f"[WebSocket Debug] Error fetching notifications from database: {e}")
            logger.error(f"[WebSocket Debug] Traceback: {traceback.format_exc()}")
            return []

    @sync_to_async
    def get_site_settings(self):
        """Fetches the SiteSettings from the database."""
        logger.debug(f"[WebSocket Debug] Executing get_site_settings")
        
        try:
            from api.models import SiteSettings
            
            logger.debug(f"[WebSocket Debug] SiteSettings model fields: {[f.name for f in SiteSettings._meta.get_fields()]}")
            
            settings = SiteSettings.load()
            logger.debug(f"[WebSocket Debug] Site settings loaded successfully")
            return settings
        except Exception as e:
            logger.error(f"[WebSocket Debug] Error fetching site settings from database: {e}")
            logger.error(f"[WebSocket Debug] Traceback: {traceback.format_exc()}")
            
            class DefaultSettings:
                introduction_title = "Welcome to Student Societies Dashboard"
                introduction_content = "This dashboard provides an overview of all student societies and their activities."
            return DefaultSettings()