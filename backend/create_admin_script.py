import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'serenity_tv.settings')
django.setup()

from api.models import AdminUser

username = "Fayell"
password = "Nellou962@"
role = AdminUser.Role.SUPERADMIN

if not AdminUser.objects.filter(username=username).exists():
    user = AdminUser.objects.create_superuser(username=username, password=password)
    user.role = role
    user.save()
    print(f"Superuser '{username}' created successfully.")
else:
    print(f"Superuser '{username}' already exists. Updating role to SUPERADMIN.")
    user = AdminUser.objects.get(username=username)
    user.role = role
    user.set_password(password)
    user.save()
    print(f"Superuser '{username}' updated successfully.")
