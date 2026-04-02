import os
import sys
import django

sys.path.insert(0, '/home/mellou/serenity-tv/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Channel

def classify_existing():
    channels = Channel.objects.all()
    count_eng = 0
    count_fr = 0
    
    print("Starting classification of African Movies...")
    
    for c in channels:
        old_cat = c.category
        new_cat = old_cat
        
        name_lower = c.name.lower()
        # Country might not be reliable if not set, but let's try
        # Data in DB might have 'country' field set to 'International' often if not parsed right.
        # But import_m3u.py parses country_code into 'country' field? 
        # Wait, model has `country` field (Char), but parser had `country_code`.
        # The parser put 'Cameroon' or 'International' into the country field.
        # So we must rely mostly on Name analysis for now unless we re-parse source.
        
        # Keywords
        is_nollywood = 'nollywood' in name_lower or 'africa magic' in name_lower or 'iroko' in name_lower or 'nigeria' in name_lower
        is_ghana = 'ghana' in name_lower
        is_cameroon = 'cameroon' in name_lower or 'crtv' in name_lower or 'canal 2' in name_lower
        
        if is_nollywood or is_ghana:
            new_cat = "Movies - African (English)"
        elif is_cameroon:
            if 'movie' in name_lower or 'film' in name_lower or 'cinema' in name_lower:
                new_cat = "Movies - African (French)"
            else:
                # Keep as Cameroon or whatever it was
                continue # Skip if just general Cameroon
        
        # Broad checks
        if 'startimes' in name_lower and 'novelas' in name_lower:
             new_cat = "Movies - African (French)"
             
        if new_cat != old_cat:
            c.category = new_cat
            c.save()
            if "English" in new_cat:
                count_eng += 1
            else:
                count_fr += 1
                
    print(f"Update Complete.\n  English: {count_eng}\n  French: {count_fr}")

if __name__ == '__main__':
    classify_existing()
