#!/usr/bin/env python3
import json
import csv
import sys

def csv_report(file_path):
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
            
        with open('/app/non_working_channels.csv', 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['Category', 'Name', 'Error'])
            for item in data:
                writer.writerow([item['category'], item['name'], item['status']])
                
        print(f"Generated CSV with {len(data)} entries.")
        
        # Also print first 1000 for the AI to include in artifact
        print("--- FIRST 1000 ENTRIES ---")
        for item in data[:1000]:
            print(f"{item['category']} | {item['name']} | {item['status']}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    if len(sys.argv) > 1:
        csv_report(sys.argv[1])
    else:
        print("Usage: python generate_csv_report.py <report_file>")
