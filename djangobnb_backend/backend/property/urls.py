from django.urls import path

from . import api

urlpatterns = [
    path('', api.property_list, name='api_properties_list'),
    path('create/', api.create_property, name='api_properties_create'),
    path('<uuid:pk>/', api.property_detail, name='api_properties_detail'),
    path('my/', api.my_properties, name='api_properties_my'),
    path('<uuid:pk>/reserve/', api.create_reservation, name='api_properties_reserve'),
    path('<uuid:pk>/booked-dates/', api.get_booked_dates, name='api_properties_booked_dates'),
    path('reservations/', api.get_user_reservations, name='api_properties_reservations'),
]
