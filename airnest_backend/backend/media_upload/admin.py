"""
Media Upload Admin Configuration

为草稿房源和上传管理提供Django Admin界面
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import DraftProperty, DraftPropertyImage, UploadSession


@admin.register(DraftProperty)
class DraftPropertyAdmin(admin.ModelAdmin):
    """草稿房源管理界面"""
    
    list_display = [
        'title_display', 'user', 'status', 'completion_percentage', 
        'image_count', 'is_ready_for_publish', 'created_at', 'updated_at'
    ]
    list_filter = [
        'status', 'basic_info_completed', 'location_completed', 
        'images_completed', 'pricing_completed', 'created_at'
    ]
    search_fields = ['title', 'user__email', 'description', 'city', 'country']
    readonly_fields = [
        'id', 'completion_percentage', 'is_ready_for_publish',
        'basic_info_completed', 'location_completed', 
        'images_completed', 'pricing_completed', 
        'created_at', 'updated_at', 'image_preview'
    ]
    
    fieldsets = (
        ('基本信息', {
            'fields': ('id', 'user', 'status', 'title', 'description')
        }),
        ('房源配置', {
            'fields': ('category', 'place_type', 'bedrooms', 'bathrooms', 'guests', 'beds')
        }),
        ('位置信息', {
            'fields': ('country', 'state', 'city', 'address', 'postal_code', 'timezone')
        }),
        ('价格', {
            'fields': ('price_per_night',)
        }),
        ('完成状态', {
            'fields': (
                'completion_percentage', 'is_ready_for_publish',
                'basic_info_completed', 'location_completed', 
                'images_completed', 'pricing_completed'
            )
        }),
        ('图片预览', {
            'fields': ('image_preview',)
        }),
        ('时间戳', {
            'fields': ('created_at', 'updated_at')
        })
    )
    
    def title_display(self, obj):
        """显示标题，没有标题时显示未命名"""
        return obj.title or '(未命名)'
    title_display.short_description = '标题'
    
    def completion_percentage(self, obj):
        """显示完成百分比"""
        percentage = obj.completion_percentage
        color = 'green' if percentage == 100 else 'orange' if percentage > 50 else 'red'
        return format_html(
            '<span style="color: {color}; font-weight: bold;">{percentage}%</span>',
            color=color,
            percentage=int(percentage)
        )
    completion_percentage.short_description = '完成度'
    
    def image_count(self, obj):
        """显示图片数量"""
        count = obj.images.filter(is_active=True).count()
        if count > 0:
            url = reverse('admin:media_upload_draftpropertyimage_changelist') + f'?draft_property__id__exact={obj.id}'
            return format_html('<a href="{}">{} 张图片</a>', url, count)
        return '0 张图片'
    image_count.short_description = '图片'
    
    def image_preview(self, obj):
        """显示主图预览"""
        main_image = obj.images.filter(is_main=True, is_active=True).first()
        if main_image:
            return format_html(
                '<img src="{}" style="max-height: 100px; max-width: 200px;" />',
                main_image.file_url
            )
        return '(无主图)'
    image_preview.short_description = '主图预览'


class DraftPropertyImageInline(admin.TabularInline):
    """草稿房源图片内联编辑"""
    model = DraftPropertyImage
    extra = 0
    readonly_fields = ['id', 'file_preview', 'file_size_display', 'uploaded_at']
    fields = [
        'file_preview', 'object_key', 'file_size_display', 'content_type',
        'order', 'is_main', 'is_active', 'alt_text'
    ]
    
    def file_preview(self, obj):
        """文件预览"""
        if obj.file_url:
            return format_html(
                '<img src="{}" style="max-height: 60px; max-width: 100px;" />',
                obj.file_url
            )
        return '(无预览)'
    file_preview.short_description = '预览'
    
    def file_size_display(self, obj):
        """格式化文件大小显示"""
        size = obj.file_size
        if size < 1024:
            return f'{size} B'
        elif size < 1024 * 1024:
            return f'{size / 1024:.1f} KB'
        else:
            return f'{size / (1024 * 1024):.1f} MB'
    file_size_display.short_description = '文件大小'


@admin.register(DraftPropertyImage)
class DraftPropertyImageAdmin(admin.ModelAdmin):
    """草稿房源图片管理界面"""
    
    list_display = [
        'image_preview', 'draft_property_title', 'object_key_short', 
        'file_size_display', 'content_type', 'order', 'is_main', 'is_active'
    ]
    list_filter = ['content_type', 'is_main', 'is_active', 'uploaded_at']
    search_fields = ['draft_property__title', 'object_key', 'alt_text']
    readonly_fields = [
        'id', 'image_preview', 'file_size_display', 'uploaded_at', 'updated_at'
    ]
    
    fieldsets = (
        ('基本信息', {
            'fields': ('id', 'draft_property', 'object_key', 'file_url')
        }),
        ('文件信息', {
            'fields': ('file_size_display', 'content_type', 'etag')
        }),
        ('显示设置', {
            'fields': ('order', 'is_main', 'is_active', 'alt_text')
        }),
        ('预览', {
            'fields': ('image_preview',)
        }),
        ('时间戳', {
            'fields': ('uploaded_at', 'updated_at')
        })
    )
    
    def draft_property_title(self, obj):
        """显示草稿房源标题"""
        title = obj.draft_property.title or '(未命名)'
        url = reverse('admin:media_upload_draftproperty_change', args=[obj.draft_property.id])
        return format_html('<a href="{}">{}</a>', url, title)
    draft_property_title.short_description = '草稿房源'
    
    def object_key_short(self, obj):
        """显示缩短的对象键"""
        key = obj.object_key
        if len(key) > 40:
            return f'{key[:20]}...{key[-17:]}'
        return key
    object_key_short.short_description = '对象键'
    
    def image_preview(self, obj):
        """图片预览"""
        return format_html(
            '<img src="{}" style="max-height: 100px; max-width: 200px;" />',
            obj.file_url
        )
    image_preview.short_description = '预览'
    
    def file_size_display(self, obj):
        """格式化文件大小显示"""
        size = obj.file_size
        if size < 1024:
            return f'{size} B'
        elif size < 1024 * 1024:
            return f'{size / 1024:.1f} KB'
        else:
            return f'{size / (1024 * 1024):.1f} MB'
    file_size_display.short_description = '文件大小'


@admin.register(UploadSession)
class UploadSessionAdmin(admin.ModelAdmin):
    """上传会话管理界面"""
    
    list_display = [
        'id_short', 'user', 'draft_property_title', 'status', 
        'progress_display', 'total_files', 'uploaded_files', 'failed_files',
        'is_expired', 'created_at'
    ]
    list_filter = ['status', 'created_at', 'expires_at']
    search_fields = ['user__email', 'draft_property__title']
    readonly_fields = [
        'id', 'progress_display', 'is_expired', 'upload_progress',
        'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('基本信息', {
            'fields': ('id', 'user', 'draft_property', 'status')
        }),
        ('上传统计', {
            'fields': ('total_files', 'uploaded_files', 'failed_files', 'progress_display')
        }),
        ('时间信息', {
            'fields': ('created_at', 'updated_at', 'expires_at', 'is_expired')
        }),
        ('元数据', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        })
    )
    
    def id_short(self, obj):
        """显示短ID"""
        return str(obj.id)[:8] + '...'
    id_short.short_description = 'ID'
    
    def draft_property_title(self, obj):
        """显示草稿房源标题"""
        if obj.draft_property:
            title = obj.draft_property.title or '(未命名)'
            url = reverse('admin:media_upload_draftproperty_change', args=[obj.draft_property.id])
            return format_html('<a href="{}">{}</a>', url, title)
        return '(未关联)'
    draft_property_title.short_description = '草稿房源'
    
    def progress_display(self, obj):
        """显示上传进度"""
        progress = obj.upload_progress
        color = 'green' if progress == 100 else 'orange' if progress > 0 else 'gray'
        return format_html(
            '<div style="width: 100px; background: #f0f0f0; border-radius: 3px;">'
            '<div style="width: {progress}%; height: 20px; background: {color}; border-radius: 3px; text-align: center; line-height: 20px; color: white; font-size: 12px;">'
            '{progress:.0f}%'
            '</div></div>',
            progress=progress,
            color=color
        )
    progress_display.short_description = '进度'
    
    def is_expired(self, obj):
        """显示是否过期"""
        expired = obj.is_expired
        color = 'red' if expired else 'green'
        text = '已过期' if expired else '有效'
        return format_html(
            '<span style="color: {color}; font-weight: bold;">{text}</span>',
            color=color,
            text=text
        )
    is_expired.short_description = '状态'
