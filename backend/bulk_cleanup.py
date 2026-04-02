import os
import sys
import django
from django.db.models import Count

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Channel

def bulk_cleanup():
    print("Starting optimized cleanup...")
    
    # 1. Identify stream_urls that have duplicates
    dups = Channel.objects.values('stream_url').annotate(count=Count('id')).filter(count__gt=1)
    total_urls = dups.count()
    print(f"Found {total_urls} URLs with duplicates.")
    
    total_deleted = 0
    processed = 0
    
    for entry in dups:
        url = entry['stream_url']
        # Keep the one with the earliest created_at or just the first ID
        ids = list(Channel.objects.filter(stream_url=url).order_by('created_at').values_list('id', flat=True))
        
        if len(ids) > 1:
            # First one is kept, others are deleted
            to_delete = ids[1:]
            deleted_count, _ = Channel.objects.filter(id__in=to_delete).delete()
            total_deleted += deleted_count
            
        processed += 1
        if processed % 100 == 0:
            print(f"Processed {processed}/{total_urls} URLs. Deleted so far: {total_deleted}")

    print(f"Cleanup complete. Total deleted: {total_deleted}")

if __name__ == "__main__":
    bulk_cleanup()
