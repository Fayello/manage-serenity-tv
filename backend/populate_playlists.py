#!/usr/bin/env python3
"""
Populate database with multiple playlist sources
"""
import os
import sys
import django

sys.path.insert(0, '/home/mellou/serenity-tv/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Playlist

# Popular IPTV playlists from different sources
PLAYLISTS = [
    {
        'name': 'IPTV-ORG (Global)',
        'description': 'Comprehensive worldwide IPTV channels from iptv-org community',
        'm3u_url': 'https://iptv-org.github.io/iptv/index.m3u',
        'is_default': True
    },
    {
        'name': 'Free-TV (International)',
        'description': 'Comprehensive international free-to-air channels',
        'm3u_url': 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8',
        'is_default': False
    },
    {
        'name': 'News Channels',
        'description': 'Global news channels only',
        'm3u_url': 'https://iptv-org.github.io/iptv/categories/news.m3u',
        'is_default': False
    },
    {
        'name': 'Sports Channels',
        'description': 'Sports and live events',
        'm3u_url': 'https://iptv-org.github.io/iptv/categories/sports.m3u',
        'is_default': False
    },
    {
        'name': 'Movies & Series',
        'description': 'Movie and TV series channels',
        'm3u_url': 'https://iptv-org.github.io/iptv/categories/movies.m3u',
        'is_default': False
    },
    {
        'name': 'Music Channels',
        'description': 'Music videos and concerts',
        'm3u_url': 'https://iptv-org.github.io/iptv/categories/music.m3u',
        'is_default': False
    },
    {
        'name': 'Kids & Family',
        'description': 'Family-friendly and kids content',
        'm3u_url': 'https://iptv-org.github.io/iptv/categories/kids.m3u',
        'is_default': False
    },
]

def populate_playlists():
    print("Populating playlists...\n")
    
    # Clear existing playlists
    Playlist.objects.all().delete()
    print("Cleared existing playlists")
    
    for playlist_data in PLAYLISTS:
        playlist = Playlist.objects.create(**playlist_data)
        print(f"✅ Created: {playlist.name}")
    
    print(f"\n✅ Successfully created {len(PLAYLISTS)} playlists!")
    print("\nAvailable playlists:")
    for p in Playlist.objects.all():
        default = " (DEFAULT)" if p.is_default else ""
        print(f"  - {p.name}{default}")
        print(f"    {p.description}")

if __name__ == '__main__':
    populate_playlists()
