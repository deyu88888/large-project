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
        try:
            # Check if this is a valid channel
            available_channels = self.get_available_channels()
            if channel not in available_channels:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': f'Unknown channel: {channel}'
                }))
                return
                
            # Subscribe to the channel
            await self.channel_layer.group_add(channel, self.channel_name)
            self.subscribed_groups.add(channel)
            
            # Confirm subscription
            await self.send(text_data=json.dumps({
                'type': 'subscription_confirmed',
                'channel': channel
            }))
            
            logger.info(f"Subscribed to channel: {channel}")
        except Exception as e:
            logger.error(f"Error subscribing to channel {channel}: {str(e)}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Error subscribing to channel: {str(e)}'
            }))
    
    async def unsubscribe_from_channel(self, channel):
        """Unsubscribe from a specific channel"""
        if channel in self.subscribed_groups:
            await self.channel_layer.group_discard(channel, self.channel_name)
            self.subscribed_groups.remove(channel)
            await self.send(text_data=json.dumps({
                'type': 'subscription_update',
                'channel': channel,
                'status': 'unsubscribed'
            }))
            logger.info(f"Unsubscribed from channel: {channel}")
    
    def get_available_channels(self):
        """Get list of available channels"""
        return [
            'dashboard_stats',
            'dashboard_activities',
            'dashboard_notifications',
            'activity_logs',
            'events_calendar',
            'admin_societies',
            'admin_students',
            'admin_events',
            'admin_reports',
            'admin_news',
            'president_society',
            'president_events',
            'president_members',
            'president_news',
            'president_reports',
            'student_dashboard',
            'student_events',
            'student_societies',
            'student_notifications',
            'student_news'
        ]
    
    async def send_available_channels(self):
        """Send a list of available channels to the client"""
        available_channels = self.get_available_channels()
        
        await self.send(text_data=json.dumps({
            'type': 'available_channels',
            'channels': available_channels
        }))
    
    # Generic handler for refresh requests
    async def data_refresh(self, event):
        if event.get('sender_channel_name') != self.channel_name:
            await self.send(text_data=json.dumps({
                'type': 'data_update',
                'channel': event.get('channel'),
                'data': event.get('data', {})
            }))
    
    # Generic handler for all channel messages
    async def channel_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'data_update',
            'channel': event.get('channel'),
            'data': event.get('data', {})
        }))
    
    # IMPORTANT: These methods must match the channel names exactly for Django Channels to route messages correctly
    
    async def dashboard_stats(self, event):
        await self.channel_message({'channel': 'dashboard_stats', 'data': event.get('data')})
    
    async def dashboard_activities(self, event):
        await self.channel_message({'channel': 'dashboard_activities', 'data': event.get('data')})
    
    async def dashboard_notifications(self, event):
        await self.channel_message({'channel': 'dashboard_notifications', 'data': event.get('data')})
    
    async def activity_logs(self, event):
        await self.channel_message({'channel': 'activity_logs', 'data': event.get('data')})
    
    async def events_calendar(self, event):
        await self.channel_message({'channel': 'events_calendar', 'data': event.get('data')})
    
    async def admin_societies(self, event):
        await self.channel_message({'channel': 'admin_societies', 'data': event.get('data')})
    
    async def admin_students(self, event):
        await self.channel_message({'channel': 'admin_students', 'data': event.get('data')})
    
    async def admin_events(self, event):
        await self.channel_message({'channel': 'admin_events', 'data': event.get('data')})
    
    async def admin_reports(self, event):
        await self.channel_message({'channel': 'admin_reports', 'data': event.get('data')})
    
    async def admin_news(self, event):
        await self.channel_message({'channel': 'admin_news', 'data': event.get('data')})
    
    async def president_society(self, event):
        await self.channel_message({'channel': 'president_society', 'data': event.get('data')})
    
    async def president_events(self, event):
        await self.channel_message({'channel': 'president_events', 'data': event.get('data')})
    
    async def president_members(self, event):
        await self.channel_message({'channel': 'president_members', 'data': event.get('data')})
    
    async def president_news(self, event):
        await self.channel_message({'channel': 'president_news', 'data': event.get('data')})
    
    async def president_reports(self, event):
        await self.channel_message({'channel': 'president_reports', 'data': event.get('data')})
    
    async def student_dashboard(self, event):
        await self.channel_message({'channel': 'student_dashboard', 'data': event.get('data')})
    
    async def student_events(self, event):
        await self.channel_message({'channel': 'student_events', 'data': event.get('data')})
    
    async def student_societies(self, event):
        await self.channel_message({'channel': 'student_societies', 'data': event.get('data')})
    
    async def student_notifications(self, event):
        await self.channel_message({'channel': 'student_notifications', 'data': event.get('data')})
    
    async def student_news(self, event):
        await self.channel_message({'channel': 'student_news', 'data': event.get('data')})