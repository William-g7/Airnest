# Generated manually for production deployment - Safely add R2 storage fields
from django.db import migrations, models, connection
import django.db.models.deletion
from django.conf import settings
import uuid


def check_column_exists(table_name, column_name):
    """检查表中是否存在指定列"""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT EXISTS(
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = %s AND column_name = %s
            )
        """, [table_name, column_name])
        return cursor.fetchone()[0]


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('property', '0015_rename_property_propertyimage_property_ref'),
    ]

    operations = [
        # 只添加缺失的字段 - Django会在运行时检查
        migrations.RunSQL(
            """
            DO $$ 
            BEGIN
                -- Add object_key if not exists
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name='property_propertyimage' AND column_name='object_key') THEN
                    ALTER TABLE property_propertyimage ADD COLUMN object_key VARCHAR(500) DEFAULT '' NOT NULL;
                    ALTER TABLE property_propertyimage ADD CONSTRAINT property_propertyimage_object_key_unique UNIQUE (object_key);
                END IF;
                
                -- Add file_url if not exists
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name='property_propertyimage' AND column_name='file_url') THEN
                    ALTER TABLE property_propertyimage ADD COLUMN file_url VARCHAR(500) DEFAULT '' NOT NULL;
                END IF;
                
                -- Add file_size if not exists
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name='property_propertyimage' AND column_name='file_size') THEN
                    ALTER TABLE property_propertyimage ADD COLUMN file_size BIGINT DEFAULT 0 NOT NULL;
                END IF;
                
                -- Add content_type if not exists
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name='property_propertyimage' AND column_name='content_type') THEN
                    ALTER TABLE property_propertyimage ADD COLUMN content_type VARCHAR(100) DEFAULT 'image/jpeg' NOT NULL;
                END IF;
                
                -- Add etag if not exists
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name='property_propertyimage' AND column_name='etag') THEN
                    ALTER TABLE property_propertyimage ADD COLUMN etag VARCHAR(100) DEFAULT '' NOT NULL;
                END IF;
                
                -- Add alt_text if not exists
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name='property_propertyimage' AND column_name='alt_text') THEN
                    ALTER TABLE property_propertyimage ADD COLUMN alt_text VARCHAR(255) DEFAULT '' NOT NULL;
                END IF;
                
                -- Add uploaded_by_id if not exists (foreign key)
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name='property_propertyimage' AND column_name='uploaded_by_id') THEN
                    ALTER TABLE property_propertyimage ADD COLUMN uploaded_by_id UUID;
                    ALTER TABLE property_propertyimage ADD CONSTRAINT property_propertyimage_uploaded_by_id_fk 
                        FOREIGN KEY (uploaded_by_id) REFERENCES useraccount_user(id) DEFERRABLE INITIALLY DEFERRED;
                END IF;
                
                -- Add uploaded_at if not exists
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name='property_propertyimage' AND column_name='uploaded_at') THEN
                    ALTER TABLE property_propertyimage ADD COLUMN uploaded_at TIMESTAMP WITH TIME ZONE;
                END IF;
                
                -- Add updated_at if not exists
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name='property_propertyimage' AND column_name='updated_at') THEN
                    ALTER TABLE property_propertyimage ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL;
                END IF;
                
            END $$;
            """,
            reverse_sql="-- 不提供反向SQL，因为删除字段比较危险"
        ),
    ]