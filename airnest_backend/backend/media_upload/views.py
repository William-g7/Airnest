"""
Media Upload API Views

提供Cloudflare R2直传相关的API端点
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.exceptions import ValidationError
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from typing import Dict, List, Any
import logging

from .services import r2_upload_service

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_presigned_upload_url(request):
    """
    获取单个文件的预签名上传URL
    
    POST /api/media/presigned-url/
    {
        "file_type": "image/jpeg",
        "file_size": 1024000,
        "prefix": "property-images"  // 可选，默认为 "property-images"
    }
    
    Returns:
    {
        "success": true,
        "data": {
            "upload_url": "https://...",
            "form_fields": {...},
            "object_key": "property-images/2025/01/18/uuid_timestamp.jpg",
            "file_url": "https://cdn.airnest.me/property-images/...",
            "expires_in": 900,
            "max_file_size": 10485760
        }
    }
    """
    try:
        # 获取请求数据
        file_type = request.data.get('file_type')
        file_size = request.data.get('file_size')
        property_id = request.data.get('propertyId') or request.data.get('property_id')
        prefix = request.data.get('prefix')
        
        # 如果有property_id，使用特定的prefix格式
        if property_id:
            prefix = f'properties/{property_id}/images'
        elif not prefix:
            prefix = 'property-images'
        
        # 验证必需字段
        if not file_type:
            return Response({
                'success': False,
                'error': '缺少必需字段: file_type'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not file_size or not isinstance(file_size, int):
            return Response({
                'success': False,
                'error': '缺少必需字段: file_size (必须为整数)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 生成预签名URL
        presigned_data = r2_upload_service.generate_presigned_upload_url(
            file_type=file_type,
            file_size=file_size,
            prefix=prefix
        )
        
        # 记录成功日志
        logger.info(f"Generated presigned URL for user {request.user.id}, "
                   f"file_type: {file_type}, size: {file_size}, prefix: {prefix}")
        
        return Response({
            'success': True,
            'data': presigned_data
        }, status=status.HTTP_200_OK)
        
    except ValidationError as e:
        logger.warning(f"Validation error for user {request.user.id}: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Unexpected error generating presigned URL for user {request.user.id}: {str(e)}")
        return Response({
            'success': False,
            'error': '生成预签名URL时发生服务器错误'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_batch_presigned_upload_urls(request):
    """
    批量获取预签名上传URL
    
    POST /api/media/presigned-urls/
    {
        "prefix": "property-images",  // 可选
        "uploads": [
            {
                "file_type": "image/jpeg",
                "file_size": 1024000
            },
            {
                "file_type": "image/png", 
                "file_size": 2048000
            }
        ]
    }
    
    Returns:
    {
        "success": true,
        "data": [
            {
                "success": true,
                "upload_url": "https://...",
                "form_fields": {...},
                "object_key": "...",
                "file_url": "...",
                "expires_in": 900,
                "max_file_size": 10485760
            },
            {
                "success": false,
                "error": "不支持的文件类型"
            }
        ]
    }
    """
    try:
        # 获取请求数据
        uploads = request.data.get('uploads', [])
        prefix = request.data.get('prefix', 'property-images')
        
        # 验证上传列表
        if not isinstance(uploads, list) or len(uploads) == 0:
            return Response({
                'success': False,
                'error': '上传列表不能为空'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 限制批量上传数量 (最多10个)
        if len(uploads) > 10:
            return Response({
                'success': False,
                'error': '单次批量上传最多支持10个文件'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 生成批量预签名URLs
        presigned_data_list = r2_upload_service.generate_batch_presigned_urls(
            upload_requests=uploads,
            prefix=prefix
        )
        
        # 统计成功和失败的数量
        success_count = sum(1 for item in presigned_data_list if item.get('success', False))
        
        logger.info(f"Generated {success_count}/{len(uploads)} presigned URLs for user {request.user.id}")
        
        return Response({
            'success': True,
            'data': presigned_data_list,
            'summary': {
                'total': len(uploads),
                'success': success_count,
                'failed': len(uploads) - success_count
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Unexpected error generating batch presigned URLs for user {request.user.id}: {str(e)}")
        return Response({
            'success': False,
            'error': '生成批量预签名URL时发生服务器错误'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_upload(request):
    """
    验证文件上传是否成功
    
    POST /api/media/verify-upload/
    {
        "object_keys": [
            "property-images/2025/01/18/uuid_timestamp.jpg",
            "property-images/2025/01/18/uuid_timestamp2.png"
        ]
    }
    
    Returns:
    {
        "success": true,
        "data": [
            {
                "object_key": "property-images/2025/01/18/uuid_timestamp.jpg",
                "uploaded": true,
                "file_info": {
                    "file_url": "https://cdn.airnest.me/...",
                    "size": 1024000,
                    "content_type": "image/jpeg",
                    "etag": "d41d8cd98f00b204e9800998ecf8427e"
                }
            },
            {
                "object_key": "property-images/2025/01/18/uuid_timestamp2.png",
                "uploaded": false,
                "file_info": null
            }
        ]
    }
    """
    try:
        # 获取要验证的对象键列表
        object_keys = request.data.get('object_keys', [])
        
        if not isinstance(object_keys, list) or len(object_keys) == 0:
            return Response({
                'success': False,
                'error': '对象键列表不能为空'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 限制批量验证数量 (最多20个)
        if len(object_keys) > 20:
            return Response({
                'success': False,
                'error': '单次批量验证最多支持20个文件'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 验证每个文件的上传状态
        verification_results = []
        
        for object_key in object_keys:
            if not isinstance(object_key, str) or not object_key.strip():
                verification_results.append({
                    'object_key': object_key,
                    'uploaded': False,
                    'file_info': None,
                    'error': '无效的对象键'
                })
                continue
            
            # 检查文件是否存在
            uploaded = r2_upload_service.verify_upload_success(object_key)
            file_info = None
            
            if uploaded:
                file_info = r2_upload_service.get_file_info(object_key)
            
            verification_results.append({
                'object_key': object_key,
                'uploaded': uploaded,
                'file_info': file_info
            })
        
        # 统计结果
        uploaded_count = sum(1 for result in verification_results if result['uploaded'])
        
        logger.info(f"Verified {uploaded_count}/{len(object_keys)} uploads for user {request.user.id}")
        
        return Response({
            'success': True,
            'data': verification_results,
            'summary': {
                'total': len(object_keys),
                'uploaded': uploaded_count,
                'not_uploaded': len(object_keys) - uploaded_count
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Unexpected error verifying uploads for user {request.user.id}: {str(e)}")
        return Response({
            'success': False,
            'error': '验证上传状态时发生服务器错误'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_uploaded_file(request):
    """
    删除已上传的文件
    
    DELETE /api/media/delete-file/
    {
        "object_key": "property-images/2025/01/18/uuid_timestamp.jpg"
    }
    
    Returns:
    {
        "success": true,
        "message": "文件删除成功"
    }
    """
    try:
        object_key = request.data.get('object_key')
        
        if not object_key:
            return Response({
                'success': False,
                'error': '缺少必需字段: object_key'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 删除文件
        deleted = r2_upload_service.delete_file(object_key)
        
        if deleted:
            logger.info(f"Deleted file {object_key} for user {request.user.id}")
            return Response({
                'success': True,
                'message': '文件删除成功'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'error': '文件不存在或删除失败'
            }, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        logger.error(f"Unexpected error deleting file for user {request.user.id}: {str(e)}")
        return Response({
            'success': False,
            'error': '删除文件时发生服务器错误'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ================== 草稿房源管理 API ==================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def draft_properties_list_create(request):
    """
    草稿房源列表和创建的统一端点
    GET: 获取用户的草稿房源列表
    POST: 创建或更新草稿房源
    """
    if request.method == 'GET':
        return list_draft_properties_impl(request)
    elif request.method == 'POST':
        return create_draft_property_impl(request)


def create_draft_property_impl(request):
    """
    创建或更新草稿房源
    
    POST /api/media/draft-properties/
    {
        "title": "海景公寓",
        "description": "...",
        "category": "apartment",
        "place_type": "entire_place",
        "bedrooms": 2,
        "bathrooms": 1,
        "guests": 4,
        "beds": 2,
        "country": "China",
        "state": "Guangdong",
        "city": "Shenzhen",
        "address": "南山区...",
        "postal_code": "518000",
        "timezone": "Asia/Shanghai",
        "price_per_night": 299.00
    }
    """
    from .models import DraftProperty
    
    try:
        # 获取或创建草稿房源
        draft_id = request.data.get('id')
        if draft_id:
            try:
                draft = DraftProperty.objects.get(id=draft_id, user=request.user)
            except DraftProperty.DoesNotExist:
                return Response({
                    'success': False,
                    'error': '草稿房源不存在'
                }, status=status.HTTP_404_NOT_FOUND)
        else:
            draft = DraftProperty.objects.create(user=request.user)
        
        # 更新字段
        updatable_fields = [
            'title', 'description', 'category', 'place_type',
            'bedrooms', 'bathrooms', 'guests', 'beds',
            'country', 'state', 'city', 'address', 'postal_code', 'timezone',
            'price_per_night'
        ]
        
        for field in updatable_fields:
            if field in request.data:
                setattr(draft, field, request.data[field])
        
        draft.save()
        
        # 更新完成状态
        draft.update_completion_status()
        
        return Response({
            'success': True,
            'data': {
                'id': str(draft.id),
                'title': draft.title,
                'description': draft.description,
                'status': draft.status,
                'completion_percentage': draft.completion_percentage,
                'is_ready_for_publish': draft.is_ready_for_publish,
                'basic_info_completed': draft.basic_info_completed,
                'location_completed': draft.location_completed,
                'images_completed': draft.images_completed,
                'pricing_completed': draft.pricing_completed,
                'created_at': draft.created_at,
                'updated_at': draft.updated_at
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error creating/updating draft property for user {request.user.id}: {str(e)}")
        return Response({
            'success': False,
            'error': '创建或更新草稿房源时发生错误'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def list_draft_properties_impl(request):
    """
    获取用户的草稿房源列表
    
    GET /api/media/draft-properties/
    """
    from .models import DraftProperty
    
    try:
        drafts = DraftProperty.objects.filter(
            user=request.user,
            status__in=['draft', 'complete']
        ).order_by('-updated_at')
        
        draft_data = []
        for draft in drafts:
            draft_data.append({
                'id': str(draft.id),
                'title': draft.title or '未命名房源',
                'status': draft.status,
                'completion_percentage': draft.completion_percentage,
                'is_ready_for_publish': draft.is_ready_for_publish,
                'created_at': draft.created_at,
                'updated_at': draft.updated_at
            })
        
        return Response({
            'success': True,
            'data': draft_data,
            'count': len(draft_data)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error listing draft properties for user {request.user.id}: {str(e)}")
        return Response({
            'success': False,
            'error': '获取草稿房源列表时发生错误'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def draft_property_detail(request, draft_id):
    """
    草稿房源详情的统一端点
    GET: 获取单个草稿房源详情
    DELETE: 删除草稿房源
    """
    if request.method == 'GET':
        return get_draft_property_impl(request, draft_id)
    elif request.method == 'DELETE':
        return delete_draft_property_impl(request, draft_id)


def get_draft_property_impl(request, draft_id):
    """
    获取单个草稿房源详情
    
    GET /api/media/draft-properties/{draft_id}/
    """
    from .models import DraftProperty
    
    try:
        draft = DraftProperty.objects.get(id=draft_id, user=request.user)
        
        # 获取图片信息
        images = []
        for img in draft.images.filter(is_active=True).order_by('order'):
            images.append({
                'id': str(img.id),
                'object_key': img.object_key,
                'file_url': img.file_url,
                'file_size': img.file_size,
                'content_type': img.content_type,
                'order': img.order,
                'is_main': img.is_main,
                'alt_text': img.alt_text,
                'uploaded_at': img.uploaded_at
            })
        
        return Response({
            'success': True,
            'data': {
                'id': str(draft.id),
                'title': draft.title,
                'description': draft.description,
                'price_per_night': str(draft.price_per_night) if draft.price_per_night else None,
                'category': draft.category,
                'place_type': draft.place_type,
                'bedrooms': draft.bedrooms,
                'bathrooms': draft.bathrooms,
                'guests': draft.guests,
                'beds': draft.beds,
                'country': draft.country,
                'state': draft.state,
                'city': draft.city,
                'address': draft.address,
                'postal_code': draft.postal_code,
                'timezone': draft.timezone,
                'status': draft.status,
                'completion_percentage': draft.completion_percentage,
                'is_ready_for_publish': draft.is_ready_for_publish,
                'basic_info_completed': draft.basic_info_completed,
                'location_completed': draft.location_completed,
                'images_completed': draft.images_completed,
                'pricing_completed': draft.pricing_completed,
                'images': images,
                'created_at': draft.created_at,
                'updated_at': draft.updated_at
            }
        }, status=status.HTTP_200_OK)
        
    except DraftProperty.DoesNotExist:
        return Response({
            'success': False,
            'error': '草稿房源不存在'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error getting draft property {draft_id} for user {request.user.id}: {str(e)}")
        return Response({
            'success': False,
            'error': '获取草稿房源详情时发生错误'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def delete_draft_property_impl(request, draft_id):
    """
    删除草稿房源
    
    DELETE /api/media/draft-properties/{draft_id}/
    """
    from .models import DraftProperty
    
    try:
        draft = DraftProperty.objects.get(id=draft_id, user=request.user)
        
        # 标记为已删除而不是真正删除（保留数据用于分析）
        draft.status = 'deleted'
        draft.save()
        
        return Response({
            'success': True,
            'message': '草稿房源已删除'
        }, status=status.HTTP_200_OK)
        
    except DraftProperty.DoesNotExist:
        return Response({
            'success': False,
            'error': '草稿房源不存在'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error deleting draft property {draft_id} for user {request.user.id}: {str(e)}")
        return Response({
            'success': False,
            'error': '删除草稿房源时发生错误'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def publish_draft_property(request):
    """
    发布草稿房源到正式房源
    
    POST /api/media/draft-properties/{draft_id}/publish/
    """
    from .models import DraftProperty
    from property.models import Property, PropertyImage
    
    try:
        draft_id = request.data.get('draft_property_id')
        if not draft_id:
            return Response({
                'success': False,
                'error': '缺少必需字段: draft_property_id'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 验证草稿房源存在且属于当前用户
        try:
            draft = DraftProperty.objects.get(id=draft_id, user=request.user)
        except DraftProperty.DoesNotExist:
            return Response({
                'success': False,
                'error': '草稿房源不存在'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # 检查是否可以发布
        if not draft.is_ready_for_publish:
            return Response({
                'success': False,
                'error': f'草稿房源未完成，完成度: {draft.completion_percentage}%',
                'details': {
                    'completion_percentage': draft.completion_percentage,
                    'basic_info_completed': draft.basic_info_completed,
                    'location_completed': draft.location_completed,
                    'images_completed': draft.images_completed,
                    'pricing_completed': draft.pricing_completed,
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 创建正式房源
        property_obj = Property.objects.create(
            title=draft.title,
            description=draft.description,
            price_per_night=draft.price_per_night,
            category=draft.category,
            place_type=draft.place_type,
            bedrooms=draft.bedrooms,
            bathrooms=draft.bathrooms,
            guests=draft.guests,
            beds=draft.beds,
            country=draft.country,
            state=draft.state or '',
            city=draft.city,
            address=draft.address,
            postal_code=draft.postal_code,
            timezone=draft.timezone,
            landlord=request.user
        )
        
        # 转移图片数据
        draft_images = draft.images.filter(is_active=True).order_by('order')
        for draft_image in draft_images:
            PropertyImage.objects.create(
                property=property_obj,
                object_key=draft_image.object_key,
                file_url=draft_image.file_url,
                file_size=draft_image.file_size,
                content_type=draft_image.content_type,
                etag=draft_image.etag,
                order=draft_image.order,
                is_main=draft_image.is_main,
                alt_text=draft_image.alt_text,
                uploaded_by=request.user
            )
        
        # 更新草稿状态为已发布
        draft.status = 'published'
        draft.save()
        
        logger.info(f"Published property {property_obj.id} from draft {draft.id} by user {request.user.id}")
        
        return Response({
            'success': True,
            'data': {
                'property_id': str(property_obj.id),
                'draft_id': str(draft.id),
                'title': property_obj.title,
                'images_count': property_obj.images.count(),
                'created_at': property_obj.created_at
            },
            'message': '房源发布成功'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Error publishing draft property for user {request.user.id}: {str(e)}")
        return Response({
            'success': False,
            'error': '发布房源时发生错误'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_draft_property_images(request):
    """
    添加草稿房源图片
    
    POST /api/media/draft-properties/{draft_id}/images/
    {
        "draft_property_id": "uuid",
        "images": [
            {
                "object_key": "property-images/2025/01/18/uuid_timestamp.jpg",
                "file_url": "https://cdn.airnest.me/...",
                "file_size": 1024000,
                "content_type": "image/jpeg",
                "etag": "d41d8cd98f00b204e9800998ecf8427e",
                "order": 0,
                "is_main": true,
                "alt_text": "海景阳台"
            }
        ]
    }
    """
    from .models import DraftProperty, DraftPropertyImage
    
    try:
        draft_property_id = request.data.get('draft_property_id')
        images_data = request.data.get('images', [])
        
        if not draft_property_id:
            return Response({
                'success': False,
                'error': '缺少必需字段: draft_property_id'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 验证草稿房源存在
        try:
            draft = DraftProperty.objects.get(id=draft_property_id, user=request.user)
        except DraftProperty.DoesNotExist:
            return Response({
                'success': False,
                'error': '草稿房源不存在'
            }, status=status.HTTP_404_NOT_FOUND)
        
        if not isinstance(images_data, list) or len(images_data) == 0:
            return Response({
                'success': False,
                'error': '图片列表不能为空'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        created_images = []
        
        for img_data in images_data:
            required_fields = ['object_key', 'file_url', 'file_size', 'content_type']
            if not all(field in img_data for field in required_fields):
                continue
            
            # 检查对象键是否已存在
            if DraftPropertyImage.objects.filter(object_key=img_data['object_key']).exists():
                continue
            
            image = DraftPropertyImage.objects.create(
                draft_property=draft,
                object_key=img_data['object_key'],
                file_url=img_data['file_url'],
                file_size=img_data['file_size'],
                content_type=img_data['content_type'],
                etag=img_data.get('etag', ''),
                order=img_data.get('order', 0),
                is_main=img_data.get('is_main', False),
                alt_text=img_data.get('alt_text', '')
            )
            
            created_images.append({
                'id': str(image.id),
                'object_key': image.object_key,
                'file_url': image.file_url,
                'order': image.order,
                'is_main': image.is_main
            })
        
        return Response({
            'success': True,
            'data': created_images,
            'message': f'成功添加 {len(created_images)} 张图片'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Error adding draft property images for user {request.user.id}: {str(e)}")
        return Response({
            'success': False,
            'error': '添加图片时发生错误'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
