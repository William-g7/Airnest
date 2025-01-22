from rest_framework.decorators import api_view, authentication_classes, permission_classes
from django.http import JsonResponse
from .models import User
from .serializers import LandlordSerializer, UserSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile_detail(request, pk):
    print(request.data)
    user = get_object_or_404(User, pk=pk)
    
    if request.method == 'PATCH' and str(user.id) != str(request.user.id):
        return Response({'error': 'Not authorized'}, status=403)
    
    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            if 'avatar' in request.data:
                user.avatar = request.FILES['avatar']
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

@api_view(['GET'])
@authentication_classes([])
@permission_classes([])
def landlord_detail(request, pk):
    try:
        landlord = User.objects.get(pk=pk)
        serializer = LandlordSerializer(landlord)
        return JsonResponse(serializer.data, safe=False)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Landlord not found'}, status=404)