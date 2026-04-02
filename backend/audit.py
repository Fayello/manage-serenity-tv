#!/usr/bin/env python3
import os
import sys
import django
from django.db.models import Count

# Setup Django
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Channel

def audit():
    print("--- ALL CATEGORIES ---")
    cats = Channel.objects.values('category').annotate(count=Count('category')).order_by('-count')
    for c in cats:
        print(f"{c['category']}: {c['count']}")

if __name__ == '__main__':
    from django.db.models import Q
    audit()
