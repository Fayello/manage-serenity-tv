import os
import sys
import django
from django.db.models import Count

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Channel

def check_status():
    total = Channel.objects.count()
    unique_urls = Channel.objects.values('stream_url').distinct().count()
    dups_query = Channel.objects.values('stream_url').annotate(count=Count('id')).filter(count__gt=1)
    dups_count = dups_query.count()
    
    # Calculate how many extra rows exist
    total_extra = sum(d['count'] - 1 for d in dups_query)
    
    print(f"--- Channel Statistics ---")
    print(f"Total Database Rows: {total}")
    print(f"Unique Channels (Goal): {unique_urls}")
    print(f"Extra Duplicates to Delete: {total_extra}")
    print(f"Unique URLs that have duplicates: {dups_count}")

if __name__ == "__main__":
    check_status()
