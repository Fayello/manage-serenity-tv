import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Channel

cats = list(Channel.objects.values_list('category', flat=True).distinct())
print("CATEGORIES_START")
for cat in cats:
    print(cat)
print("CATEGORIES_END")

adult_chans = Channel.objects.filter(category__icontains='Adult')
print("ADULT_CHANNELS_START")
for c in adult_chans:
    print(f"{c.name} | {c.category} | {c.stream_url}")
print("ADULT_CHANNELS_END")
