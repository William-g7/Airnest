from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

from datetime import datetime, timedelta

from .models import Property, PropertyImage, Reservation, Wishlist
from .serializers import PropertySerializer, PropertyLandlordSerializer
from .forms import PropertyForm

@api_view(['GET'])
@authentication_classes([])
@permission_classes([])
def property_list(request):
    properties = Property.objects.all()
    
    location = request.GET.get('location', '')
    check_in = request.GET.get('check_in', None)
    check_out = request.GET.get('check_out', None)
    guests = request.GET.get('guests', None)
    category = request.GET.get('category', None)
    
    if location:
        properties = properties.filter(
            city__icontains=location
        ) | properties.filter(
            address__icontains=location
        ) | properties.filter(
            country__icontains=location
        )
    
    if category:
        properties = properties.filter(category__iexact=category)
    
    if check_in and check_out:
        try:
            check_in_date = datetime.strptime(check_in, '%Y-%m-%d').date()
            check_out_date = datetime.strptime(check_out, '%Y-%m-%d').date()
            
            unavailable_property_ids = Reservation.objects.filter(
                check_in__lt=check_out_date,
                check_out__gt=check_in_date
            ).values_list('property_id', flat=True)
            
            properties = properties.exclude(id__in=unavailable_property_ids)
        except ValueError:
            pass
    
    if guests:
        try:
            guests_count = int(guests)
            properties = properties.filter(guests__gte=guests_count)
        except ValueError:
            pass
    
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

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def my_properties(request):
    properties = Property.objects.filter(landlord=request.user)
    serializer = PropertySerializer(properties, many=True)
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
    
@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def create_reservation(request, pk):
    try:
        check_in = datetime.strptime(request.data['check_in'], '%Y-%m-%d').date()
        check_out = datetime.strptime(request.data['check_out'], '%Y-%m-%d').date()
        guests = int(request.data['guests'])
        
        property = Property.objects.get(pk=pk)
        
        if check_in >= check_out:
            return JsonResponse({'error': 'Check-out date must be after check-in date'}, status=400)
            
        overlapping_bookings = Reservation.objects.filter(
            property=property,
            check_in__lte=check_out,
            check_out__gte=check_in
        ).exists()
        
        if overlapping_bookings:
            return JsonResponse({'error': 'These dates are not available'}, status=400)
            
        days = (check_out - check_in).days
        total_price = property.price_per_night * days
        
        Reservation.objects.create(
            property=property,
            user=request.user,
            check_in=check_in,
            check_out=check_out,
            guests=guests,
            total_price=total_price
        )
        
        return JsonResponse({'success': True})
    except Property.DoesNotExist:
        return JsonResponse({'error': 'Property not found'}, status=404)
    except Exception as e:
        print(f"Error creating reservation: {e}")
        return JsonResponse({'error': str(e)}, status=400)
    

@api_view(['GET'])
def get_booked_dates(request, pk):
    try:
        property = Property.objects.get(pk=pk)
        reservations = Reservation.objects.filter(property=property)
        
        booked_dates = []
        for reservation in reservations:
            current_date = reservation.check_in
            while current_date <= reservation.check_out:
                booked_dates.append(current_date.strftime('%Y-%m-%d'))
                current_date += timedelta(days=1)
        
        return JsonResponse({'booked_dates': booked_dates})
    except Property.DoesNotExist:
        return JsonResponse({'error': 'Property not found'}, status=404)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_user_reservations(request):
    try:
        reservations = Reservation.objects.filter(user=request.user).select_related('property').order_by('-created_at')
        
        data = []
        for reservation in reservations:
            property_images = [{'imageURL': image.image.url} 
                             for image in reservation.property.images.all()]
            
            reservation_data = {
                'id': reservation.id,
                'property': {
                    'id': reservation.property.id,
                    'title': reservation.property.title,
                    'images': property_images
                },
                'check_in': reservation.check_in,
                'check_out': reservation.check_out,
                'guests': reservation.guests,
                'total_price': float(reservation.total_price),
                'created_at': reservation.created_at
            }
            data.append(reservation_data)
            
        return JsonResponse(data, safe=False)
    except Exception as e:
        print(f"Error fetching reservations: {e}")
        return JsonResponse({'error': str(e)}, status=400)

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def toggle_favorite(request, pk):
    try:
        property = Property.objects.get(pk=pk)
        wishlist_item = Wishlist.objects.filter(user=request.user, property=property)
        
        if wishlist_item.exists():
            wishlist_item.delete()
            return JsonResponse({'status': 'removed'})
        else:
            Wishlist.objects.create(user=request.user, property=property)
            return JsonResponse({'status': 'added'})
    except Property.DoesNotExist:
        return JsonResponse({'error': 'Property not found'}, status=404)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_wishlist(request):
    wishlist_items = Wishlist.objects.filter(user=request.user).select_related('property')
    properties = [item.property for item in wishlist_items]
    serializer = PropertySerializer(properties, many=True)
    return JsonResponse(serializer.data, safe=False)

@api_view(['GET'])
@authentication_classes([])
@permission_classes([])
def get_timezone_list(request):
    try:
        all_timezones = pytz.all_timezones
        
        grouped_timezones = {}
        
        for tz in all_timezones:
            parts = tz.split('/')
            region = parts[0] if len(parts) > 0 else 'Other'
            
            if region in ['Etc', 'SystemV', 'US']:
                continue
                
            if region not in grouped_timezones:
                grouped_timezones[region] = []
            
            timezone_info = {
                'value': tz,
                'label': tz.replace('_', ' ')
            }
            
            grouped_timezones[region].append(timezone_info)
        
        result = []
        for region, timezones in sorted(grouped_timezones.items()):
            result.append({
                'group': region,
                'options': sorted(timezones, key=lambda x: x['label'])
            })
        
        return JsonResponse(result, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)