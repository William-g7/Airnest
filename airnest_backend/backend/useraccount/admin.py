from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.utils import timezone
from .models import User, EmailVerification


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """用户管理界面"""
    
    list_display = [
        'email', 'name', 'email_verified_status', 'is_active', 
        'is_staff', 'date_joined', 'last_login'
    ]
    list_filter = [
        'email_verified', 'is_active', 'is_staff', 'is_superuser', 
        'date_joined', 'email_verified_at'
    ]
    search_fields = ['email', 'name']
    ordering = ['-date_joined']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('个人信息', {'fields': ('name', 'avatar')}),
        ('邮箱验证', {
            'fields': ('email_verified', 'email_verified_at'),
            'classes': ('collapse',)
        }),
        ('权限', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
        ('重要日期', {
            'fields': ('last_login', 'date_joined'),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'password1', 'password2'),
        }),
    )
    
    readonly_fields = ['date_joined', 'last_login', 'email_verified_at']
    
    def email_verified_status(self, obj):
        """显示邮箱验证状态"""
        if obj.email_verified:
            return format_html(
                '<span style="color: green;">✅ 已验证</span><br>'
                '<small>{}</small>',
                obj.email_verified_at.strftime('%Y-%m-%d %H:%M') if obj.email_verified_at else ''
            )
        else:
            return format_html(
                '<span style="color: red;">❌ 未验证</span>'
            )
    
    email_verified_status.short_description = '邮箱验证'
    email_verified_status.admin_order_field = 'email_verified'


@admin.register(EmailVerification)
class EmailVerificationAdmin(admin.ModelAdmin):
    """邮箱验证管理界面"""
    
    list_display = [
        'email', 'user_email', 'verification_type', 'status_display', 
        'created_at', 'expires_at', 'used_at'
    ]
    list_filter = [
        'verification_type', 'is_used', 'created_at', 'expires_at'
    ]
    search_fields = ['email', 'user__email', 'token']
    ordering = ['-created_at']
    readonly_fields = [
        'token', 'created_at', 'used_at', 'user', 'email'
    ]
    
    fieldsets = (
        ('基本信息', {
            'fields': ('user', 'email', 'verification_type')
        }),
        ('令牌信息', {
            'fields': ('token', 'expires_at', 'is_used', 'used_at'),
            'classes': ('collapse',)
        }),
        ('请求信息', {
            'fields': ('ip_address', 'user_agent'),
            'classes': ('collapse',)
        }),
        ('时间信息', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def user_email(self, obj):
        """显示关联用户邮箱"""
        return obj.user.email
    user_email.short_description = '用户邮箱'
    user_email.admin_order_field = 'user__email'
    
    def status_display(self, obj):
        """显示验证状态"""
        if obj.is_used:
            return format_html('<span style="color: green;">✅ 已使用</span>')
        elif obj.is_expired():
            return format_html('<span style="color: red;">⏰ 已过期</span>')
        else:
            return format_html('<span style="color: orange;">⏳ 待验证</span>')
    
    status_display.short_description = '状态'
    
    def has_add_permission(self, request):
        """禁止手动添加验证记录"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """禁止修改验证记录"""
        return False
    
    actions = ['cleanup_expired_tokens']
    
    def cleanup_expired_tokens(self, request, queryset):
        """清理过期令牌的管理动作"""
        count = EmailVerification.cleanup_expired_tokens()
        self.message_user(request, f'已清理 {count} 个过期的验证令牌')
    
    cleanup_expired_tokens.short_description = '清理过期令牌'
