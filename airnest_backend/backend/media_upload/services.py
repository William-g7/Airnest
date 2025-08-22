"""
Cloudflare R2 预签名上传服务

提供安全的直传功能，支持图片上传到 Cloudflare R2 存储
"""

import boto3
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from django.conf import settings
from django.core.exceptions import ValidationError
from botocore.exceptions import ClientError
import mimetypes
import os


class R2UploadService:
    """Cloudflare R2 直传服务"""
    
    # 支持的图片格式
    ALLOWED_IMAGE_TYPES = {
        'image/jpeg': '.jpg',
        'image/png': '.png', 
        'image/webp': '.webp',
        'image/heic': '.heic',
        'image/heif': '.heif'
    }
    
    # 文件大小限制 (10MB)
    MAX_FILE_SIZE = 10 * 1024 * 1024
    
    # 预签名URL有效期 (15分钟)
    PRESIGNED_URL_EXPIRY = 15 * 60
    
    def __init__(self):
        """初始化R2客户端"""
        self.s3_client = None
        self.bucket_name = None
        
        # 检查R2配置是否可用
        if all([
            getattr(settings, 'AWS_ACCESS_KEY_ID', None),
            getattr(settings, 'AWS_SECRET_ACCESS_KEY', None),
            getattr(settings, 'AWS_S3_ENDPOINT_URL', None),
            getattr(settings, 'AWS_STORAGE_BUCKET_NAME', None)
        ]):
            self.s3_client = boto3.client(
                's3',
                endpoint_url=settings.AWS_S3_ENDPOINT_URL,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=getattr(settings, 'AWS_S3_REGION_NAME', 'auto'),
                config=boto3.session.Config(signature_version='s3v4')
            )
            self.bucket_name = settings.AWS_STORAGE_BUCKET_NAME
    
    def _check_configuration(self):
        """检查R2配置是否可用"""
        if not self.s3_client or not self.bucket_name:
            raise ValueError("R2存储配置不完整，请检查环境变量")
    
    def generate_unique_key(self, file_type: str, prefix: str = 'uploads') -> str:
        """
        生成唯一的对象键
        
        Args:
            file_type: 文件类型 (MIME type)
            prefix: 存储前缀路径
            
        Returns:
            完整的对象键路径
        """
        # 获取文件扩展名
        extension = self.ALLOWED_IMAGE_TYPES.get(file_type, '.jpg')
        
        # 生成唯一标识符
        unique_id = str(uuid.uuid4())
        timestamp = int(datetime.now().timestamp())
        
        # 按日期组织文件夹结构：uploads/2025/01/18/
        date_path = datetime.now().strftime('%Y/%m/%d')
        
        # 生成最终的键名
        filename = f"{unique_id}_{timestamp}{extension}"
        return f"{prefix}/{date_path}/{filename}"
    
    def validate_upload_request(self, file_type: str, file_size: int) -> None:
        """
        验证上传请求
        
        Args:
            file_type: 文件MIME类型
            file_size: 文件大小(字节)
            
        Raises:
            ValidationError: 验证失败时抛出
        """
        # 检查文件类型
        if file_type not in self.ALLOWED_IMAGE_TYPES:
            allowed_types = ', '.join(self.ALLOWED_IMAGE_TYPES.keys())
            raise ValidationError(f"不支持的文件类型。支持的类型: {allowed_types}")
        
        # 检查文件大小
        if file_size > self.MAX_FILE_SIZE:
            max_size_mb = self.MAX_FILE_SIZE / (1024 * 1024)
            raise ValidationError(f"文件大小超出限制。最大允许: {max_size_mb}MB")
        
        if file_size <= 0:
            raise ValidationError("文件大小必须大于0")
    
    def generate_presigned_upload_url(
        self, 
        file_type: str, 
        file_size: int,
        prefix: str = 'property-images'
    ) -> Dict[str, str]:
        """
        生成预签名上传URL
        
        Args:
            file_type: 文件MIME类型
            file_size: 文件大小(字节)  
            prefix: 存储路径前缀
            
        Returns:
            包含上传URL和对象键的字典
            
        Raises:
            ValidationError: 验证失败
            ClientError: R2服务错误
        """
        # 检查配置
        self._check_configuration()
        
        # 验证请求
        self.validate_upload_request(file_type, file_size)
        
        # 生成唯一对象键
        object_key = self.generate_unique_key(file_type, prefix)
        
        try:
            # 生成预签名PUT URL (R2支持PUT而不是POST)
            presigned_url = self.s3_client.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': object_key,
                    'ContentType': file_type
                },
                ExpiresIn=self.PRESIGNED_URL_EXPIRY
            )
            
            # 构造完整的文件URL（用于前端预览和后端保存）
            if hasattr(settings, 'AWS_S3_CUSTOM_DOMAIN') and settings.AWS_S3_CUSTOM_DOMAIN:
                file_url = f"https://{settings.AWS_S3_CUSTOM_DOMAIN}/{object_key}"
            else:
                file_url = f"{settings.AWS_S3_ENDPOINT_URL}/{self.bucket_name}/{object_key}"
            
            return {
                'upload_url': presigned_url,
                'object_key': object_key,
                'file_url': file_url,
                'expires_in': self.PRESIGNED_URL_EXPIRY,
                'max_file_size': self.MAX_FILE_SIZE,
                'content_type': file_type
            }
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'NoSuchBucket':
                raise ValidationError(f"存储桶 '{self.bucket_name}' 不存在")
            else:
                raise ValidationError(f"生成预签名URL失败: {str(e)}")
    
    def generate_batch_presigned_urls(
        self, 
        upload_requests: List[Dict[str, Any]],
        prefix: str = 'property-images'
    ) -> List[Dict[str, str]]:
        """
        批量生成预签名上传URL
        
        Args:
            upload_requests: 上传请求列表，每个包含 file_type 和 file_size
            prefix: 存储路径前缀
            
        Returns:
            预签名URL信息列表
        """
        results = []
        
        for i, request in enumerate(upload_requests):
            try:
                file_type = request.get('file_type')
                file_size = request.get('file_size')
                
                if not file_type or not file_size:
                    results.append({
                        'success': False,
                        'error': f'请求 {i+1}: 缺少必要字段 file_type 或 file_size'
                    })
                    continue
                
                presigned_data = self.generate_presigned_upload_url(
                    file_type=file_type,
                    file_size=file_size,
                    prefix=prefix
                )
                
                results.append({
                    'success': True,
                    **presigned_data
                })
                
            except ValidationError as e:
                results.append({
                    'success': False,
                    'error': f'请求 {i+1}: {str(e)}'
                })
            except Exception as e:
                results.append({
                    'success': False,
                    'error': f'请求 {i+1}: 处理失败 - {str(e)}'
                })
        
        return results
    
    def verify_upload_success(self, object_key: str) -> bool:
        """
        验证文件是否已成功上传到R2
        
        Args:
            object_key: 对象键
            
        Returns:
            True if file exists, False otherwise
        """
        try:
            self._check_configuration()
            self.s3_client.head_object(Bucket=self.bucket_name, Key=object_key)
            return True
        except (ClientError, ValueError):
            return False
    
    def get_file_info(self, object_key: str) -> Optional[Dict[str, Any]]:
        """
        获取已上传文件的详细信息
        
        Args:
            object_key: 对象键
            
        Returns:
            文件信息字典或None
        """
        try:
            self._check_configuration()
            response = self.s3_client.head_object(Bucket=self.bucket_name, Key=object_key)
            
            # 构造公开访问URL
            if hasattr(settings, 'AWS_S3_CUSTOM_DOMAIN') and settings.AWS_S3_CUSTOM_DOMAIN:
                file_url = f"https://{settings.AWS_S3_CUSTOM_DOMAIN}/{object_key}"
            else:
                file_url = f"{settings.AWS_S3_ENDPOINT_URL}/{self.bucket_name}/{object_key}"
            
            return {
                'object_key': object_key,
                'file_url': file_url,
                'size': response.get('ContentLength', 0),
                'content_type': response.get('ContentType', ''),
                'last_modified': response.get('LastModified'),
                'etag': response.get('ETag', '').strip('"')  # 移除ETag的引号
            }
            
        except ClientError:
            return None
        except ValueError:
            return None
    
    def delete_file(self, object_key: str) -> bool:
        """
        删除R2中的文件
        
        Args:
            object_key: 对象键
            
        Returns:
            True if deleted successfully, False otherwise
        """
        try:
            self._check_configuration()
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=object_key)
            return True
        except (ClientError, ValueError):
            return False


# 全局服务实例
r2_upload_service = R2UploadService()