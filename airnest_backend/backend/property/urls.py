from django.urls import path

from . import api

urlpatterns = [
    path('', api.property_list, name='api_properties_list'),
    path('with-reviews/', api.properties_with_reviews, name='api_properties_with_reviews'),
    path('<uuid:pk>/with-reviews/', api.property_with_reviews, name='api_property_with_reviews'),
    path('create/', api.create_property, name='api_properties_create'),
    path('draft/', api.create_draft_property, name='api_properties_draft'),
    path('<uuid:pk>/publish/', api.publish_property, name='api_properties_publish'),
    path('<uuid:pk>/', api.property_detail, name='api_properties_detail'),
    path('my/', api.my_properties, name='api_properties_my'),
    path('<uuid:pk>/reserve/', api.create_reservation, name='api_properties_reserve'),
    path('<uuid:pk>/booked-dates/', api.get_booked_dates, name='api_properties_booked_dates'),
    path('reservations/', api.get_user_reservations, name='api_properties_reservations'),
    path('wishlist/', api.get_wishlist, name='api_properties_wishlist'),
    path('<uuid:pk>/toggle-favorite/', api.toggle_favorite, name='api_properties_toggle_favorite'),
    path('timezones/', api.get_timezone_list, name='api_properties_timezones'),
    path('<uuid:property_id>/images/update-order/', api.update_property_images_order, name='api_properties_update_images_order'),
    path('<uuid:property_id>/images/<int:image_id>/', api.delete_property_image, name='api_properties_delete_image'),
    
    # 评论相关API
    path('review-tags/', api.get_review_tags, name='api_review_tags'),
    path('<uuid:pk>/reviews/', api.property_reviews, name='api_property_reviews'),
    path('<uuid:pk>/review-stats/', api.property_review_stats, name='api_property_review_stats'),
    path('reviews/<uuid:review_id>/', api.manage_review, name='api_manage_review'),
]
