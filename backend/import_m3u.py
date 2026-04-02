#!/usr/bin/env python3
import os
import sys
import django
import requests
import re
from collections import Counter

sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Channel, Playlist, Series

# Configuration for Solid Categorization
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

def get_country_name(code):
    countries = {
        'CM': 'Cameroon', 'FR': 'France', 'US': 'USA', 'GB': 'UK', 'NG': 'Nigeria',
        'GH': 'Ghana', 'ES': 'Spain', 'MX': 'Mexico', 'CA': 'Canada', 'DE': 'Germany',
        'IT': 'Italy', 'BR': 'Brazil', 'AR': 'Argentina', 'CI': 'Ivory Coast', 'SN': 'Senegal',
        'BE': 'Belgium', 'CH': 'Switzerland', 'ZA': 'South Africa', 'KE': 'Kenya', 'IN': 'India'
    }
    if not code: return "International"
    return countries.get(code.upper(), code.upper())

def normalize_category(category_str, default_category, country_name=None):
    if not category_str or category_str == 'Undefined': return default_category
    if ';' in category_str: category_str = category_str.split(';')[0].strip()
    if country_name and category_str.lower() == country_name.lower(): return default_category
    return category_str.strip()

def detect_language(name, country_code, metadata_lang=None):
    if metadata_lang: return metadata_lang
    name_lower = name.lower()
    if '(en)' in name_lower or '[en]' in name_lower or 'english' in name_lower: return "English"
    if '(fr)' in name_lower or '[fr]' in name_lower or 'french' in name_lower or 'français' in name_lower: return "French"
    lang_map = {'FR': 'French', 'CM': 'French', 'CI': 'French', 'SN': 'French', 'US': 'English', 'GB': 'English', 'NG': 'English', 'GH': 'English'}
    return lang_map.get(country_code, "International")

def parse_m3u(url, default_category='General', limit=None, country_name=None):
    try:
        response = requests.get(url, timeout=60)
        response.raise_for_status()
        content = response.text
    except Exception: return []
    
    lines = content.strip().split('\n')
    channels, current_channel = [], {}
    
    for line in lines:
        line = line.strip()
        if line.startswith('#EXTINF:'):
            logo_url = (re.search(r'tvg-logo="([^"]*)"', line) or [None, None])[1]
            category = (re.search(r'group-title="([^"]*)"', line) or [None, default_category])[1]
            country_code = (re.search(r'tvg-country="([^"]*)"', line) or [None, ''])[1]
            
            # Detect country
            detected_country = get_country_name(country_code)
            if detected_country == "International" and country_name:
                country_display = country_name
            else:
                country_display = detected_country
            
            category = normalize_category(category, default_category, country_display)
            metadata_lang = (re.search(r'tvg-language="([^"]*)"', line) or [None, None])[1]
            name = (re.search(r',(.+)$', line) or [None, "Unknown"])[1].strip()
            language = detect_language(name, country_code, metadata_lang)
            
            # --- SOLID MULTI-LAYER CATEGORIZATION ---
            name_lower = name.lower()
            cat_lower = category.lower()
            country_lower = country_display.lower()
            lang_low = language.lower()

            # 1. ANIME
            if any(k in name_lower or k in cat_lower for k in ['anime', 'manga', 'j-one', 'animation']):
                category = "Anime"
            
            # 2. FRENCH (Language-First, not location-first)
            elif (
                any(k in name_lower for k in FRENCH_KEYWORDS) or
                any(c_name.lower() in country_lower for c_name in FRANCOPHONE_COUNTRIES) or
                any(k in cat_lower for k in ['fr:', 'fr ', '|fr|', '(fr)', '[fr]', 'francais', 'francaise', 'french']) or
                'french' in lang_low or 'fr' == lang_low
            ):
                if 'sport' in name_lower or 'sport' in cat_lower: category = "Sports FR"
                elif any(k in name_lower or k in cat_lower for k in ['news', 'info']): category = "News FR"
                elif any(k in name_lower or k in cat_lower for k in ['cinema', 'movie', 'film']): category = "Movies FR"
                else: category = "French TV"

            # 3. ENGLISH
            elif (
                any(k in name_lower for k in ENGLISH_KEYWORDS) or
                any(c_name.lower() in country_lower for c_name in ['usa', 'uk', 'united kingdom', 'united states']) or
                any(k in cat_lower for k in ['en:', 'en ', '|en|', '(en)', '[en]', 'english', 'us:', 'uk:']) or
                'english' in lang_low or 'en' == lang_low
            ):
                if 'sport' in name_lower or 'sport' in cat_lower: category = "Sports EN"
                elif any(k in name_lower or k in cat_lower for k in ['news', 'info']): category = "News EN"
                elif any(k in name_lower or k in cat_lower for k in ['cinema', 'movie', 'film']): category = "Movies EN"
                else: category = "English TV"

            # 4. GENERAL GENRES
            elif 'sport' in name_lower or 'sport' in cat_lower: category = "Sports"
            elif 'news' in name_lower or 'info' in cat_lower: category = "News"
            elif any(k in name_lower or k in cat_lower for k in ['cinema', 'movie', 'film']): category = "Movies"
            elif 'kid' in name_lower or 'enfant' in name_lower or 'toon' in name_lower or 'animation' in cat_lower: category = "Kids"
            elif 'music' in name_lower or 'mtv' in name_lower: category = "Music"
            
            # 5. WORLD TV CONSOLIDATION
            # If still a raw country name that isn't French or English
            elif any(c_val in cat_lower for c_val in ['italy', 'spain', 'germany', 'russia', 'china', 'japan', 'brazil']):
                category = "World TV"
            
            # Clean up name: remove tags like (720p), [EN], etc.
            name = re.sub(r'\s*\([\d]+p\)', '', name)
            name = re.sub(r'\s*\[.*?\]', '', name)
            name = name.strip()
            
            # --- VOD / SERIES DETECTION ---
            series_name, season, episode = None, None, None
            
            # Check for "Show Name S01 E01" or "Show Name 1x01"
            se_match = re.search(r'(.+?)\s+S(\d+)\s*E(\d+)', name, re.IGNORECASE)
            if not se_match: se_match = re.search(r'(.+?)\s+(\d+)x(\d+)', name, re.IGNORECASE)
            
            if se_match:
                series_name = se_match.group(1).strip(" -")
                season, episode = int(se_match.group(2)), int(se_match.group(3))
                if category == "General": category = "Series"
            else:
                series_name = None

            current_channel = {
                'name': name, 'logo_url': logo_url, 'category': category,
                'country_code': country_code, 'country_name': country_display,
                'language': language, 'series_name': series_name,
                'season': season, 'episode': episode
            }
        elif line and not line.startswith('#') and current_channel:
            current_channel['stream_url'] = line
            channels.append(current_channel)
            current_channel = {}
            if limit and len(channels) >= limit: break
    return channels

def import_all():
    playlists = list(Playlist.objects.filter(is_active=True))
    all_raw_channels = []
    
    print("Importing Cameroon...")
    all_raw_channels.extend(parse_m3u('https://iptv-org.github.io/iptv/countries/cm.m3u', country_name='Cameroon'))
    
    for playlist in playlists:
        print(f"Importing {playlist.name}...")
        all_raw_channels.extend(parse_m3u(playlist.m3u_url, country_name=playlist.name))

    seen_urls, unique_channels = set(), []
    for c in all_raw_channels:
        if c['stream_url'] not in seen_urls:
            seen_urls.add(c['stream_url'])
            unique_channels.append(c)
    
    if len(unique_channels) > 1000:
        Channel.objects.all().delete()
        Series.objects.all().delete()

    series_map = {} 
    for c in unique_channels:
        s_name = c['series_name']
        if s_name:
            if s_name not in series_map:
                series_map[s_name], _ = Series.objects.get_or_create(
                    title=s_name,
                    defaults={'category': c['category'], 'country': c['country_name'], 'language': c['language'], 'logo_url': c['logo_url']}
                )
            c['series_obj'] = series_map[s_name]

    to_create = []
    for c in unique_channels:
        to_create.append(Channel(
            playlist=None, name=c['name'][:100], stream_url=c['stream_url'],
            logo_url=c['logo_url'], category=c['category'][:50], country=c['country_name'],
            language=c['language'], series=c.get('series_obj'), season=c.get('season'),
            episode=c.get('episode'), series_name=c.get('series_name'), is_active=True
        ))
        if len(to_create) >= 500:
            Channel.objects.bulk_create(to_create, ignore_conflicts=True)
            to_create = []
    if to_create: Channel.objects.bulk_create(to_create, ignore_conflicts=True)
    print("Import Done!")

if __name__ == '__main__':
    import_all()
