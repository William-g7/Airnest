from django.core.management.base import BaseCommand
from property.models import ReviewTag


class Command(BaseCommand):
    help = '初始化评论标签数据'

    def handle(self, *args, **options):
        # 定义标签数据
        tags_data = [
            # 位置相关
            {
                'tag_key': 'great_location',
                'name_en': 'Great Location',
                'name_zh': '位置极佳',
                'name_fr': 'Excellent emplacement',
                'color': '#3B82F6',
                'category': 'location',
                'order': 1
            },
            {
                'tag_key': 'convenient_transport',
                'name_en': 'Convenient Transport',
                'name_zh': '交通便利',
                'name_fr': 'Transport pratique',
                'color': '#3B82F6',
                'category': 'location',
                'order': 2
            },
            {
                'tag_key': 'quiet_area',
                'name_en': 'Quiet Area',
                'name_zh': '安静环境',
                'name_fr': 'Zone calme',
                'color': '#3B82F6',
                'category': 'location',
                'order': 3
            },
            
            # 清洁度相关
            {
                'tag_key': 'very_clean',
                'name_en': 'Very Clean',
                'name_zh': '非常干净',
                'name_fr': 'Très propre',
                'color': '#10B981',
                'category': 'cleanliness',
                'order': 1
            },
            {
                'tag_key': 'spotless',
                'name_en': 'Spotless',
                'name_zh': '一尘不染',
                'name_fr': 'Impeccable',
                'color': '#10B981',
                'category': 'cleanliness',
                'order': 2
            },
            
            # 服务相关
            {
                'tag_key': 'responsive_host',
                'name_en': 'Responsive Host',
                'name_zh': '房东回复及时',
                'name_fr': 'Hôte réactif',
                'color': '#F59E0B',
                'category': 'service',
                'order': 1
            },
            {
                'tag_key': 'helpful_host',
                'name_en': 'Helpful Host',
                'name_zh': '房东热心助人',
                'name_fr': 'Hôte serviable',
                'color': '#F59E0B',
                'category': 'service',
                'order': 2
            },
            {
                'tag_key': 'welcoming',
                'name_en': 'Welcoming',
                'name_zh': '热情好客',
                'name_fr': 'Accueillant',
                'color': '#F59E0B',
                'category': 'service',
                'order': 3
            },
            
            # 设施相关
            {
                'tag_key': 'great_amenities',
                'name_en': 'Great Amenities',
                'name_zh': '设施齐全',
                'name_fr': 'Excellents équipements',
                'color': '#8B5CF6',
                'category': 'amenities',
                'order': 1
            },
            {
                'tag_key': 'comfortable_bed',
                'name_en': 'Comfortable Bed',
                'name_zh': '床铺舒适',
                'name_fr': 'Lit confortable',
                'color': '#8B5CF6',
                'category': 'amenities',
                'order': 2
            },
            {
                'tag_key': 'good_wifi',
                'name_en': 'Good WiFi',
                'name_zh': '网络良好',
                'name_fr': 'Bon WiFi',
                'color': '#8B5CF6',
                'category': 'amenities',
                'order': 3
            },
            {
                'tag_key': 'well_equipped',
                'name_en': 'Well Equipped',
                'name_zh': '设备完善',
                'name_fr': 'Bien équipé',
                'color': '#8B5CF6',
                'category': 'amenities',
                'order': 4
            },
            
            # 性价比相关
            {
                'tag_key': 'great_value',
                'name_en': 'Great Value',
                'name_zh': '性价比高',
                'name_fr': 'Excellent rapport qualité-prix',
                'color': '#EF4444',
                'category': 'value',
                'order': 1
            },
            {
                'tag_key': 'affordable',
                'name_en': 'Affordable',
                'name_zh': '价格实惠',
                'name_fr': 'Abordable',
                'color': '#EF4444',
                'category': 'value',
                'order': 2
            },
            
            # 沟通相关
            {
                'tag_key': 'easy_checkin',
                'name_en': 'Easy Check-in',
                'name_zh': '入住方便',
                'name_fr': 'Arrivée facile',
                'color': '#06B6D4',
                'category': 'communication',
                'order': 1
            },
            {
                'tag_key': 'clear_instructions',
                'name_en': 'Clear Instructions',
                'name_zh': '说明清晰',
                'name_fr': 'Instructions claires',
                'color': '#06B6D4',
                'category': 'communication',
                'order': 2
            },
        ]

        created_count = 0
        updated_count = 0

        for tag_data in tags_data:
            tag, created = ReviewTag.objects.get_or_create(
                tag_key=tag_data['tag_key'],
                defaults=tag_data
            )
            
            if created:
                created_count += 1
                self.stdout.write(f"创建标签: {tag.name_zh} ({tag.tag_key})")
            else:
                # 更新现有标签
                for key, value in tag_data.items():
                    setattr(tag, key, value)
                tag.save()
                updated_count += 1
                self.stdout.write(f"更新标签: {tag.name_zh} ({tag.tag_key})")

        self.stdout.write(
            self.style.SUCCESS(
                f'成功处理 {len(tags_data)} 个标签: '
                f'{created_count} 个新建, {updated_count} 个更新'
            )
        )