from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import HttpResponse

from .translation import translate_text, translate_batch

@ensure_csrf_cookie
def csrf_token_view(request):
    return HttpResponse("CSRF cookie set")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/csrf/', csrf_token_view, name='csrf_token'), 
    path('api/properties/', include('property.urls')),
    path('api/auth/', include('useraccount.urls')),
    path('api/chat/', include('chat.urls')),
    path('api/translate/', translate_text, name='translate-text'),
    path('api/translate/batch/', translate_batch, name='translate-batch'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

