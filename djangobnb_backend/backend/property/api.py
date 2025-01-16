from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes, authentication_classes

from .models import Property
from .serializers import PropertySerializer

@api_view(['GET'])
@authentication_classes([])
@permission_classes([])
def property_list(request):
    properties = Property.objects.all()
    serializer = PropertySerializer(properties, many=True)
    return JsonResponse(serializer.data, safe=False)