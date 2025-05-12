from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

from .translation import simple_translate_text, simple_translate_batch

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/properties/', include('property.urls')),
    path('api/auth/', include('useraccount.urls')),
    path('api/chat/', include('chat.urls')),
    path('api/simple-translate/', simple_translate_text, name='simple-translate-text'),
    path('api/simple-translate/batch/', simple_translate_batch, name='simple-translate-batch'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

