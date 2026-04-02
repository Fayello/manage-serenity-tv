#!/usr/bin/env python3
import os
import sys
import django
import json
import asyncio
import aiohttp
from datetime import datetime

# Setup Django
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
os.environ["DJANGO_ALLOW_ASYNC_QUERY"] = "true"
django.setup()

from api.models import Channel

LOG_FILE = "/app/health_audit.log"
INPUT_REPORT_PREF = "/app/channel_audit_failures_refined_120s.json"
INPUT_REPORT_FALLBACK = "/app/channel_audit_failures.json"
OUTPUT_REPORT = "/app/channel_audit_failures_ultra_600s.json"
CONCURRENCY = 200 # Safer for extremely long waits
TIMEOUT = 600

def log_progress(message):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    msg = f"[{timestamp}] {message}\n"
    sys.stdout.write(msg)
    sys.stdout.flush()
    try:
        with open(LOG_FILE, "a") as f:
            f.write(msg)
    except Exception:
        pass

async def check_channel(session, semaphore, channel_dict):
    url = channel_dict.get('url') or channel_dict.get('stream_url')
    name = channel_dict['name']
    category = channel_dict['category']
    channel_id = str(channel_dict['id'])
    
    if not url:
        return {'id': channel_id, 'name': name, 'category': category, 'url': None, 'status': 'MISSING_URL', 'error': 'No URL'}
    
    async with semaphore:
        try:
            async with session.get(url, timeout=TIMEOUT, ssl=False) as response:
                if response.status < 400:
                    return None
                return {'id': channel_id, 'name': name, 'category': category, 'url': url, 'status': response.status, 'error': 'HTTP Error'}
        except asyncio.TimeoutError:
            return {'id': channel_id, 'name': name, 'category': category, 'url': url, 'status': 'TIMEOUT', 'error': 'Timed out after 10m'}
        except Exception as e:
            return {'id': channel_id, 'name': name, 'category': category, 'url': url, 'status': 'ERROR', 'error': str(e)}

async def run_audit():
    input_file = INPUT_REPORT_PREF
    if not os.path.exists(input_file):
        input_file = INPUT_REPORT_FALLBACK
        if not os.path.exists(input_file):
            log_progress(f"ERROR: No failure manifest found.")
            return

    log_progress(f"Loading failures from {input_file}...")
    with open(input_file, 'r') as f:
        failed_channels_data = json.load(f)
        
    total = len(failed_channels_data)
    log_progress(f"Starting ULTRA-DEEP audit of {total} failures (Timeout={TIMEOUT}s, Concurrency={CONCURRENCY})...")
    
    semaphore = asyncio.Semaphore(CONCURRENCY)
    connector = aiohttp.TCPConnector(limit=CONCURRENCY, ttl_dns_cache=300)
    
    async with aiohttp.ClientSession(connector=connector, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}) as session:
        tasks = [check_channel(session, semaphore, c) for c in failed_channels_data]
        
        results = []
        count = 0
        for task in asyncio.as_completed(tasks):
            res = await task
            count += 1
            if res:
                results.append(res)
            
            if count % 50 == 0 or count == total:
                log_progress(f"Progress: {count}/{total} checked... (Still Failing: {len(results)})")
                with open(OUTPUT_REPORT, 'w') as f:
                    json.dump(results, f, indent=2)
                    
    log_progress(f"ULTRA-DEEP AUDIT Complete! Final Failure Count (600s): {len(results)}")

if __name__ == '__main__':
    asyncio.run(run_audit())
