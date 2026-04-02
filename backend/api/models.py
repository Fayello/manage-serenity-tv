from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid

class AdminUser(AbstractUser):
    class Role(models.TextChoices):
        SUPERADMIN = 'SUPERADMIN', 'Super Admin'
        SUPPORT = 'SUPPORT', 'Support'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.SUPPORT)

class Payment(models.Model):
    class PlanType(models.TextChoices):
        ONE_YEAR = '1_YEAR', '1 Year'
        THREE_YEARS = '3_YEARS', '3 Years'
    
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        REJECTED = 'REJECTED', 'Rejected'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_phone_number = models.CharField(max_length=20)
    payment_reference = models.CharField(max_length=100, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='CFA')
    plan_type = models.CharField(max_length=10, choices=PlanType.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    confirmed_by = models.ForeignKey(AdminUser, on_delete=models.SET_NULL, null=True, blank=True)

class ActivationCode(models.Model):
    class Status(models.TextChoices):
        UNUSED = 'UNUSED', 'Unused'
        USED = 'USED', 'Used'
        REVOKED = 'REVOKED', 'Revoked'

    code = models.CharField(max_length=20, unique=True)
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name='activation_code', null=True, blank=True)
    plan_duration_days = models.IntegerField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.UNUSED)
    generated_at = models.DateTimeField(auto_now_add=True)
    used_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    client_reference = models.CharField(max_length=100, null=True, blank=True, help_text="Manual reference for client identification")

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = self.generate_unique_code()
        if not self.expires_at:
            from django.utils import timezone
            from datetime import timedelta
            self.expires_at = timezone.now() + timedelta(days=7)
        super().save(*args, **kwargs)

    @staticmethod
    def generate_unique_code():
        import random
        import string
        chars = string.ascii_uppercase + string.digits
        def segment(): return ''.join(random.choices(chars, k=4))
        return f"{segment()}-{segment()}-{segment()}-{segment()}"

class Device(models.Model):
    fingerprint = models.CharField(max_length=255, primary_key=True)
    model = models.CharField(max_length=100)
    os_version = models.CharField(max_length=50)
    last_ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    first_seen = models.DateTimeField(auto_now_add=True)
    last_seen = models.DateTimeField(auto_now=True)
    trial_start_date = models.DateTimeField(null=True, blank=True)
    trial_used = models.BooleanField(default=False)

class License(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='licenses')
    activation_code = models.OneToOneField(ActivationCode, on_delete=models.CASCADE)
    start_date = models.DateTimeField()
    expiry_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    revoked_reason = models.CharField(max_length=255, null=True, blank=True)

class Playlist(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    m3u_url = models.URLField(max_length=1000)
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

# --- THE NEW HIERARCHY ---

class Series(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    logo_url = models.URLField(max_length=2000, null=True, blank=True)
    category = models.CharField(max_length=50, default="Series")
    country = models.CharField(max_length=50, default="International")
    language = models.CharField(max_length=50, default="Unknown")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    class Meta:
        verbose_name_plural = "Series"

class Channel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    playlist = models.ForeignKey(Playlist, on_delete=models.CASCADE, related_name='channels', null=True, blank=True)
    name = models.CharField(max_length=100)
    stream_url = models.URLField(max_length=2000, unique=True) # Prevent duplicates at DB level
    logo_url = models.URLField(max_length=2000, null=True, blank=True)
    category = models.CharField(max_length=50, default="General")
    country = models.CharField(max_length=50, default="International")
    language = models.CharField(max_length=50, default="Unknown") # New: for Mixed Language issue
    
    # Optional Link to Series (VOD content)
    series = models.ForeignKey(Series, on_delete=models.CASCADE, related_name='episodes', null=True, blank=True)
    season = models.IntegerField(null=True, blank=True)
    episode = models.IntegerField(null=True, blank=True)
    
    # Legacy field (will migrate to Series/FK)
    series_name = models.CharField(max_length=200, null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.country})"

# --- LOGGING & ANALYTICS ---

class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(AdminUser, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=100)
    resource_type = models.CharField(max_length=50)
    resource_id = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    details = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

class ChannelView(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    channel = models.ForeignKey(Channel, on_delete=models.CASCADE, related_name='views')
    device = models.ForeignKey(Device, on_delete=models.SET_NULL, related_name='views', null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    duration = models.IntegerField(default=0)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    country = models.CharField(max_length=100, null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['channel']),
        ]
