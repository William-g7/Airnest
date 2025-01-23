from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware

from rest_framework_simplejwt.tokens import AccessToken

from useraccount.models import User

@database_sync_to_async
def get_user(token):
    try:
        token = AccessToken(token)
        user = User.objects.get(id=token.payload['user_id'])
        return user
    except User.DoesNotExist:
        return AnonymousUser()
    
class TokenAuthMiddleware(BaseMiddleware):
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        query = dict((x.split('=') for x in scope['query_string'].decode().split('&')))
        token = query.get('token')
        scope['user'] = await get_user(token)
        return await self.inner(scope, receive, send)