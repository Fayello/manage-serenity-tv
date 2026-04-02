import os, sys, django, inspect
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.views import ChannelViewSet, SeriesViewSet

print('--- ChannelViewSet.categories ---')
try:
    print(inspect.getsource(ChannelViewSet.categories))
except Exception as e:
    print(f'Error: {e}')

print('\n--- SeriesViewSet.categories ---')
try:
    print(inspect.getsource(SeriesViewSet.categories))
except Exception as e:
    print(f'Error: {e}')

print('\n--- ChannelViewSet.list (queryset) ---')
# Print a snippet of get_queryset
try:
    print(inspect.getsource(ChannelViewSet.get_queryset))
except Exception as e:
    print(f'Error: {e}')
