from django.forms import ModelForm

from .models import Property


class PropertyForm(ModelForm):
    class Meta:
        model = Property
        fields = (
            'title',
            'description',
            'price_per_night',
            'bedrooms',
            'bathrooms',
            'guests',
            'beds',
            'country',
            'state',
            'city',
            'address',
            'postal_code',
            'category',
            'place_type',
            'timezone',
        )
