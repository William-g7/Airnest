# Generated manually for production deployment
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('property', '0014_property_status'),
    ]

    operations = [
        migrations.RenameField(
            model_name='propertyimage',
            old_name='property',
            new_name='property_ref',
        ),
    ]