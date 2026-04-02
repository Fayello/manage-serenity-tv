#!/usr/bin/env python3
import os
import sys
import django
import json

# Setup Django
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Channel

FAILURE_REPORT = "/app/channel_audit_failures_ultra_600s.json"

def verify():
    if not os.path.exists(FAILURE_REPORT):
        print("ERROR: Failure manifest not found on server.")
        return

    with open(FAILURE_REPORT, 'r') as f:
        failed_channels = json.load(f)

    dead_ids = [c['id'] for c in failed_channels]
    
    # Check if any of these IDs still exist
    still_existing = Channel.objects.filter(id__in=dead_ids).count()
    total_remaining = Channel.objects.all().count()

    print(f"VERIFICATION RESULTS:")
    print(f"---------------------")
    print(f"Targeted for deletion: {len(dead_ids)}")
    print(f"Still in database:     {still_existing} (Should be 0)")
    print(f"Total functional left: {total_remaining}")
    
    if still_existing == 0:
        print("\nCONFIRMED: All void channels have been permanently purged.")
    else:
        print("\nWARNING: Some channels still remain.")

if __name__ == '__main__':
    verify()
