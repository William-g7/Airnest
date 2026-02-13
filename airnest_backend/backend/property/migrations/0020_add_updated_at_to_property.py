# Generated manually to add updated_at field to Property model
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('property', '0019_propertyimage_pk_to_uuid'),
    ]

    operations = [
        migrations.AddField(
            model_name='property',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
    ]