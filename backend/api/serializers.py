from rest_framework import serializers
from .models import Payment, ActivationCode, Device, License, AdminUser, Channel, Playlist, AuditLog, Series

class AdminUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = AdminUser
        fields = ['id', 'username', 'email', 'password', 'role']

    def create(self, validated_data):
        user = AdminUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            role=validated_data.get('role', AdminUser.Role.SUPPORT)
        )
        return user

class ActivationCodeSerializer(serializers.ModelSerializer):
    payment_reference = serializers.ReadOnlyField(source='payment.payment_reference')
    
    class Meta:
        model = ActivationCode
        fields = ['id', 'code', 'plan_duration_days', 'status', 'generated_at', 'used_at', 'payment_reference', 'client_reference']

class PaymentSerializer(serializers.ModelSerializer):
    activation_code = ActivationCodeSerializer(read_only=True)
    
    class Meta:
        model = Payment
        fields = ['id', 'user_phone_number', 'payment_reference', 'amount', 'currency', 
                  'plan_type', 'status', 'created_at', 'confirmed_at', 'activation_code']
        read_only_fields = ['status', 'confirmed_at', 'confirmed_by']

class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = ['fingerprint', 'model', 'os_version', 'trial_start_date', 'trial_used', 'first_seen', 'last_seen', 'last_ip', 'user_agent']

class AuditLogSerializer(serializers.ModelSerializer):
    admin_username = serializers.ReadOnlyField(source='user.username')
    
    class Meta:
        model = AuditLog
        fields = ['id', 'admin_username', 'action', 'resource_type', 'resource_id', 'ip_address', 'details', 'timestamp']

class LicenseSerializer(serializers.ModelSerializer):
    device = serializers.ReadOnlyField(source='device.fingerprint')
    activation_code = serializers.ReadOnlyField(source='activation_code.code')

    class Meta:
        model = License
        fields = ['id', 'device', 'activation_code', 'start_date', 'expiry_date', 'is_active', 'revoked_reason']

class SeriesSerializer(serializers.ModelSerializer):
    episode_count = serializers.IntegerField(source='episodes.count', read_only=True)
    
    class Meta:
        model = Series
        fields = ['id', 'title', 'description', 'logo_url', 'category', 'country', 'language', 'episode_count']

class PlaylistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Playlist
        fields = ['id', 'name', 'description', 'm3u_url', 'is_active', 'is_default']

class ChannelSerializer(serializers.ModelSerializer):
    series_title = serializers.ReadOnlyField(source='series.title')

    class Meta:
        model = Channel
        fields = ['id', 'name', 'stream_url', 'logo_url', 'category', 'country', 'language', 
                  'series', 'series_title', 'season', 'episode', 'series_name']

# Input Serializers

class DeviceRegisterSerializer(serializers.Serializer):
    device_hash = serializers.CharField(max_length=255)
    model = serializers.CharField(max_length=100)
    os_version = serializers.CharField(max_length=50)

class LicenseActivateSerializer(serializers.Serializer):
    device_hash = serializers.CharField(max_length=255)
    code = serializers.CharField(max_length=20)
