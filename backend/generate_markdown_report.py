#!/usr/bin/env python3
import json
import sys
from collections import defaultdict

def generate_markdown(file_path):
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
            
        print("# Non-Working Channels Catalogue\n")
        print(f"Total Failures: {len(data)}\n")
        
        # Group by category
        by_category = defaultdict(list)
        for item in data:
            by_category[item['category']].append(item)
            
        # Sort categories by failure count descending
        sorted_cats = sorted(by_category.items(), key=lambda x: len(x[1]), reverse=True)
        
        for category, items in sorted_cats:
            print(f"## {category} ({len(items)} failures)")
            print("| Name | Error | URL |")
            print("| :--- | :--- | :--- |")
            
            # Show first 50 items per category to stay within token limits
            for item in items[:50]:
                name = item['name'].replace('|', '/')
                error = item['status']
                url = item['url'] if item['url'] else "N/A"
                print(f"| {name} | {error} | {url} |")
            
            if len(items) > 50:
                print(f"\n*...and {len(items) - 50} more in this category.*")
            print("\n")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    if len(sys.argv) > 1:
        generate_markdown(sys.argv[1])
    else:
        print("Usage: python generate_markdown_report.py <report_file>")
