import uuid
from django.db import migrations, models

class Migration(migrations.Migration):
    # 记得把上游依赖改成你当前最后一条迁移
    dependencies = [
        ('property', '0018_temporary_remove_object_key_unique'),
    ]

    # 我们已经在数据库手动完成了改型，这里只“对齐状态”（不再动 DB）
    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],  # 不再执行真实 DDL
            state_operations=[
                migrations.AlterField(
                    model_name='propertyimage',
                    name='id',
                    field=models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False),
                ),
            ],
        ),
    ]
