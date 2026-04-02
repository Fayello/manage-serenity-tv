import os
import re

FILE_PATH = '/app/api/views.py'
CORE_GENRES = [
    'French TV', 'English TV', 'Movies', 'Sports', 'Anime', 
    'News', 'Music', 'Kids', 'World TV', 'Religious', 'Documentary', 'Novelas', 'Adult (+18)'
]

def patch_views():
    if not os.path.exists(FILE_PATH):
        print(f"Error: {FILE_PATH} not found")
        return

    with open(FILE_PATH, 'r') as f:
        content = f.read()

    # 1. Define CORE_GENRES inside the file (at the top or inside the class)
    if 'CORE_GENRES =' not in content:
        # Insert after imports
        content = content.replace('from rest_framework.decorators import action', 
                                f'from rest_framework.decorators import action\n\nCORE_GENRES = {CORE_GENRES}')

    # 2. Modify the categories method
    # Pattern to find the categories method
    pattern = r'(@action\(detail=False, methods=\[\'get\'\]\)\s+def categories\(self, request\):)(.*?)(\n\s+return Response\(list\(filter\(None, cats\)\)\))'
    
    # We want to replace the logic inside to filter by CORE_GENRES
    replacement = r'\1\n        cats = Channel.objects.filter(is_active=True).values_list("category", flat=True).distinct().order_by("category")\n        # SOLID FILTERing for Web & Mobile\n        filtered_cats = [c for c in cats if c in CORE_GENRES or ((" FR" in c or " EN" in c) and c.strip())]\n        return Response(filtered_cats)'

    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

    if new_content == content:
        print("Warning: Pattern not found or already patched")
    else:
        with open(FILE_PATH, 'w') as f:
            f.write(new_content)
        print("Successfully patched api/views.py with Solid filtering!")

if __name__ == "__main__":
    patch_views()
