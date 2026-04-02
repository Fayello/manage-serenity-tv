import os
import sys
import django
from django.db import connection

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Channel

def turbo_clean():
    print("🚀 Starting High-Performance Turbo Cleanup...")
    
    # Raw SQL is much faster for this specific operation in PostgreSQL
    # It avoids pulling 10k IDs into Python and sending them back.
    sql = """
    DELETE FROM api_channel 
    WHERE id NOT IN (
        SELECT DISTINCT ON (stream_url) id 
        FROM api_channel 
        ORDER BY stream_url, created_at ASC
    );
    """
    
    with connection.cursor() as cursor:
        print("Executing single-pass deletion...")
        cursor.execute(sql)
        row_count = cursor.rowcount
        print(f"✅ Success! Deleted {row_count} duplicate channels in one pass.")

if __name__ == "__main__":
    turbo_clean()
