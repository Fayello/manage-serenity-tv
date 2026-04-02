#!/usr/bin/env python3
import json
import sys
from collections import Counter

def summarize(file_path):
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
            
        total = len(data)
        print(f"--- FAILURES SUMMARY ({total} channels) ---")
        
        # Count by category
        cat_counts = Counter([item['category'] for item in data])
        print("\nFailures per Category (Top 10):")
        for cat, count in cat_counts.most_common(10):
            print(f"  {cat}: {count}")
            
        # Count by error type
        err_counts = Counter([item['status'] for item in data])
        print("\nFailures per Error Type:")
        for err, count in err_counts.most_common():
            print(f"  {err}: {count}")
            
        # Sample of 20 failures
        print("\nDetailed Sample of Non-Working Channels:")
        for item in data[:20]:
            print(f"  - [{item['category']}] {item['name']} (Error: {item['status']})")
            
    except Exception as e:
        print(f"Error reading report: {e}")

if __name__ == '__main__':
    if len(sys.argv) > 1:
        summarize(sys.argv[1])
    else:
        print("Usage: python summarize_audit.py <report_file>")
