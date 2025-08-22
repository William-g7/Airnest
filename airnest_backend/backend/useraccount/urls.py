from django.urls import path

from dj_rest_auth.views import LoginView, LogoutView, UserDetailsView
from rest_framework_simplejwt.views import TokenVerifyView

from . import api
from .views import TurnstileRegisterView, SecureTokenRefreshView


urlpatterns = [
    # 认证相关
    path('register/', TurnstileRegisterView.as_view(), name='rest_register'),
    path('login/', LoginView.as_view(), name='rest_login'),
    path('logout/', LogoutView.as_view(), name='rest_logout'),
    path('me/', UserDetailsView.as_view(), name='user_details'),
    path('token/refresh/', SecureTokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # 用户资料相关
    path('profile/<uuid:pk>/', api.profile_detail, name='api_profile_detail'),
    path('landlords/<uuid:pk>/', api.landlord_detail, name='api_landlord_detail'),
    
    # 邮箱验证相关
    path('send-verification/', api.send_verification_email, name='send_verification_email'),
    path('verify-email/', api.verify_email_token, name='verify_email_token'),
    path('resend-verification/', api.resend_verification_email, name='resend_verification_email'),
    path('verification-status/', api.verification_status, name='verification_status'),
    path('cancel-verification/', api.cancel_verification, name='cancel_verification'),
    
    # 密码重置相关
    path('forgot-password/', api.forgot_password, name='forgot_password'),
    path('verify-reset-token/', api.verify_reset_token, name='verify_reset_token'),
    path('reset-password/', api.reset_password, name='reset_password'),
    path('change-password/', api.change_password, name='change_password'),
]
