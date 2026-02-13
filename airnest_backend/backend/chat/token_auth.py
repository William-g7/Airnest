import http.cookies
from urllib.parse import parse_qs

from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from rest_framework_simplejwt.tokens import AccessToken

from useraccount.models import User


@database_sync_to_async
def get_user_from_token(token_key: str):
    try:
        token = AccessToken(token_key)
        user_id = token.payload.get('user_id')
        if not user_id:
            return AnonymousUser()
        return User.objects.get(pk=user_id)
    except Exception:
        return AnonymousUser()


def _get_cookie(scope, name: str) -> str | None:
    headers = dict(scope.get('headers', []))
    raw_cookie = headers.get(b'cookie', b'').decode()
    if not raw_cookie:
        return None
    c = http.cookies.SimpleCookie()
    c.load(raw_cookie)
    morsel = c.get(name)
    return morsel.value if morsel else None


class CookieOrTokenAuthMiddleware(BaseMiddleware):
    def __init__(self, inner):
        super().__init__(inner)

    async def __call__(self, scope, receive, send):
        # 1) cookie 优先
        token_key = _get_cookie(scope, 'bff_access_token')

        # 2) 兼容 query ?token=
        if not token_key:
            qs = parse_qs(scope.get('query_string', b'').decode())
            token_key = (qs.get('token') or [None])[0]

        if token_key:
            scope['user'] = await get_user_from_token(token_key)
        else:
            scope['user'] = AnonymousUser()

        return await super().__call__(scope, receive, send)
