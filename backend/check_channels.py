from api.models import Channel
from django.db.models import Count

print(f'Total channels: {Channel.objects.count()}')
print('\nChannels by category:')
for cat in Channel.objects.values('category').annotate(count=Count('id')).order_by('-count')[:10]:
    print(f'  {cat["category"]}: {cat["count"]}')

print('\nSample channels:')
for c in Channel.objects.all()[:10]:
    print(f'  - {c.name} ({c.category})')
