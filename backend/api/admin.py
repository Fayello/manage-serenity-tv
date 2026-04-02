from django.contrib import admin
from .models import AdminUser, Payment, ActivationCode, Device, License

@admin.register(AdminUser)
class AdminUserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'role', 'is_staff')

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('payment_reference', 'amount', 'plan_type', 'status', 'created_at')
    list_filter = ('status', 'plan_type')

@admin.register(ActivationCode)
class ActivationCodeAdmin(admin.ModelAdmin):
    list_display = ('code', 'plan_duration_days', 'status', 'generated_at')
    list_filter = ('status',)

@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ('fingerprint', 'model', 'os_version', 'first_seen')

@admin.register(License)
class LicenseAdmin(admin.ModelAdmin):
    list_display = ('device', 'activation_code', 'expiry_date', 'is_active')
