from django.urls import path

from . import api

urlpatterns = [
    path('', api.property_list, name='api_properties_list'),
]