# Temporary solution: remove object_key unique constraint to unblock production
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('property', '0017_fix_object_key_unique_constraint'),
    ]

    operations = [
        migrations.RunSQL(
            """
            -- 临时移除object_key的唯一约束，允许系统正常运行
            ALTER TABLE property_propertyimage DROP CONSTRAINT IF EXISTS property_propertyimage_object_key_unique;
            
            -- 清理空的object_key值
            UPDATE property_propertyimage 
            SET object_key = 'temp_' || id::text || '_' || EXTRACT(EPOCH FROM NOW())::bigint
            WHERE object_key = '' OR object_key IS NULL;
            """,
            reverse_sql="""
            -- 如需回滚，重新添加约束（可能会失败如果有重复值）
            ALTER TABLE property_propertyimage ADD CONSTRAINT property_propertyimage_object_key_unique UNIQUE (object_key);
            """
        ),
    ]