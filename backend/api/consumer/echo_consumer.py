# api/consumer/echo_consumer.py
import json
import logging
from channels.generic.websocket import WebsocketConsumer

logger = logging.getLogger('websockets')

class EchoConsumer(WebsocketConsumer):
    def connect(self):
        logger.debug("Echo consumer connect attempt")
        self.accept()
        logger.debug("Echo consumer connected")
        self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Echo server connected'
        }))

    def disconnect(self, close_code):
        logger.debug(f"Echo consumer disconnected: {close_code}")

    def receive(self, text_data):
        logger.debug(f"Echo consumer received: {text_data}")
        # Echo the received data back
        self.send(text_data=text_data)