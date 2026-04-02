#!/usr/bin/env python3
import os
import sys
import django
import json
from datetime import datetime

# Setup Django
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Channel

FAILURE_REPORT = "/app/channel_audit_failures_ultra_600s.json"

def log_message(message):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")

def cleanup_channels():
    if not os.path.exists(FAILURE_REPORT):
        log_message(f"ERROR: {FAILURE_REPORT} not found. Aborting cleanup.")
        return

    log_message(f"Loading dead channel manifest from {FAILURE_REPORT}...")
    with open(FAILURE_REPORT, 'r') as f:
        failed_channels = json.load(f)

    dead_ids = [c['id'] for c in failed_channels]
    total_to_delete = len(dead_ids)

    log_message(f"Found {total_to_delete} channels marked for deletion.")

    if total_to_delete == 0:
        log_message("No channels to delete. Exit.")
        return

    # Delete in batches to avoid locking the DB for too long if needed, 
    # but Django's delete() with filter(id__in=...) is usually OK for 3-4k records.
    try:
        deleted_count, _ = Channel.objects.filter(id__in=dead_ids).delete()
        log_message(f"SUCCESS: Permanently deleted {deleted_count} channels from the database.")
    except Exception as e:
        log_message(f"ERROR during deletion: {str(e)}")

if __name__ == '__main__':
    cleanup_channels()
