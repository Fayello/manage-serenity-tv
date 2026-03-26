#!/usr/bin/env python3
import os
import sys
import django
import re

# Setup Django
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Channel, Series

# Configuration
FRANCOPHONE_COUNTRIES = [
    'France', 'Cameroon', 'Senegal', 'Ivory Coast', 'Cote d\'Ivoire', 
    'Mali', 'Gabon', 'Togo', 'Benin', 'Niger', 'Chad', 'Congo', 
    'Burkina Faso', 'Guinea', 'Madagascar', 'Belgium', 'Switzerland', 
    'Algeria', 'Morocco', 'Tunisia', 'DRC'
]

FRENCH_KEYWORDS = [
    'tf1', 'france 2', 'france 3', 'france 4', 'france 5', 'm6', 'c8', 'w9', 
    'tmc', 'tfx', 'nrj12', 'lcp', 'franceinfo', 'bfm', 'cnews', 'gulli', 
    'canal+', 'ocs', 'cine+', 'beinsport fr', 'rmc sport', 'rtl9', 'ab1', 
    'equinoxe', 'crtv', 'stv', 'cam10', 'canal 2', 'vision 4', 'stv2'
]

ENGLISH_KEYWORDS = [
    'bbc', 'cnn', 'fox', 'abc', 'cbs', 'nbc', 'sky', 'discovery', 'nat geo',
    'hbo', 'showtime', 'espn', 'tnt', 'amc', 'mtv', 'vh1'
]

def recategorize():
    # 1. Channels (Live TV)
    channels = Channel.objects.all()
    print(f"Executing SOLID Audit & Migration for {channels.count()} channels...")
    
    updated_channels = 0
    for c in channels:
        name_lower = c.name.lower()
        cat_lower = c.category.lower()
        country_lower = c.country.lower()
        lang_lower = c.language.lower()
        
        old_cat = c.category
        new_cat = old_cat

        # 1. ANIME
        if any(k in name_lower or k in cat_lower for k in ['anime', 'manga', 'j-one', 'animation', 'mangos']):
            new_cat = "Anime"
        
        # 2. FRENCH
        elif (
            any(k in name_lower for k in FRENCH_KEYWORDS) or
            any(c_name.lower() in country_lower for c_name in FRANCOPHONE_COUNTRIES) or
            any(k in cat_lower for k in ['fr:', 'fr ', '|fr|', '(fr)', '[fr]', 'francais', 'francaise', 'french']) or
            'fr' == lang_lower or 'french' == lang_lower
        ):
            if 'sport' in name_lower or 'sport' in cat_lower: new_cat = "Sports"
            elif any(k in name_lower or k in cat_lower for k in ['news', 'info']): new_cat = "News"
            else: new_cat = "French TV"

        # 3. ENGLISH
        elif (
            any(k in name_lower for k in ENGLISH_KEYWORDS) or
            any(c_name.lower() in country_lower for c_name in ['usa', 'uk', 'united kingdom', 'united states']) or
            any(k in cat_lower for k in ['en:', 'en ', '|en|', '(en)', '[en]', 'english', 'us:', 'uk:']) or
            'en' == lang_lower or 'english' == lang_lower
        ):
            if 'sport' in name_lower or 'sport' in cat_lower: new_cat = "Sports"
            elif any(k in name_lower or k in cat_lower for k in ['news', 'info']): new_cat = "News"
            else: new_cat = "English TV"

        # 4. OTHER GENRES
        elif 'novela' in name_lower or 'soap' in name_lower: new_cat = "Novelas"
        elif 'relig' in name_lower or 'bible' in cat_lower or 'église' in cat_lower: new_cat = "Religious"
        elif 'music' in name_lower or 'viva' in name_lower or 'mtv' in name_lower: new_cat = "Music"
        elif 'kids' in name_lower or 'kids' in cat_lower: new_cat = "Kids"
        elif any(k in name_lower or k in cat_lower for k in ['movie', 'cinema', 'film']): new_cat = "Movies"
        
        # 5. CONSOLIDATION
        CORE_GENRES = [
            'French TV', 'English TV', 'Movies', 'Sports', 'Anime', 
            'News', 'Music', 'Kids', 'World TV', 'Religious', 'Documentary', 'Novelas'
        ]
        
        if new_cat not in CORE_GENRES:
            new_cat = "World TV"

        if new_cat != old_cat:
            c.category = new_cat
            c.save()
            updated_channels += 1

    print(f"Channels Migration: {updated_channels} items updated.")

    # 2. Series (VOD / Cinema)
    series_items = Series.objects.all()
    print(f"Migrating {series_items.count()} Series to clean categories...")
    
    updated_series = 0
    for s in series_items:
        title_lower = s.title.lower()
        cat_lower = s.category.lower()
        
        old_cat = s.category
        new_cat = old_cat

        if any(k in title_lower or k in cat_lower for k in ['fr ', 'fr:', 'french', 'francaise', 'francais']):
            new_cat = "French TV"
        elif any(k in title_lower or k in cat_lower for k in ['en ', 'en:', 'english', 'us:', 'uk:']):
            new_cat = "English TV"
        elif any(k in title_lower or k in cat_lower for k in ['anime', 'manga']):
            new_cat = "Anime"
        else:
            new_cat = "Movies"

        if new_cat != old_cat:
            s.category = new_cat
            s.save()
            updated_series += 1

    print(f"Series Migration: {updated_series} items updated.")

if __name__ == '__main__':
    recategorize()
