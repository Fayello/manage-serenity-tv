import os
import django
import sys

# Set up Django environment
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Channel

def diag():
    print('--- Category Distribution ---')
    from django.db.models import Count
    cats = Channel.objects.values('category').annotate(count=Count('id')).order_by('-count')
    for cat in cats:
        print('%s: %d' % (cat['category'], cat['count']))
    
    print('\n--- Channels with Empty Category ---')
    empty_cats = Channel.objects.filter(category='').count() + Channel.objects.filter(category__isnull=True).count()
    print('Total channels with empty category: %d' % empty_cats)

    print('\n--- Recent Channels ---')
    recent = Channel.objects.all().order_by('-id')[:10]
    for r in recent:
        print('ID: %d, Name: %s, Category: %s, Country: %s' % (r.id, r.name, r.category, r.country))

if __name__ == '__main__':
    diag()
