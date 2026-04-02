from rest_framework import permissions

class IsSuperAdmin(permissions.BasePermission):
    """
    Allows access only to superusers or users with SUPERADMIN role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and 
                    (request.user.is_superuser or request.user.role == 'SUPERADMIN'))

class IsSupport(permissions.BasePermission):
    """
    Allows access to support staff and superadmins.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and 
                    (request.user.is_superuser or request.user.role in ['SUPERADMIN', 'SUPPORT']))
