import os
import sys
import django

# Set up Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Channel

channels_to_add = [
    # English Sports
    {"name": "TNT SPORTS 1 FHD", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/52437.m3u8", "category": "Sports EN", "country": "UK", "language": "English"},
    {"name": "TNT SPORTS 2 HD", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/52440.m3u8", "category": "Sports EN", "country": "UK", "language": "English"},
    {"name": "BT Sport 1 SD", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/50770.m3u8", "category": "Sports EN", "country": "UK", "language": "English"},
    {"name": "BT Sport 2 SD", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/50771.m3u8", "category": "Sports EN", "country": "UK", "language": "English"},
    {"name": "BT Sport 3 SD", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/50772.m3u8", "category": "Sports EN", "country": "UK", "language": "English"},
    {"name": "BT Sport ESPN HD", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/50769.m3u8", "category": "Sports EN", "country": "UK", "language": "English"},
    {"name": "SuperSport Football", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111826.m3u8", "category": "Sports EN", "country": "Africa", "language": "English"},
    {"name": "SuperSport Premier League", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111824.m3u8", "category": "Sports EN", "country": "Africa", "language": "English"},
    {"name": "SuperSport Grandstand", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111822.m3u8", "category": "Sports EN", "country": "Africa", "language": "English"},
    {"name": "Flow Sports 1 HD", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/52403.m3u8", "category": "Sports EN", "country": "Caribbean", "language": "English"},
    {"name": "RUSH Sports 1 HD", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/52408.m3u8", "category": "Sports EN", "country": "Caribbean", "language": "English"},
    {"name": "beIN SPORTS (English)", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/110259.m3u8", "category": "Sports EN", "country": "Malaysia", "language": "English"},
    
    # French Sports
    {"name": "CANAL+ FOOT", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111813.m3u8", "category": "Sports FR", "country": "France", "language": "French"},
    {"name": "CANAL+", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111812.m3u8", "category": "Sports FR", "country": "France", "language": "French"},
    {"name": "CANAL+ SPORT", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111814.m3u8", "category": "Sports FR", "country": "France", "language": "French"},
    {"name": "RMC SPORT 1", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111815.m3u8", "category": "Sports FR", "country": "France", "language": "French"},
    {"name": "BLUE SPORT 1 HD", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/110831.m3u8", "category": "Sports FR", "country": "Switzerland", "language": "French"},
    {"name": "SuperSport MáXimo (Includes FR)", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111835.m3u8", "category": "Sports FR", "country": "Africa", "language": "French"},
    
    # UEFA Match Feeds
    {"name": "UEFA Match Day 1", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111797.m3u8", "category": "Sports", "country": "International", "language": "International"},
    {"name": "UEFA Match Day 2", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111798.m3u8", "category": "Sports", "country": "International", "language": "International"},
    {"name": "UEFA Match Day 3", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111799.m3u8", "category": "Sports", "country": "International", "language": "International"},
    {"name": "UEFA Match Day 4", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111800.m3u8", "category": "Sports", "country": "International", "language": "International"},
    {"name": "UEFA Match Day 5", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111801.m3u8", "category": "Sports", "country": "International", "language": "International"},
    {"name": "UEFA Match Day 6", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111802.m3u8", "category": "Sports", "country": "International", "language": "International"},
    {"name": "UEFA Match Day 7", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111803.m3u8", "category": "Sports", "country": "International", "language": "International"},
    {"name": "UEFA Match Day 8", "url": "http://iptv-line.com:7899/live/thomasdj19821/vODCWh1y/111804.m3u8", "category": "Sports", "country": "International", "language": "International"},
]

for c_data in channels_to_add:
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

print("All UEFA channels added/updated in the backend.")
