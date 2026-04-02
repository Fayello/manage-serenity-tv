#!/usr/bin/env python3
import os
import sys
import django
import requests
import concurrent.futures

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Channel

def check_stream(channel):
    try:
        # Timeout lowered to 5s for speed
        response = requests.head(channel.stream_url, timeout=5, allow_redirects=True)
        if response.status_code >= 400:
             return (channel, False)
        return (channel, True)
    except:
        return (channel, False)

def clean_channels():
    print("Checking for dead channels...")
    channels = list(Channel.objects.filter(is_active=True))
    print(f"Total active channels: {len(channels)}")
    
    dead_count = 0
    to_update = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
        futures = [executor.submit(check_stream, c) for c in channels]
        
        for future in concurrent.futures.as_completed(futures):
            channel, is_alive = future.result()
            if not is_alive:
                print(f" [DEAD] {channel.name}")
                channel.category = "Offline"
                channel.is_active = False # Identify as inactive
                to_update.append(channel)
                dead_count += 1
                
    if to_update:
        print(f"Updating {len(to_update)} dead channels to 'Offline' category...")
        Channel.objects.bulk_update(to_update, ['category', 'is_active'])
        
    print(f"Done. Found {dead_count} dead channels.")

if __name__ == "__main__":
    clean_channels()
