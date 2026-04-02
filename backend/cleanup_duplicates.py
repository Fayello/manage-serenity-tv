import os
import sys
import django

# Setup Django
sys.path.append('/home/mellou/serenity-tv/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Channel
from django.db.models import Count

def cleanup():
    # Find duplicate stream URLs
    dups = Channel.objects.values('stream_url').annotate(count=Count('id')).filter(count__gt=1)
    print(f"Found {dups.count()} URLs with duplicates.")
    
    total_deleted = 0
    for entry in dups:
        url = entry['stream_url']
        # Keep the one with the most metadata if possible, or just the first one
        ids = list(Channel.objects.filter(stream_url=url).values_list('id', flat=True))
        # Keep the first one, delete the rest
        to_delete = ids[1:]
        deleted_count, _ = Channel.objects.filter(id__in=to_delete).delete()
        total_deleted += deleted_count
        print(f"Deleted {deleted_count} duplicates for URL: {url}")
    
    print(f"Cleanup finished. Total deleted: {total_deleted}")

if __name__ == "__main__":
    cleanup()
