import os
import sys

# Setup environment before ANY django/rest_framework imports
sys.path.append('/home/mellou/serenity-tv/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from rest_framework.test import APIClient

def test_channels_api():
    client = APIClient()
    # Use the UUID and page reported by the user
    playlist_id = 'b961cd0b-d25a-4b0c-a6f0-f4c67ba55954'
    url = f'/api/channels/?playlist={playlist_id}&page=1'
    
    print(f"Testing URL: {url}")
    try:
        response = client.get(url)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 500:
            print("REPRODUCED 500 ERROR!")
            # Try to get traceback if possible, though APIClient might catch it
            # If it's a 500, response.data might contain error details if DEBUG=True
            print("Response Data:", response.data if hasattr(response, 'data') else "No data")
        else:
            print("Response Status not 500. Result:", response.status_code)
    except Exception as e:
        print("Exception during request:")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_channels_api()
