import os
import sys
import django

# Set up Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Channel

adult_channels = [
    # English Adult
    {"name": "PLAYBOY TV HD", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111816.m3u8", "category": "Adult (+18)", "country": "USA", "language": "English"},
    {"name": "HUSTLER TV", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111817.m3u8", "category": "Adult (+18)", "country": "USA", "language": "English"},
    {"name": "BRAZZERS TV TV", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111818.m3u8", "category": "Adult (+18)", "country": "USA", "language": "English"},
    {"name": "REALITY KINGS", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111819.m3u8", "category": "Adult (+18)", "country": "USA", "language": "English"},
    {"name": "X-MO", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111820.m3u8", "category": "Adult (+18)", "country": "USA", "language": "English"},
    {"name": "BABES TV", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111821.m3u8", "category": "Adult (+18)", "country": "USA", "language": "English"},
    
    # French Adult
    {"name": "DORCEL TV", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111831.m3u8", "category": "Adult (+18)", "country": "France", "language": "French"},
    {"name": "DORCEL XXX", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111832.m3u8", "category": "Adult (+18)", "country": "France", "language": "French"},
    {"name": "LIBIDO TV", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111833.m3u8", "category": "Adult (+18)", "country": "France", "language": "French"},
    {"name": "JACQUIE & MICHEL TV", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111834.m3u8", "category": "Adult (+18)", "country": "France", "language": "French"},
    {"name": "PENTHOUSE FR", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111836.m3u8", "category": "Adult (+18)", "country": "France", "language": "French"},
    {"name": "PINK X", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111837.m3u8", "category": "Adult (+18)", "country": "France", "language": "French"},
    
    # Global Adult
    {"name": "XXX 1", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111838.m3u8", "category": "Adult (+18)", "country": "Global", "language": "International"},
    {"name": "XXX 2", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111839.m3u8", "category": "Adult (+18)", "country": "Global", "language": "International"},
    {"name": "XXX 3", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111840.m3u8", "category": "Adult (+18)", "country": "Global", "language": "International"},
    {"name": "BLUE HUSTLER", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111841.m3u8", "category": "Adult (+18)", "country": "Global", "language": "International"},
    {"name": "PASSION XXX", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111842.m3u8", "category": "Adult (+18)", "country": "Global", "language": "International"},
    {"name": "SCT", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111843.m3u8", "category": "Adult (+18)", "country": "Global", "language": "International"},
    {"name": "SEXYSAT", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111844.m3u8", "category": "Adult (+18)", "country": "Global", "language": "International"},
    {"name": "VIVID TV", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111845.m3u8", "category": "Adult (+18)", "country": "Global", "language": "International"},
]

for c_data in adult_channels:
    channel, created = Channel.objects.get_or_create(
        stream_url=c_data['url'],
        defaults={
            'name': c_data['name'],
            'category': c_data['category'],
            'country': c_data['country'],
            'language': c_data['language'],
            'is_active': True
        }
    )
    if created:
        print(f"Created: {c_data['name']}")
    else:
        # Update existing
        channel.name = c_data['name']
        channel.category = c_data['category']
        channel.country = c_data['country']
        channel.language = c_data['language']
        channel.is_active = True
        channel.save()
        print(f"Updated: {c_data['name']}")

print("All Adult channels added/updated in the backend.")
