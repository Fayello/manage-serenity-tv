#!/usr/bin/env python3
import os
import sys
import django
from django.db.models import Q

# Setup Django
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Channel

def get_stats():
    total = Channel.objects.count()
    
    # French Deep Search
    french = Channel.objects.filter(
        Q(name__icontains=' FR ') | 
        Q(name__icontains='FR:') | 
        Q(name__icontains='FR|') |
        Q(name__icontains='FR-') |
        Q(name__icontains='(FR)') |
        Q(name__icontains='[FR]') |
        Q(country__icontains='FR') |
        Q(category__icontains='FR')
    ).count()

    # English Deep Search
    english = Channel.objects.filter(
        Q(name__icontains=' EN ') | 
        Q(name__icontains='EN:') | 
        Q(name__icontains='EN|') |
        Q(name__icontains='EN-') |
        Q(name__icontains='(EN)') |
        Q(name__icontains='[EN]') |
        Q(name__icontains=' US ') |
        Q(name__icontains='UK ') |
        Q(country__icontains='US') |
        Q(country__icontains='UK') |
        Q(category__icontains='EN') |
        Q(category__icontains='US') |
        Q(category__icontains='UK')
    ).count()
    
    # Anime Deep Search
    anime = Channel.objects.filter(
        Q(name__icontains='Anime') | 
        Q(name__icontains='Manga') | 
        Q(category__icontains='Anime') |
        Q(category__icontains='Animation') |
        Q(name__icontains='Toon')
    ).count()

    print(f"TOTAL: {total}")
    print(f"FRENCH_DETECTED: {french}")
    print(f"ENGLISH_DETECTED: {english}")
    print(f"ANIME_DETECTED: {anime}")

if __name__ == '__main__':
    get_stats()
