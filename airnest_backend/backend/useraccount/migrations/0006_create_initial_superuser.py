import os
import uuid
from django.db import migrations
from django.contrib.auth.hashers import make_password

def create_initial_superuser(apps, schema_editor):
    User = apps.get_model('useraccount', 'User')  # 你的自定义用户模型
    # 已有超管就跳过
    if User.objects.filter(is_superuser=True).exists():
        return

    username = os.getenv('DJANGO_SUPERUSER_USERNAME') or os.getenv('ADMIN_USER') or 'admin'
    email    = os.getenv('DJANGO_SUPERUSER_EMAIL') or os.getenv('ADMIN_EMAIL')
    password = os.getenv('DJANGO_SUPERUSER_PASSWORD') or os.getenv('ADMIN_PASSWORD')

    if not (email and password):
        print('⚠️  Skipping initial superuser creation: env vars missing.')
        return

    fields = dict(
        id=uuid.uuid4(),
        email=email,
        is_staff=True,
        is_superuser=True,
        is_active=True,
        password=make_password(password),
        email_verified=True, 
    )

    if 'name' in [f.name for f in User._meta.get_fields()]:
        fields['name'] = username
    if 'username' in [f.name for f in User._meta.get_fields()]:
        fields['username'] = username

    User.objects.create(**fields)
    print(f'✅ Created initial superuser: {email}')

class Migration(migrations.Migration):
    dependencies = [
        ('useraccount', '0005_auto_20250804_0602'),
    ]
    operations = [migrations.RunPython(create_initial_superuser, migrations.RunPython.noop)]
