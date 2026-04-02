import os, sys, django
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Channel, Series

COUNTRIES = [
    'Albania', 'Andorra', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 
    'Belarus', 'Belgium', 'Bosnia and Herzegovina', 'Brazil', 'Bulgaria', 'Cameroon', 
    'Canada', 'Chad', 'Chile', 'China', 'Costa Rica', 'Croatia', 'Cyprus', 'Czech Republic', 
    'Denmark', 'Egypt', 'Estonia', 'Faroe Islands', 'Finland', 'France', 'Georgia', 
    'Germany', 'Greece', 'Greenland', 'Hong Kong', 'Hungary', 'India', 'Indonesia', 
    'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Japan', 'Korea', 'Kosovo', 'Latvia', 
    'Luxembourg', 'Macau', 'Malta', 'Mexico', 'Moldova', 'Monaco', 'Montenegro', 
    'Netherlands', 'North Korea', 'North Macedonia', 'Norway', 'Paraguay', 'Peru', 
    'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'San Marino', 'Saudi Arabia', 
    'Serbia', 'Slovakia', 'Slovenia', 'Somalia', 'Spain', 'Sweden', 'Switzerland', 
    'Taiwan', 'Trinidad', 'Turkey', 'UK', 'Ukraine', 'United Arab Emirates', 'USA', 'Venezuela'
]

def cleanup():
    print("Starting Thorough Database Cleanup...")
    # Update Channels
    channels = Channel.objects.filter(category__in=COUNTRIES, is_active=True)
    count = channels.count()
    channels.update(category='General')
    print(f"Updated {count} Channels where category was a known country.")

    # Update Series
    series = Series.objects.filter(category__in=COUNTRIES, is_active=True)
    count_s = series.count()
    series.update(category='General')
    print(f"Updated {count_s} Series where category was a known country.")
    
    # Custom fixes
    Channel.objects.filter(category__icontains='VOD').update(category='Movies')
    Channel.objects.filter(category='日本 / Japan').update(category='General')

if __name__ == "__main__":
    cleanup()
