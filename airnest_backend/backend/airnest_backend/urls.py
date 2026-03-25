from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.http import HttpResponse, JsonResponse
from django.core.management import call_command

from .translation import translate_text, translate_batch

@ensure_csrf_cookie
def csrf_token_view(request):
    return HttpResponse("CSRF cookie set")

@csrf_exempt
def run_seed(request):
    """Temporary endpoint to seed demo data. Protected by SECRET_KEY."""
    token = request.GET.get('token', '')
    if token != settings.SECRET_KEY:
        return JsonResponse({'error': 'forbidden'}, status=403)
    import io
    out = io.StringIO()
    call_command('seed_demo_data', stdout=out)
    return JsonResponse({'output': out.getvalue()})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/_seed/', run_seed, name='run_seed'),  # TEMPORARY - remove after use
    path('api/csrf/', csrf_token_view, name='csrf_token'), 
    path('api/properties/', include('property.urls')),
    path('api/auth/', include('useraccount.urls')),
    path('api/chat/', include('chat.urls')),
    path('api/media/', include('media_upload.urls')),
    path('api/translate/', translate_text, name='translate-text'),
    path('api/translate/batch/', translate_batch, name='translate-batch'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)