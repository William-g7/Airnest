from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import Property, PropertyImage
from .serializers import PropertySerializer, PropertyLandlordSerializer
from .forms import PropertyForm

@api_view(['GET'])
@authentication_classes([])
@permission_classes([])
def property_list(request):
    properties = Property.objects.all()
    serializer = PropertySerializer(properties, many=True)
    return JsonResponse(serializer.data, safe=False)

@api_view(['GET'])
@authentication_classes([])
@permission_classes([])
def property_detail(request,pk):
    print(pk)
    property = Property.objects.get(pk=pk)
    serializer = PropertyLandlordSerializer(property, many=False)
    return JsonResponse(serializer.data, safe=False)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def create_property(request):
    try:
        form = PropertyForm(request.POST)
        
        if form.is_valid():
            property = form.save(commit=False)
            property.landlord = request.user
            property.save()
            
            images = request.FILES.getlist('images')
            for image in images:
                PropertyImage.objects.create(
                    property=property,
                    image=image
                )
            
            return JsonResponse({'success': True})
        else:
            return JsonResponse({'errors': form.errors}, status=400)
            
    except Exception as e:
        print(f"Error creating property: {e}")
        return JsonResponse({'error': str(e)}, status=400)
