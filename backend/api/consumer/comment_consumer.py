import json
from channels.generic.websocket import AsyncWebsocketConsumer

class CommentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.event_id = self.scope['url_route']['kwargs']['event_id']
        self.group_name = f"event_{self.event_id}"

        # 将当前连接加入到对应事件分组
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # 离开分组
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    # 供 group_send() 调用的事件处理函数
    async def new_comment(self, event):
        comment_data = event['comment_data']  # 后端广播过来的评论数据
        # 将评论数据转发给前端
        await self.send(text_data=json.dumps({
            "type": "NEW_COMMENT",
            "payload": comment_data
        }))
