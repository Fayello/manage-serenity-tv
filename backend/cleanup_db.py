import os, sys, django
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Channel, Series

def cleanup():
    print("Starting Database Cleanup...")
    # 1. Clean up typo
    Channel.objects.filter(category='Generally').update(category='General')
    
    # 2. For every channel where category == country, set to General
    # Using a list comprehension for efficiency if DB size is manageable, or distinct values
    from django.db.models import F
    channels = Channel.objects.filter(category__iexact=F('country'), is_active=True)
    count = channels.count()
    channels.update(category='General')
    print(f"Updated {count} Channels where category matched country.")

    # 3. Same for Series
    series = Series.objects.filter(category__iexact=F('country'), is_active=True)
    count_s = series.count()
    series.update(category='General')
    print(f"Updated {count_s} Series where category matched country.")

if __name__ == "__main__":
    cleanup()
