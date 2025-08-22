# Fix object_key unique constraint issue
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('property', '0016_safe_add_r2_fields'),
    ]

    operations = [
        migrations.RunSQL(
            """
            DO $$ 
            BEGIN
                -- 首先为所有空的object_key生成唯一值
                UPDATE property_propertyimage 
                SET object_key = 'legacy_' || id::text 
                WHERE object_key = '' OR object_key IS NULL;
                
                -- 然后尝试创建唯一约束（如果不存在）
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint 
                    WHERE conname = 'property_propertyimage_object_key_unique'
                ) THEN
                    -- 先删除可能存在的部分约束
                    BEGIN
                        ALTER TABLE property_propertyimage DROP CONSTRAINT IF EXISTS property_propertyimage_object_key_unique;
                    EXCEPTION
                        WHEN OTHERS THEN NULL;
                    END;
                    
                    -- 创建新的唯一约束
                    ALTER TABLE property_propertyimage ADD CONSTRAINT property_propertyimage_object_key_unique UNIQUE (object_key);
                END IF;
                
            END $$;
            """,
            reverse_sql="""
                ALTER TABLE property_propertyimage DROP CONSTRAINT IF EXISTS property_propertyimage_object_key_unique;
            """
        ),
    ]