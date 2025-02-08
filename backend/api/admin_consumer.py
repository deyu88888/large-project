# from channels.generic.websocket import AsyncWebsocketConsumer
# from .serializers import SocietySerializer
# from asgiref.sync import sync_to_async
# import json
# from django.contrib.auth.models import AnonymousUser
# from .models import Society, User
# from channels.layers import get_channel_layer

# class SocietyRequestConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         """ Handle WebSocket connection """
#         # # user = self.scope["user"]   # error for now, uncomment later
#         # print("Checking if user is an admin: ", user)

#         # # Async-safe query to check user role
#         # user = await sync_to_async(User.objects.get)(username="admin_user")

#         #  TODO: Uncomment when the admin dashboard is linked
#         # if isinstance(user, AnonymousUser) or not hasattr(user, "admin"):
#         #     print("User is not an admin, closing WebSocket.")
#         #     await self.close()
#         # else:
#         await self.accept()
#         await self.send_pending_requests()

#     async def receive(self, text_data):
#         """ Handle incoming WebSocket messages """
#         data = json.loads(text_data)
#         action = data.get("action")
#         society_id = data.get("society_id")

#         if action in ["approve", "reject"] and society_id:
#             await self.update_society_request(society_id, action)

#     async def send_pending_requests(self):
#         """ Send updated list of pending society requests """
#         requests = await self.get_pending_requests()
#         await self.send(text_data=json.dumps({"pending_requests": requests}))

#     async def get_pending_requests(self):
#         """ Fetch pending society requests asynchronously """
#         societies = await sync_to_async(list)(Society.objects.filter(status='Pending'))
#         serializer = await sync_to_async(SocietySerializer)(societies, many=True)
#         serialized_data = await sync_to_async(lambda: serializer.data)()

#         return serialized_data

#     async def update_society_request(self, society_id, action):
#         """ Update society request status and notify clients """
#         try:
#             society = await sync_to_async(Society.objects.get)(id=society_id)
#             society.status = "Approved" if action == "approve" else "Rejected"
#             await sync_to_async(society.save)()

#             # Send WebSocket update to all connected clients
#             channel_layer = get_channel_layer()
#             await sync_to_async(channel_layer.group_send)(
#                 "society_requests",
#                 {
#                     "type": "pending_requests_update",
#                     "message": f"Society request {action} successfully.",
#                 },
#             )
#             await self.send_pending_requests()
#         except Society.DoesNotExist:
#             await self.send(text_data=json.dumps({"error": "Society request not found."}))

#     async def pending_requests_update(self, event):
#         """ Send WebSocket update to clients """
#         await self.send(text_data=json.dumps({"message": event["message"]}))