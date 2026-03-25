import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('property', '0021_add_property_tags'),
    ]

    operations = [
        migrations.CreateModel(
            name='PropertyReviewSummary',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('locale', models.CharField(default='en', max_length=10)),
                ('highlights', models.JSONField(default=list)),
                ('concerns', models.JSONField(default=list)),
                ('best_for', models.JSONField(default=list)),
                ('summary_text', models.TextField(blank=True)),
                ('reviews_count_at_generation', models.IntegerField(default=0)),
                ('is_stale', models.BooleanField(default=False)),
                ('generated_at', models.DateTimeField(auto_now=True)),
                ('model_version', models.CharField(default='', max_length=50)),
                ('property_ref', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='ai_review_summaries',
                    to='property.property',
                )),
            ],
            options={
                'unique_together': {('property_ref', 'locale')},
            },
        ),
    ]
