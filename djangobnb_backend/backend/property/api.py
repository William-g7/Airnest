from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

from datetime import datetime, timedelta
import pytz
from .models import Property, PropertyImage, Reservation, Wishlist
from .serializers import PropertySerializer, PropertyLandlordSerializer, PropertyImageSerializer
from .forms import PropertyForm
from django.db import models

@api_view(['GET'])
@authentication_classes([])
@permission_classes([])
# 该api用来获取符合条件的房源，默认情况全部展示，可以按照地理位置、类别、入住/退房日期进行筛选
def property_list(request):
    properties = Property.objects.all()
    
    location = request.GET.get('location', '')
    check_in = request.GET.get('check_in', None)
    check_out = request.GET.get('check_out', None)
    guests = request.GET.get('guests', None)
    category = request.GET.get('category', None)
   
    # 基本过滤，按照地理位置进行模糊匹配
    if location:
        properties = properties.filter(
            city__icontains=location
        ) | properties.filter(
            address__icontains=location
        ) | properties.filter(
            country__icontains=location
        )
    
    # 基本过滤，按照地理位置进行精确匹配
    if category:
        properties = properties.filter(category__iexact=category)
    
    # 按照入住/退房日期排除不可用房源
    if check_in and check_out:
        try:
            check_in_date = datetime.strptime(check_in, '%Y-%m-%d').date()
            check_out_date = datetime.strptime(check_out, '%Y-%m-%d').date()
            
            CLEANING_BUFFER_MINUTES = 120
            
            CHECK_IN_HOUR = 15
            CHECK_OUT_HOUR = 11
            
            unavailable_property_ids = set()
            
            for prop in properties:
                # 获取房源时区
                prop_timezone = pytz.timezone(prop.timezone)
                
                # 创建用户搜索的入住时间（房源当地时区下的下午3点）
                user_checkin_local = datetime.combine(
                    check_in_date, 
                    datetime.min.time().replace(hour=CHECK_IN_HOUR)
                )
                user_checkin_local = prop_timezone.localize(user_checkin_local)
                
                # 创建用户搜索的退房时间（房源当地时区下的上午11点）
                user_checkout_local = datetime.combine(
                    check_out_date, 
                    datetime.min.time().replace(hour=CHECK_OUT_HOUR)
                )
                user_checkout_local = prop_timezone.localize(user_checkout_local)
                
                # 转换为UTC用于数据库比较
                user_checkin_utc = user_checkin_local.astimezone(pytz.UTC)
                user_checkout_utc = user_checkout_local.astimezone(pytz.UTC)
                
                # 获取房源的预订
                reservations = Reservation.objects.filter(property=prop)
                
                is_unavailable = False
                
                for reservation in reservations:
                    # 将UTC预订时间转换为房源当地时间
                    existing_checkin_local = reservation.check_in.astimezone(prop_timezone)
                    existing_checkout_local = reservation.check_out.astimezone(prop_timezone)
                    
                    # 检查标准的日期重叠
                    if (user_checkin_local < existing_checkout_local and 
                        user_checkout_local > existing_checkin_local):
                        unavailable_property_ids.add(prop.id)
                        is_unavailable = True
                        break
                    
                    # 特殊情况检查：考虑清洁缓冲时间
                    # 1. 如果用户想要的入住时间紧跟在现有预订的退房时间之后
                    # 需要检查清洁缓冲时间是否足够
                    if (user_checkin_local >= existing_checkout_local and
                        (user_checkin_local - existing_checkout_local).total_seconds() / 60 < CLEANING_BUFFER_MINUTES):
                        unavailable_property_ids.add(prop.id)
                        is_unavailable = True
                        break
                    
                    # 2. 如果现有预订的入住时间紧跟在用户想要的退房时间之后
                    # 同样需要检查清洁缓冲时间
                    if (existing_checkin_local >= user_checkout_local and
                        (existing_checkin_local - user_checkout_local).total_seconds() / 60 < CLEANING_BUFFER_MINUTES):
                        unavailable_property_ids.add(prop.id)
                        is_unavailable = True
                        break
                
                if is_unavailable:
                    continue  # 已经添加到不可用列表，跳过后续检查
                
                # 确保房源当前日期规则
                # 获取房源当地现在的时间
                property_now = datetime.now(prop_timezone)
                
                # 如果用户想要的入住日期已经过了（在房源当地时区），则该房源不可用
                if check_in_date < property_now.date():
                    unavailable_property_ids.add(prop.id)
            
            # 排除不可用的房源
            properties = properties.exclude(id__in=unavailable_property_ids)
            
        except ValueError as e:
            print(f"日期解析错误: {e}")
    
    if guests:
        try:
            guests_count = int(guests)
            properties = properties.filter(guests__gte=guests_count)
        except ValueError:
            pass
    
    serializer = PropertySerializer(properties, many=True)
    return JsonResponse(serializer.data, safe=False)

@api_view(['GET', 'PATCH'])
@authentication_classes([JWTAuthentication])
@permission_classes([])
def property_detail(request,pk):
    try:
        property = Property.objects.get(pk=pk)
        
        # GET方法 - 返回房源详情
        if request.method == 'GET':
            serializer = PropertyLandlordSerializer(property, many=False)
            return JsonResponse(serializer.data, safe=False)
        
        # PATCH方法 - 更新房源信息
        elif request.method == 'PATCH':
            # 验证用户是否是房源拥有者
            if not request.user.is_authenticated:
                return JsonResponse({'error': 'Authentication required'}, status=401)
            
            if property.landlord != request.user:
                return JsonResponse({'error': 'You do not have permission to update this property'}, status=403)
            
            # 使用PropertyForm处理更新 - 注意request.data可能来自FormData
            form = PropertyForm(request.data, instance=property)
            
            if form.is_valid():
                property = form.save()
                
                # 处理新上传的图片
                new_images = request.FILES.getlist('images')
                
                if new_images:
                    # 获取当前最大的order值
                    max_order = 0
                    existing_images = PropertyImage.objects.filter(property=property)
                    if existing_images.exists():
                        max_order = existing_images.aggregate(models.Max('order'))['order__max'] + 1
                    
                    # 添加新图片
                    for index, image in enumerate(new_images):
                        # 设置顺序
                        order = max_order + index
                        # 如果没有图片，则设置为主图
                        is_main = not existing_images.exists() and index == 0
                        
                        PropertyImage.objects.create(
                            property=property,
                            image=image,
                            order=order,
                            is_main=is_main
                        )
                
                return JsonResponse({'success': True})
            else:
                return JsonResponse({'errors': form.errors, 'success': False}, status=400)
    except Property.DoesNotExist:
        return JsonResponse({'error': 'Property not found'}, status=404)
    except Exception as e:
        print(f"Error updating property: {e}")
        return JsonResponse({'error': str(e), 'success': False}, status=400)

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
            
            # 处理图片上传和顺序
            for index, image in enumerate(images):
                # 第一张图片默认为主图
                is_main = index == 0
                
                PropertyImage.objects.create(
                    property=property,
                    image=image,
                    order=index,
                    is_main=is_main
                )
            
            return JsonResponse({'success': True})
        else:
            return JsonResponse({'errors': form.errors}, status=400)
            
    except Exception as e:
        print(f"Error creating property: {e}")
        return JsonResponse({'error': str(e)}, status=400)

# 该api用来创建预订，需要传入房源id、入住日期、退房日期、客人数量、时区
@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def create_reservation(request, pk):
    try:
        check_in_date = request.data['check_in'] 
        check_out_date = request.data['check_out'] 
        guests = int(request.data['guests'])

        property = Property.objects.get(pk=pk)
    
        property_timezone = pytz.timezone(property.timezone)
        
        # 解析入住时间转换成naive datetime，设置固定的入住/退房时间，最后附加时区信息转换成aware datetime
        check_in = datetime.strptime(check_in_date, '%Y-%m-%d')
        check_in = check_in.replace(hour=15, minute=0, second=0)
        check_in = property_timezone.localize(check_in)
        
        check_out = datetime.strptime(check_out_date, '%Y-%m-%d')
        check_out = check_out.replace(hour=11, minute=0, second=0)
        check_out = property_timezone.localize(check_out)
        
        # 转换成UTC， 用于存库和比较
        check_in_utc = check_in.astimezone(pytz.UTC)
        check_out_utc = check_out.astimezone(pytz.UTC)
        
        # 基础日期顺序检查
        if check_in_utc >= check_out_utc:
            return JsonResponse({'error': 'Check-out date must be after check-in date'}, status=400)
        
        # 计算预订天数和价格
        check_in_date_obj = datetime.strptime(check_in_date, '%Y-%m-%d').date()
        check_out_date_obj = datetime.strptime(check_out_date, '%Y-%m-%d').date()
        days = (check_out_date_obj - check_in_date_obj).days
        
        # 优先用前端传来的价格计算，后端保底
        if 'total_price' in request.data and request.data['total_price']:
            try:
                total_price = float(request.data['total_price'])
            except (ValueError, TypeError):
                total_price = float(property.price_per_night) * days
                total_price += total_price * 0.1 
                total_price += total_price * 0.15 
                total_price += total_price * 0.12 
        else:
            total_price = float(property.price_per_night) * days
            subtotal = total_price
            total_price += subtotal * 0.1  
            total_price += subtotal * 0.15  
            total_price += subtotal * 0.12  
        
        # 查询冲突的预订 - 使用UTC时间进行比较
        # 查找已有的预订，考虑房源时区
        overlapping_bookings = False
        existing_reservations = Reservation.objects.filter(property=property)
        
        # 以防万一，检查今天在房源时区是否已经过去
        property_now = datetime.now(property_timezone)
        property_today = property_now.replace(hour=0, minute=0, second=0, microsecond=0)
        requested_checkin_local = datetime.strptime(check_in_date, '%Y-%m-%d')
        requested_checkin_local = property_timezone.localize(requested_checkin_local)
        
        if requested_checkin_local < property_today:
            return JsonResponse({'error': '在房源当地时区，不能预订过去的日期'}, status=400)
        
        print(f"房源当地现在时间: {property_now}")
        print(f"预订入住日在当地: {requested_checkin_local}")
        
        # 清洁缓冲时间（分钟）
        CLEANING_BUFFER_MINUTES = 120
        
        # 检查每个现有预订是否与新预订冲突
        for reservation in existing_reservations:
            # 将现有预订的UTC时间转换为房源当地时间
            existing_checkin_local = reservation.check_in.astimezone(property_timezone)
            existing_checkout_local = reservation.check_out.astimezone(property_timezone)
            
            # 标准重叠检查 - 检查两个时间段是否有任何重叠
            # 当一个预订的结束时间大于另一个的开始时间，且一个预订的开始时间小于另一个的结束时间时，存在重叠
            if (check_in < existing_checkout_local and check_out > existing_checkin_local):
                overlapping_bookings = True
                print(f"检测到标准预订重叠: 已有预订 {existing_checkin_local} 至 {existing_checkout_local}")
                break
            
            # 额外检查: 清洁缓冲时间
            # 如果新预订的入住时间太接近现有预订的退房时间（需要考虑清洁时间）
            if (check_in >= existing_checkout_local and 
                (check_in - existing_checkout_local).total_seconds() / 60 < CLEANING_BUFFER_MINUTES):
                overlapping_bookings = True
                print(f"检测到清洁时间冲突: 已有预订退房时间 {existing_checkout_local}, 与新预订入住时间 {check_in} 之间差距不足 {CLEANING_BUFFER_MINUTES} 分钟")
                break
                
            # 如果现有预订的入住时间太接近新预订的退房时间（同样需要考虑清洁时间）
            if (existing_checkin_local >= check_out and 
                (existing_checkin_local - check_out).total_seconds() / 60 < CLEANING_BUFFER_MINUTES):
                overlapping_bookings = True
                print(f"检测到清洁时间冲突: 新预订退房时间 {check_out}, 与已有预订入住时间 {existing_checkin_local} 之间差距不足 {CLEANING_BUFFER_MINUTES} 分钟")
                break
        
        if overlapping_bookings:
            return JsonResponse({'error': '这些日期不可用。可能与现有预订冲突或需要更多清洁时间。'}, status=400)
        
        print(f"最终价格: {total_price}")
        
        # 创建预订，存储UTC时间
        reservation = Reservation.objects.create(
            property=property,
            user=request.user,
            check_in=check_in_utc,
            check_out=check_out_utc,
            guests=guests,
            total_price=total_price
        )
        
        print(f"成功创建预订: ID={reservation.id}, 入住={reservation.check_in}, 退房={reservation.check_out}, 总价={reservation.total_price}")
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
        
        # 获取房源时区
        property_timezone = pytz.timezone(property.timezone)
        print(f"获取预订日期 - 房源时区: {property.timezone}")
        
        # 清洁缓冲时间（分钟）
        CLEANING_BUFFER_MINUTES = 120
        
        # 完全预订的日期（整天不可预订）
        booked_dates = []
        
        # 部分预订的日期（由于清洁时间限制，一天中某些时段不可预订）
        partially_booked_dates = []
        
        for reservation in reservations:
            
            # 将 UTC 时间转换为房源所在时区时间
            check_in_local = reservation.check_in.astimezone(property_timezone)
            check_out_local = reservation.check_out.astimezone(property_timezone)
            
            # 检查入住日期（整天不可用）
            current_date = check_in_local.date()
            end_date = check_out_local.date()
            
            # 计算可能受清洁时间影响的日期
            if check_out_local.hour == 11 and check_out_local.minute == 0:  # 标准上午11点退房
                # 计算是否有足够时间在退房日当天为新客人清洁房间
                # 从退房时间算起，退房日期中午11点到下午3点有4小时，远大于2小时清洁时间，所以退房日也可以入住
                checkout_date_str = end_date.strftime('%Y-%m-%d')
                if checkout_date_str not in partially_booked_dates:
                    partially_booked_dates.append(checkout_date_str)
            
            # 将入住期间的日期标记为已预订（不包括退房日期，因为退房是上午11点，当天下午可以入住）
            while current_date < end_date:  # 注意：这里不包括退房日期
                date_str = current_date.strftime('%Y-%m-%d')
                booked_dates.append(date_str)
                current_date += timedelta(days=1)
        
        return JsonResponse({
            'booked_dates': booked_dates,
            'partially_booked_dates': partially_booked_dates
        })
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
            property_images = []
            for image in reservation.property.images.all():
                host = request.get_host()
                protocol = 'https' if request.is_secure() else 'http'
                base_url = f"{protocol}://{host}"
                
                image_url = image.image.url
                if not image_url.startswith(('http://', 'https://')):
                    if image_url.startswith('/'):
                        image_url = f"{base_url}{image_url}"
                    else:
                        image_url = f"{base_url}/{image_url}"
                
                property_images.append({'imageURL': image_url})
            
            property_timezone = reservation.property.timezone
            
            reservation_data = {
                'id': reservation.id,
                'property': {
                    'id': reservation.property.id,
                    'title': reservation.property.title,
                    'images': property_images,
                    'timezone': property_timezone  
                },
                'check_in': reservation.check_in.isoformat(),  
                'check_out': reservation.check_out.isoformat(),  
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

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def update_property_images_order(request, property_id):
    """
    更新房源图片的顺序
    """
    try:
        property = Property.objects.get(pk=property_id, landlord=request.user)
        
        # 获取图片顺序数据
        image_orders = request.data.get('image_orders', [])
        print(f"收到图片排序请求 - 房源ID: {property_id}, 图片数量: {len(image_orders)}")
        print(f"排序数据: {image_orders}")
        
        if not image_orders:
            return JsonResponse({'error': '未提供图片排序数据'}, status=400)
        
        # 首先将所有图片设为非主图
        PropertyImage.objects.filter(property=property).update(is_main=False)
        
        # 保存图片ID和其新顺序的映射
        updated_images = []
        
        for image_data in image_orders:
            image_id = image_data.get('id')
            new_order = image_data.get('order')
            
            # 验证数据
            if image_id and isinstance(new_order, int):
                try:
                    # 确保图片属于该房源
                    image = PropertyImage.objects.get(id=image_id, property=property)
                    image.order = new_order
                    # 将第一张图片（order=0）设为主图
                    if new_order == 0:
                        image.is_main = True
                        print(f"设置图片ID {image_id} 为主图")
                    image.save()
                    updated_images.append(image)
                    print(f"已更新图片 ID: {image_id}, 新顺序: {new_order}, 是否主图: {image.is_main}")
                except PropertyImage.DoesNotExist:
                    print(f"图片ID {image_id} 不存在")
                    pass  # 忽略不存在的图片
        
        # 获取并返回更新后的图片列表（按顺序排序）
        images = PropertyImage.objects.filter(property=property).order_by('order')
        serializer = PropertyImageSerializer(images, many=True)
        response_data = serializer.data
        
        # 打印最终图片顺序
        print("更新后的图片顺序:")
        for img in response_data:
            print(f"ID: {img['id']}, 顺序: {img.get('order')}, 主图: {img.get('is_main')}")
        
        return JsonResponse(response_data, safe=False)
    
    except Property.DoesNotExist:
        return JsonResponse({'error': '找不到该房源或您无权限操作'}, status=404)
    except Exception as e:
        print(f"更新图片顺序时出错: {str(e)}")
        return JsonResponse({'error': str(e)}, status=400)

@api_view(['DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def delete_property_image(request, property_id, image_id):
    """删除房源图片"""
    try:
        # 验证该房源属于当前用户
        property = Property.objects.get(pk=property_id, landlord=request.user)
        
        # 获取要删除的图片并验证其属于该房源
        try:
            image = PropertyImage.objects.get(id=image_id, property=property)
        except PropertyImage.DoesNotExist:
            return JsonResponse({'error': '找不到该图片'}, status=404)
        
        # 检查是否只有一张图片，如果是则不允许删除
        if PropertyImage.objects.filter(property=property).count() <= 1:
            return JsonResponse({'error': '无法删除房源的唯一图片'}, status=400)
        
        # 检查是否为主图
        is_main = image.is_main
        
        # 删除图片
        image.delete()
        
        # 如果删除的是主图，则将第一张图片（order最小的）设为主图
        if is_main:
            new_main_image = PropertyImage.objects.filter(property=property).order_by('order').first()
            if new_main_image:
                new_main_image.is_main = True
                new_main_image.save()
        
        # 返回剩余的图片列表
        images = PropertyImage.objects.filter(property=property).order_by('order')
        serializer = PropertyImageSerializer(images, many=True)
        
        return JsonResponse({
            'success': True,
            'message': '图片已成功删除',
            'images': serializer.data
        })
    
    except Property.DoesNotExist:
        return JsonResponse({'error': '找不到该房源或您无权限操作'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)