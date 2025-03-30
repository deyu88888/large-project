from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
import json
import logging

logger = logging.getLogger(__name__)

class UniversalConsumer(AsyncWebsocketConsumer):
    """
    A universal WebSocket consumer that handles all application channels.
    """
    
    async def connect(self):
        """Handle WebSocket connection"""
        self.subscribed_groups = set()
        await self.accept()
        await self.send_available_channels()
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        for group in self.subscribed_groups:
            await self.channel_layer.group_discard(group, self.channel_name)
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'subscribe':
                channel = data.get('channel')
                if channel:
                    await self.subscribe_to_channel(channel)
            
            elif message_type == 'unsubscribe':
                channel = data.get('channel')
                if channel:
                    await self.unsubscribe_from_channel(channel)
            
            elif message_type == 'refresh':
                channel = data.get('channel')
                if channel and channel in self.subscribed_groups:
                    await self.channel_layer.group_send(
                        channel,
                        {
                            'type': 'data_refresh',
                            'channel': channel,
                            'sender_channel_name': self.channel_name
                        }
                    )
        except Exception as e:
            logger.error(f"Error in receive: {str(e)}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Error processing message: {str(e)}'
            }))
    
    async def subscribe_to_channel(self, channel):
        """Subscribe to a specific channel"""
        await self.channel_layer.group_add(channel, self.channel_name)
        self.subscribed_groups.add(channel)
        await self.send(text_data=json.dumps({
            'type': 'subscription_confirmed',
            'channel': channel
        }))
    
    async def unsubscribe_from_channel(self, channel):
        """Unsubscribe from a specific channel"""
        if channel in self.subscribed_groups:
            await self.channel_layer.group_discard(channel, self.channel_name)
            self.subscribed_groups.remove(channel)
            await self.send(text_data=json.dumps({
                'type': 'unsubscription_confirmed',
                'channel': channel
            }))
    
    async def send_available_channels(self):
        """Send a list of available channels to the client"""
        available_channels = [
            
            'channel_dashboard/stats',
            'channel_dashboard/activities',
            'channel_dashboard/notifications',
            'activity_logs',
            'events_calendar',
            'admin/societies',
            'admin/students',
            'admin/events',
            'admin/reports',
            'admin/news',
            
            
            'president/society',
            'president/events',
            'president/members',
            'president/news',
            'president/reports',
            
            
            'student/dashboard',
            'student/events',
            'student/societies',
            'student/notifications',
            'student/news'
        ]
        
        await self.send(text_data=json.dumps({
            'type': 'available_channels',
            'channels': available_channels
        }))
    
    
    async def data_refresh(self, event):
        if event.get('sender_channel_name') != self.channel_name:
            await self.send(text_data=json.dumps({
                'type': 'data_update',
                'channel': event.get('channel'),
                'data': event.get('data', {})
            }))
    
    
    async def channel_message(self, event):
        """Generic handler for all channel messages"""
        await self.send(text_data=json.dumps({
            'type': 'data_update',
            'channel': event.get('channel'),
            'data': event.get('data', {})
        }))
    
    
    async def dashboard_stats_update(self, event):
        await self.channel_message({'channel': 'channel_dashboard/stats', 'data': event.get('data')})
    
    async def dashboard_activities_update(self, event):
        await self.channel_message({'channel': 'channel_dashboard/activities', 'data': event.get('data')})
    
    async def dashboard_notifications_update(self, event):
        await self.channel_message({'channel': 'channel_dashboard/notifications', 'data': event.get('data')})
    
    async def activity_logs_update(self, event):
        await self.channel_message({'channel': 'activity_logs', 'data': event.get('data')})
    
    async def events_calendar_update(self, event):
        await self.channel_message({'channel': 'events_calendar', 'data': event.get('data')})
    
    