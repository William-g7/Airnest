from django.urls import path

from . import api

urlpatterns = [
    path('', api.property_list, name='api_properties_list'),
    path('create/', api.create_property, name='api_properties_create'),
    path('<uuid:pk>/', api.property_detail, name='api_properties_detail'),
]
