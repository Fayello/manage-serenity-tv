import os
import sys
import django

# Add current directory to path
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Channel
from django.db.models import Count

categories = Channel.objects.values('category').annotate(count=Count('category')).order_by('-count')
for cat in categories:
    print(f"{cat['category']}: {cat['count']}")
