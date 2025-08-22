# Generated manually for production deployment
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('property', '0013_auto_20250822_1303'),
    ]

    operations = [
        migrations.AddField(
            model_name='property',
            name='status',
            field=models.CharField(choices=[('draft', '草稿'), ('published', '已发布')], default='published', max_length=20),
        ),
    ]