"""
Seed demo data: property tags + fake reviews for all published properties.
Run: python manage.py seed_demo_data
"""
import random
from django.core.management.base import BaseCommand
from django.utils import timezone
from property.models import Property, PropertyReview, ReviewTag
from useraccount.models import User

# Realistic reviewer personas
REVIEWERS = [
    {'name': 'Sarah Chen',     'email': 'demo_sarah@airnest.me'},
    {'name': 'Marco Rossi',    'email': 'demo_marco@airnest.me'},
    {'name': 'Yuki Tanaka',    'email': 'demo_yuki@airnest.me'},
    {'name': 'Emma Wilson',    'email': 'demo_emma@airnest.me'},
    {'name': 'Lucas Dubois',   'email': 'demo_lucas@airnest.me'},
    {'name': 'Ana García',     'email': 'demo_ana@airnest.me'},
    {'name': 'David Kim',      'email': 'demo_david@airnest.me'},
    {'name': 'Sophie Martin',  'email': 'demo_sophie@airnest.me'},
]

# Tag pools per property category (pick 3-5)
TAG_POOLS = {
    'beach house':  ['pool', 'great_view', 'beach_nearby', 'spacious', 'family_friendly', 'parking'],
    'apartment':    ['wifi', 'kitchen', 'city_center', 'metro_access', 'modern_design', 'ac'],
    'house':        ['spacious', 'parking', 'kitchen', 'quiet_area', 'family_friendly', 'laundry'],
    'hotel':        ['wifi', 'gym', 'ac', 'city_center', 'luxury', 'business_ready'],
    'castle':       ['unique_architecture', 'historic', 'great_view', 'spacious', 'luxury'],
    'treehouse':    ['unique_architecture', 'great_view', 'quiet_area', 'cozy', 'pet_friendly'],
    'farm house':   ['quiet_area', 'spacious', 'parking', 'pet_friendly', 'local_culture', 'family_friendly'],
    'bed and breakfast': ['cozy', 'excellent_host', 'fast_checkin', 'kitchen', 'quiet_area'],
    'ferry':        ['unique_architecture', 'great_view', 'cozy', 'modern_design'],
}
DEFAULT_TAGS = ['wifi', 'kitchen', 'ac', 'quiet_area', 'parking', 'spacious', 'cozy', 'great_view']

# Review templates (title, content, rating)
POSITIVE_REVIEWS = [
    ("Amazing stay!", "We had an incredible time here. The place was exactly as described, clean and well-maintained. The host was very responsive and helpful. Would definitely come back!", 5),
    ("Perfect getaway", "This was the perfect spot for our vacation. Beautiful surroundings, comfortable beds, and all the amenities we needed. Highly recommend to anyone looking for a relaxing stay.", 5),
    ("Exceeded expectations", "The photos don't do this place justice — it's even better in person. Everything was spotless and the location is unbeatable. The host left us a lovely welcome note and local recommendations.", 5),
    ("Great location and value", "Fantastic location, walking distance to everything. The place is cozy and well-equipped. Great value for the price. We'll be back for sure.", 4),
    ("Lovely place, wonderful host", "The host went above and beyond to make our stay special. The apartment was beautifully decorated and had everything we needed. Communication was excellent throughout.", 5),
    ("Very comfortable", "Clean, comfortable, and well-located. The kitchen was fully equipped which saved us money on eating out. The neighborhood felt very safe. Minor issue with hot water but host fixed it quickly.", 4),
    ("Highly recommend", "This place is a gem! Quiet neighborhood but close to public transport. The bed was super comfortable and the shower had great water pressure. Would stay again without hesitation.", 5),
    ("Nice place, some minor issues", "Overall a good stay. The apartment was clean and the location was convenient. The WiFi was a bit slow at times and the street can be noisy in the morning, but nothing major.", 4),
    ("Solid choice", "Good apartment in a great area. Everything worked as expected. The check-in process was smooth and the host provided clear instructions. Would recommend for short stays.", 4),
    ("Good but not perfect", "The location is excellent and the apartment is spacious. However, the kitchen could use some updating and the AC was a bit loud. Still, good value overall and the host was friendly.", 3),
    ("Decent stay", "It was okay for the price. The place is clean and functional. Location is good but the building is a bit old. The host was responsive when we had questions.", 3),
    ("Wonderful experience", "From the moment we arrived, everything was perfect. The space was immaculate, the views were stunning, and the host had stocked the fridge with local treats. A truly memorable stay!", 5),
]


class Command(BaseCommand):
    help = 'Seed property tags and demo reviews for all published properties'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Clear existing demo reviews before seeding')

    def handle(self, *args, **options):
        if options['clear']:
            deleted, _ = PropertyReview.objects.filter(user__email__endswith='@airnest.me').delete()
            self.stdout.write(f'Cleared {deleted} demo reviews')
            User.objects.filter(email__endswith='@airnest.me', email__startswith='demo_').delete()
            self.stdout.write('Cleared demo users')

        # 1. Ensure review tags exist
        self.stdout.write('Checking review tags...')
        from django.core.management import call_command
        call_command('init_review_tags')

        # 2. Create reviewer users
        reviewers = []
        for r in REVIEWERS:
            user, created = User.objects.get_or_create(
                email=r['email'],
                defaults={'name': r['name'], 'is_active': True}
            )
            if created:
                user.set_password('DemoPass123!')
                user.save()
            reviewers.append(user)
        self.stdout.write(f'Reviewers ready: {len(reviewers)}')

        # 3. Get all published properties
        properties = list(Property.objects.filter(status='published'))
        if not properties:
            properties = list(Property.objects.all())
        self.stdout.write(f'Found {len(properties)} properties')

        # 4. Seed tags + reviews for each property
        review_tags = list(ReviewTag.objects.filter(is_active=True))
        review_tag_keys = [t.tag_key for t in review_tags]

        for prop in properties:
            # -- Property tags --
            if not prop.property_tags:
                category = prop.category.lower() if prop.category else ''
                pool = TAG_POOLS.get(category, DEFAULT_TAGS)
                count = random.randint(3, min(5, len(pool)))
                prop.property_tags = random.sample(pool, count)
                prop.save(update_fields=['property_tags'])
                self.stdout.write(f'  [{prop.title[:30]}] tags: {prop.property_tags}')

            # -- Reviews --
            existing_reviewers = set(
                PropertyReview.objects.filter(property_ref=prop).values_list('user_id', flat=True)
            )
            available = [u for u in reviewers if u.id not in existing_reviewers]

            if not available:
                self.stdout.write(f'  [{prop.title[:30]}] already has max reviews, skipping')
                continue

            num_reviews = random.randint(4, min(6, len(available)))
            chosen_reviewers = random.sample(available, num_reviews)
            chosen_reviews = random.sample(POSITIVE_REVIEWS, num_reviews)

            for user, (title, content, rating) in zip(chosen_reviewers, chosen_reviews):
                review = PropertyReview.objects.create(
                    property_ref=prop,
                    user=user,
                    rating=rating,
                    title=title,
                    content=content,
                    is_verified=True,
                )
                # Attach 1-3 random review tags
                num_tags = random.randint(1, 3)
                tag_sample = random.sample(review_tags, min(num_tags, len(review_tags)))
                for tag in tag_sample:
                    review.tags.add(tag)

            self.stdout.write(f'  [{prop.title[:30]}] added {num_reviews} reviews')

        self.stdout.write(self.style.SUCCESS(f'\nDone! Seeded tags and reviews for {len(properties)} properties.'))
