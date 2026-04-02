from rest_framework import viewsets, status, permissions, filters
from rest_framework.pagination import PageNumberPagination
import os
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from datetime import timedelta
from django.shortcuts import get_object_or_404
from .models import Device, Payment, ActivationCode, License, AdminUser, Channel, Playlist, AuditLog, ChannelView, Series
from .serializers import (
    DeviceSerializer, DeviceRegisterSerializer,
    PaymentSerializer, LicenseActivateSerializer,
    ActivationCodeSerializer, LicenseSerializer, ChannelSerializer, PlaylistSerializer,
    AdminUserSerializer, AuditLogSerializer, SeriesSerializer
)
class ChannelPagination(PageNumberPagination):
    page_size = 200
    page_size_query_param = 'page_size'
    max_page_size = 1000
from .permissions import IsSuperAdmin, IsSupport
import jwt
from django.conf import settings

import re

def resolve_country(ip):
    """
    Resolves country from IP using ip-api.com (free, 45 requests/min).
    """
    if not ip or ip in ['127.0.0.1', 'localhost', '::1']:
        return "Internal"
    try:
        import json
        import urllib.request
        with urllib.request.urlopen(f"http://ip-api.com/json/{ip}?fields=status,message,country") as response:
            data = json.loads(response.read().decode())
            if data.get('status') == 'success':
                return data.get('country')
    except Exception as e:
        print(f"IP Geolocation failed: {e}")
    return "Unknown"

def parse_ua(ua_string):
    """
    Simple User-Agent parser to extract OS and Browser.
    """
    if not ua_string:
        return "Unknown", "Unknown"
    
    os_ver = "Unknown"
    browser = "Unknown"
    
    # OS Detection
    if "Windows" in ua_string:
        os_ver = "Windows"
        if "Windows NT 10.0" in ua_string: os_ver = "Windows 10/11"
        elif "Windows NT 6.3" in ua_string: os_ver = "Windows 8.1"
        elif "Windows NT 6.1" in ua_string: os_ver = "Windows 7"
    elif "Macintosh" in ua_string:
        os_ver = "macOS"
        mac_match = re.search(r'Mac OS X ([\d_]+)', ua_string)
        if mac_match: os_ver = f"macOS {mac_match.group(1).replace('_', '.')}"
    elif "Android" in ua_string:
        os_ver = "Android"
        and_match = re.search(r'Android ([\d.]+)', ua_string)
        if and_match: os_ver = f"Android {and_match.group(1)}"
    elif "Linux" in ua_string:
        os_ver = "Linux"
    elif "iPhone" in ua_string or "iPad" in ua_string:
        os_ver = "iOS"
        ios_match = re.search(r'OS ([\d_]+) like Mac', ua_string)
        if ios_match: os_ver = f"iOS {ios_match.group(1).replace('_', '.')}"

    # Browser Detection
    if "Edg/" in ua_string:
        browser = "Edge"
    elif "Chrome/" in ua_string and "Edg/" not in ua_string:
         browser = "Chrome"
         ver_match = re.search(r'Chrome/([\d]+)', ua_string)
         if ver_match: browser += f" {ver_match.group(1)}"
    elif "Firefox/" in ua_string:
        browser = "Firefox"
    elif "Safari/" in ua_string and "Chrome/" not in ua_string:
        browser = "Safari"
        
    return os_ver, browser

def get_client_ip(request):
    """
    Robustly extracts the real client IP address.
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        # X-Forwarded-For may contain a list: [client, proxy1, proxy2]
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        # Fallback to X-Real-IP (often set by Nginx)
        ip = request.META.get('HTTP_X_REAL_IP', request.META.get('REMOTE_ADDR', '')).strip()
    return ip

def log_action(user, action, resource_type, resource_id, request=None, details=None):
    ip = get_client_ip(request) if request else None
    
    AuditLog.objects.create(
        user=user,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id),
        ip_address=ip,
        details=details or {}
    )

# --- Public Views ---

class DeviceRegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = [] # Fix 403: Disable auth check for public endpoint

    def post(self, request):
        serializer = DeviceRegisterSerializer(data=request.data)
        if serializer.is_valid():
            device_hash = serializer.validated_data['device_hash']
            device, created = Device.objects.get_or_create(
                fingerprint=device_hash,
                defaults={
                    'model': serializer.validated_data['model'],
                    'os_version': serializer.validated_data['os_version']
                }
            )
            
            # Update metadata
            device.last_seen = timezone.now()
            
            # Capture IP and User-Agent
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                device.last_ip = x_forwarded_for.split(',')[0]
            else:
                device.last_ip = request.META.get('REMOTE_ADDR')
            
            device.user_agent = request.META.get('HTTP_USER_AGENT')
            device.save()

            # Check for existing valid license
            active_license = License.objects.filter(
                device=device, 
                is_active=True, 
                expiry_date__gt=timezone.now()
            ).first()

            if active_license:
                return Response({
                    "status": "license_active",
                    "expiry": active_license.expiry_date,
                    "message": "Device has active license"
                })

            # Trial Logic (Read-only here - manual start now required)
            if not device.trial_used:
                if device.trial_start_date:
                    # Check if trial period is active (3 days)
                    trial_end = device.trial_start_date + timedelta(days=3)
                    if timezone.now() < trial_end:
                        return Response({
                            "status": "trial_active",
                            "trial_expiry": trial_end,
                            "message": "Trial active"
                        })
                    else:
                        device.trial_used = True
                        device.save()
            
            return Response({
                "status": "locked",
                "message": "Please start your free trial or activate with a code."
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LicenseTrialStartView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = [] # Fix 403: Disable auth check for public endpoint

    def post(self, request):
        device_hash = request.data.get('device_hash')
        if not device_hash:
            return Response({"error": "device_hash required"}, status=status.HTTP_400_BAD_REQUEST)
        
        device = get_object_or_404(Device, fingerprint=device_hash)
        
        if device.trial_used:
            return Response({"error": "Trial period already used for this device"}, status=status.HTTP_400_BAD_REQUEST)
        
        if device.trial_start_date:
            return Response({"error": "Trial already started"}, status=status.HTTP_400_BAD_REQUEST)

        device.trial_start_date = timezone.now()
        device.save()
        
        trial_end = device.trial_start_date + timedelta(days=3)
        return Response({
            "status": "trial_active",
            "trial_expiry": trial_end,
            "message": "Trial started successfully"
        })

class LicenseActivateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LicenseActivateSerializer(data=request.data)
        if serializer.is_valid():
            code_str = serializer.validated_data['code']
            device_hash = serializer.validated_data['device_hash']

            # 1. Validate Device (Auto-create if missing for robustness)
            device, created = Device.objects.get_or_create(
                fingerprint=device_hash,
                defaults={'model': 'Web Player', 'os_version': 'Unknown'}
            )
            
            # Enrich Web Player Metadata
            if device.model == 'Web Player' or device.os_version == 'Unknown':
                 ua = request.META.get('HTTP_USER_AGENT', '')
                 os_meta, browser_meta = parse_ua(ua)
                 if browser_meta != 'Unknown':
                     device.model = f"Web Player ({browser_meta})"
                 if os_meta != 'Unknown':
                     device.os_version = os_meta
                 device.save()

            # 2. Validate Code
            try:
                activation_code = ActivationCode.objects.get(code__iexact=code_str)
            except ActivationCode.DoesNotExist:
                return Response({"error": "Invalid code"}, status=status.HTTP_400_BAD_REQUEST)

            if activation_code.status != ActivationCode.Status.UNUSED:
                # Soft Recovery Logic: Check if we can auto-migrate from a legacy "ghost" device
                if activation_code.status == ActivationCode.Status.USED:
                    existing_license = License.objects.filter(activation_code=activation_code, is_active=True).first()
                    if existing_license:
                        old_device = existing_license.device
                        old_fingerprint = old_device.fingerprint
                        
                        # Security: Only migrate if it looks like the specific buggy Web Player ID format
                        # 1. Format Check: 17 chars with colons (generated by old utils/device.js)
                        is_legacy_format = ':' in old_fingerprint and len(old_fingerprint) < 20
                        # 2. Scope Check: Only affect Web Players (avoid impacting Android/TV)
                        is_web_player = 'Web Player' in old_device.model or old_device.model == 'Unknown'
                        
                        if is_legacy_format and is_web_player:
                            # Perform Auto-Migration
                            existing_license.is_active = False
                            existing_license.revoked_reason = "Auto-Migrated to Stable Device"
                            existing_license.save()
                            
                            # Log the migration
                            log_action(
                                user=None,
                                action="LICENSE_MIGRATED",
                                resource_type="License",
                                resource_id=str(existing_license.id),
                                request=request,
                                details={"old_device": old_fingerprint, "new_device": device_hash}
                            )
                            # Proceed to create new license below (fall-through)
                        else:
                             return Response({"error": "Code already active on another valid device"}, status=status.HTTP_400_BAD_REQUEST)
                    else:
                        # Used but no active license? Allow reuse if really stuck, or fail safe.
                        # Ideally if expired, status check catches it. If revoked, we shouldn't be here.
                        # If USED but no license found (weird DB state), let's block to be safe unless logic strictly requires otherwise.
                        return Response({"error": "Code already used"}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    return Response({"error": "Code revoked or invalid"}, status=status.HTTP_400_BAD_REQUEST)

            if activation_code.expires_at and activation_code.expires_at < timezone.now():
                return Response({"error": "Code has expired"}, status=status.HTTP_400_BAD_REQUEST)

            # 3. Create License
            # Check for existing active license to chain/renew
            last_license = License.objects.filter(
                device=device,
                is_active=True
            ).order_by('-expiry_date').first()

            start_date = timezone.now()
            if last_license and last_license.expiry_date > start_date:
                start_date = last_license.expiry_date
            
            # Simple Duration Logic: Use exactly what's specified in the activation code
            expiry_date = start_date + timedelta(days=activation_code.plan_duration_days)

            license = License.objects.create(
                device=device,
                activation_code=activation_code,
                start_date=start_date,
                expiry_date=expiry_date,
                is_active=True
            )

            # 4. Mark Code as Used
            activation_code.status = ActivationCode.Status.USED
            activation_code.used_at = timezone.now()
            activation_code.save()

            # 5. Generate Token (Simple mock for now, or real JWT if configured)
            # In production, use a library to sign a JWT containing the license info
            
            return Response({
                "status": "active",
                "expiry": expiry_date,
                "message": "Activation successful"
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LicenseStatusView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = [] # Fix 403: Disable auth check for public endpoint

    def post(self, request):
        device_hash = request.data.get('device_hash')
        if not device_hash:
            return Response({"error": "device_hash required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            device = Device.objects.get(fingerprint=device_hash)
            # Update meta on every status check
            device.last_seen = timezone.now()
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                device.last_ip = x_forwarded_for.split(',')[0]
            else:
                device.last_ip = request.META.get('REMOTE_ADDR')
            device.user_agent = request.META.get('HTTP_USER_AGENT')

            # Auto-update metadata if generic
            if device.model.startswith('Web Player') or device.os_version == 'Unknown':
                 os_meta, browser_meta = parse_ua(device.user_agent)
                 if browser_meta != 'Unknown':
                     device.model = f"Web Player ({browser_meta})"
                 if os_meta != 'Unknown':
                     device.os_version = os_meta
            
            device.save()
        except Device.DoesNotExist:
            return Response({"status": "NONE", "message": "Device not registered"})

        # Check for active license
        active_license = License.objects.filter(
            device=device,
            is_active=True,
            activation_code__status__in=[ActivationCode.Status.USED], # Ensure code isn't revoked
            expiry_date__gt=timezone.now()
        ).first()

        if active_license:
            return Response({
                "status": "ACTIVE",
                "expiry": active_license.expiry_date,
                "license_type": "PAID"
            })

        # Check trial
        if device.trial_start_date and not device.trial_used:
            trial_end = device.trial_start_date + timedelta(days=3)
            if timezone.now() < trial_end:
                return Response({
                    "status": "TRIAL",
                    "trial_expiry": trial_end
                })

        # If we reached here, the device has no active license or trial.
        # It is strictly "locked".
        
        message = "Activation required."
        if device.trial_used:
            message = "Free trial expired. Please activate your account."
            
        return Response({
            "status": "locked",
            "message": message
        })

class SeriesViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = SeriesSerializer
    queryset = Series.objects.filter(is_active=True).order_by('title')
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'category', 'country', 'language']

    @action(detail=True, methods=['get'])
    def episodes(self, request, pk=None):
        series = self.get_object()
        episodes = series.episodes.all().order_by('season', 'episode')
        serializer = ChannelSerializer(episodes, many=True)
        return Response(serializer.data)

class ChannelViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = ChannelSerializer
    queryset = Channel.objects.filter(is_active=True).order_by('name')
    pagination_class = ChannelPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'category', 'country']

    @action(detail=False, methods=['get'])
    def categories(self, request):
        cats = Channel.objects.filter(is_active=True).values_list('category', flat=True).distinct().order_by('category')
        return Response(list(filter(None, cats)))

    @action(detail=False, methods=['get'])
    def countries(self, request):
        countries = Channel.objects.filter(is_active=True).values_list('country', flat=True).distinct().order_by('country')
        return Response(list(filter(None, countries)))

    @action(detail=False, methods=['get'])
    def languages(self, request):
        langs = Channel.objects.filter(is_active=True).values_list('language', flat=True).distinct().order_by('language')
        return Response(list(filter(None, langs)))

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category')
        country = self.request.query_params.get('country')
        language = self.request.query_params.get('language')
        playlist_id = self.request.query_params.get('playlist')
        
        if category:
            queryset = queryset.filter(category__iexact=category)
        if country:
            queryset = queryset.filter(country__iexact=country)
        if language:
            queryset = queryset.filter(language__iexact=language)
        if playlist_id:
            try:
                queryset = queryset.filter(playlist_id=playlist_id)
            except Exception:
                pass
            
        return queryset


# --- Admin Views ---

class AdminPaymentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSupport]
    queryset = Payment.objects.all().order_by('-created_at')
    serializer_class = PaymentSerializer

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        payment = self.get_object()
        if payment.status == Payment.Status.CONFIRMED:
            return Response({"error": "Already confirmed"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Confirm Payment
        payment.status = Payment.Status.CONFIRMED
        payment.confirmed_at = timezone.now()
        if request.user.is_authenticated:
            payment.confirmed_by = request.user
        payment.save()

        # Log Action
        log_action(
            user=request.user if request.user.is_authenticated else None,
            action="CONFIRM_PAYMENT",
            resource_type="Payment",
            resource_id=str(payment.id),
            request=request,
            details={"reference": payment.payment_reference, "amount": str(payment.amount)}
        )

        # Generate Code (Signal or explicit call)
        # Assuming ActivationCode is generated automatically via signals or here.
        # But we logic moved to Payment.save() or ActivationCode.save()?
        # Wait, the model `ActivationCode` was designed to be created.
        # Let's create it explicitly here to be safe and clear.
        
        # Custom Duration override from request
        duration = request.data.get('duration')
        if duration:
            duration = int(duration)
        else:
            duration = 365 if payment.plan_type == Payment.PlanType.ONE_YEAR else 1095

        code = ActivationCode.objects.create(
            payment=payment,
            plan_duration_days=duration
        )

        return Response({
            "status": "confirmed",
            "generated_code": code.code
        })

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        payment = self.get_object()
        if payment.status != Payment.Status.PENDING:
             return Response({"error": "Cannot reject non-pending payment"}, status=status.HTTP_400_BAD_REQUEST)
        
        payment.status = Payment.Status.REJECTED
        payment.save()
        
        # Log Action
        log_action(
            user=request.user if request.user.is_authenticated else None,
            action="REJECT_PAYMENT",
            resource_type="Payment",
            resource_id=str(payment.id),
            request=request,
            details={"reference": payment.payment_reference}
        )
        return Response({"status": "rejected"})

class AdminActivationCodeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSupport]
    queryset = ActivationCode.objects.all().order_by('-generated_at')
    serializer_class = ActivationCodeSerializer

    @action(detail=False, methods=['post'])
    def generate(self, request):
        duration = int(request.data.get('duration', 365))
        code = ActivationCode.objects.create(
            plan_duration_days=duration,
            client_reference=request.data.get('reference', '')
            # payment is null for manually generated codes
        )
        return Response({
            "status": "generated",
            "code": code.code,
            "duration": duration
        })

    @action(detail=True, methods=['post'])
    def revoke(self, request, pk=None):
        code = self.get_object()
        code.status = ActivationCode.Status.REVOKED
        code.save()
        
        # Log Action
        log_action(
            user=request.user if request.user.is_authenticated else None,
            action="REVOKE_CODE",
            resource_type="ActivationCode",
            resource_id=code.code,
            request=request
        )
        
        # Cascade to License
        try:
            license = License.objects.get(activation_code=code)
            license.is_active = False
            license.revoked_reason = "Code Revoked by Admin"
            license.save()
        except License.DoesNotExist:
            pass # Code might not have been used yet
            
        return Response({"status": "revoked"})

class AdminLicenseViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSupport]
    queryset = License.objects.all().order_by('-start_date')
    serializer_class = LicenseSerializer

    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdmin])
    def revoke(self, request, pk=None):
        license = self.get_object()
        license.is_active = False
        license.revoked_reason = request.data.get('reason', 'Revoked by Admin')
        license.save()
        
        # Also revoke the code?
        license.activation_code.status = ActivationCode.Status.REVOKED
        license.activation_code.save()

        # Log Action
        log_action(
            user=request.user if request.user.is_authenticated else None,
            action="REVOKE_LICENSE",
            resource_type="License",
            resource_id=str(license.id),
            request=request,
            details={"reason": license.revoked_reason, "device": license.device.fingerprint}
        )
        return Response({"status": "revoked"})

    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdmin])
    def reset(self, request, pk=None):
        """
        Resets a license so the activation code can be reused on a new device.
        Deactivates the current license and sets code status back to UNUSED.
        """
        license = self.get_object()
        
        # 1. Deactivate current license
        license.is_active = False
        license.revoked_reason = "Reset for device change"
        license.save()
        
        # 2. Reset Code
        code = license.activation_code
        code.status = ActivationCode.Status.UNUSED
        code.used_at = None
        code.save()
        
        # Log Action
        log_action(
            user=request.user if request.user.is_authenticated else None,
            action="RESET_LICENSE",
            resource_type="License",
            resource_id=str(license.id),
            request=request,
            details={"code": code.code, "old_device": license.device.fingerprint}
        )
        
        return Response({
            "status": "reset",
            "message": "License reset. User can now activate again on new device.",
            "code": code.code
        })

    @action(detail=True, methods=['post'])
    def update_expiry(self, request, pk=None):
        license = self.get_object()
        new_expiry = request.data.get('new_expiry')
        if not new_expiry:
            return Response({"error": "new_expiry required"}, status=status.HTTP_400_BAD_REQUEST)
        
        license.expiry_date = new_expiry
        license.save()

        # Log Action
        log_action(
            user=request.user if request.user.is_authenticated else None,
            action="UPDATE_EXPIRY",
            resource_type="License",
            resource_id=str(license.id),
            request=request,
            details={"new_expiry": new_expiry}
        )

        return Response({
            "status": "updated",
            "new_expiry": license.expiry_date
        })
        
class AdminDeviceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSupport]
    queryset = Device.objects.all().order_by('-last_seen')
    serializer_class = DeviceSerializer

    @action(detail=True, methods=['post'])
    def revoke_trial(self, request, pk=None):
        device = self.get_object()
        device.trial_used = True
        # Set trial_start_date far in the past to ensure it's expired
        device.trial_start_date = timezone.now() - timedelta(days=10)
        device.save()

        # Log Action
        log_action(
            user=request.user if request.user.is_authenticated else None,
            action="REVOKE_TRIAL",
            resource_type="Device",
            resource_id=device.fingerprint,
            request=request
        )

        return Response({"status": "trial_revoked"})

class AnalyticsAccessView(APIView):
    """
    Public Endpoint for devices to report views (pings).
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = [] 

    def post(self, request):
        channel_id = request.data.get('channel_id')
        device_hash = request.data.get('device_hash')
        
        if not channel_id:
            return Response({"error": "channel_id required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            channel = Channel.objects.get(id=channel_id)
        except Channel.DoesNotExist:
             return Response({"error": "channel not found"}, status=status.HTTP_404_NOT_FOUND)
        
        device = None
        if device_hash:
            device = Device.objects.filter(fingerprint=device_hash).first()
            
        # Capture Client IP and UA
        ip = get_client_ip(request)
        ua = request.META.get('HTTP_USER_AGENT', '')

        # Heartbeat logic: If same channel + device/IP within last 10 minutes of LAST activity
        recent_view = ChannelView.objects.filter(channel=channel)
        if device:
            recent_view = recent_view.filter(device=device)
        else:
            recent_view = recent_view.filter(ip_address=ip)
        
        recent_view = recent_view.order_by('-timestamp').first()
        
        if recent_view:
            # last_active = start_time + duration (mins)
            last_active = recent_view.timestamp + timedelta(minutes=recent_view.duration)
            if timezone.now() < last_active + timedelta(minutes=10): # 10 min window to resume/continue
                recent_view.duration += 1 
                recent_view.save()
                return Response({"status": "heartbeat_recorded", "duration": recent_view.duration})

        # New session
        country = resolve_country(ip)
        ChannelView.objects.create(
            channel=channel, 
            device=device,
            ip_address=ip,
            user_agent=ua,
            country=country,
            duration=1
        )
        return Response({"status": "session_started"})

class AnalyticsDashboardView(APIView):
    """
    Admin Endpoint for Analytics Data.
    """
    permission_classes = [IsSupport]

    def get(self, request):
        from django.db.models import Sum, Count, F
        from django.db.models.functions import Coalesce

        now = timezone.now()
        
        def get_top_for_period(start_date):
            return ChannelView.objects.filter(timestamp__gte=start_date)\
                                    .values('channel__name')\
                                    .annotate(views=Count('id'))\
                                    .order_by('-views')[:10]

        top_daily = get_top_for_period(now - timedelta(days=1))
        top_weekly = get_top_for_period(now - timedelta(weeks=1))
        top_monthly = get_top_for_period(now - timedelta(days=30))
        top_yearly = get_top_for_period(now - timedelta(days=365))

        # Top Viewers (by watch time)
        top_viewers = ChannelView.objects.values('device__fingerprint', 'ip_address')\
            .annotate(total_duration=Sum('duration'), views=Count('id'))\
            .order_by('-total_duration')[:10]
            
        viewers_list = []
        for v in top_viewers:
            ref = "Guest"
            # Attempt to resolve reference
            if v['device__fingerprint']:
                 lic = License.objects.filter(device__fingerprint=v['device__fingerprint']).select_related('activation_code').first()
                 if lic and lic.activation_code.client_reference:
                     ref = lic.activation_code.client_reference
                 else:
                     ref = f"Device {v['device__fingerprint'][:8]}"
            else:
                 ref = f"Guest ({v['ip_address']})"
            
            viewers_list.append({
                "reference": ref,
                "total_duration": v['total_duration'],
                "views": v['views']
            })

        # Activity Feed (Last 100 views)
        recent_views = ChannelView.objects.select_related('channel', 'device').all().order_by('-timestamp')[:100]
        activity = []
        for v in recent_views:
             # Find if there is a reference for this device
             ref = "Guest"
             if v.device:
                 # Try to find a license and its client_reference
                 lic = License.objects.filter(device=v.device).select_related('activation_code').first()
                 if lic and lic.activation_code.client_reference:
                     ref = lic.activation_code.client_reference
                 elif lic:
                     ref = f"Device {v.device.fingerprint[:8]}"
                 else:
                     ref = f"Device {v.device.fingerprint[:8]}"
             
             activity.append({
                 "id": str(v.id),
                 "channel": v.channel.name,
                 "channel_id": str(v.channel.id),
                 "time": v.timestamp,
                 "duration": v.duration,
                 "ip": v.ip_address,
                 "country": v.country or "Unknown",
                 "reference": ref,
                 "device_model": v.device.model if v.device else f"{parse_ua(v.user_agent)[1]} on {parse_ua(v.user_agent)[0]}"
             })

        return Response({
            "top_daily": list(top_daily),
            "top_weekly": list(top_weekly),
            "top_monthly": list(top_monthly),
            "top_yearly": list(top_yearly),
            "top_viewers": viewers_list,
            "recent_activity": activity
        })

class StreamProxyView(APIView):
    """
    Proxies stream requests to bypass CORS/Mixed Content issues.
    WARNING: High bandwidth usage. Use as last resort.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        import requests
        from django.http import StreamingHttpResponse

        url = request.query_params.get('url')
        if not url:
            return Response({"error": "url parameter required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Forward Range headers and add Browser-like headers to avoid 403s
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Connection': 'keep-alive',
            }
            if 'Range' in request.headers:
                headers['Range'] = request.headers['Range']
            
            # Fetch content with stream=True for efficiency
            # verify=False to ignore certificate issues (common in IPTV/scraping)
            r = requests.get(url, headers=headers, stream=True, verify=False, timeout=15)
            
            # Forward specific headers back to client (EXCLUDING Content-Type)
            response_headers = {}
            for header in ['Content-Length', 'Accept-Ranges', 'Content-Range']:
                if header in r.headers:
                    response_headers[header] = r.headers[header]
            
            # Content Rewrite Logic for M3U8 Playlists
            # We need to rewrite URLs inside the playlist to also point to the proxy
            content_type = r.headers.get('Content-Type', '')
            if 'mpegurl' in content_type or 'hls' in content_type or url.endswith('.m3u8'):
                content = r.content.decode('utf-8', errors='ignore')
                
                def rewrite_line(line):
                    line = line.strip()
                    if line and not line.startswith('#'):
                        # It's a URL path.
                        # If absolute, wrap in proxy.
                        # If relative, resolve to absolute then wrap.
                        from urllib.parse import urljoin
                        absolute_url = urljoin(url, line)
                        # Construct recursive proxy URL
                        # Note: We must encode the URL properly? requests.get handles query params encoding usually.
                        # But simple string concatenation is safer for logic visualization.
                        # Using request.build_absolute_uri to point to THIS proxy endpoint.
                        proxy_base = request.build_absolute_uri(request.path)
                        return f"{proxy_base}?url={requests.utils.quote(absolute_url)}"
                    return line

                modified_lines = [rewrite_line(line) for line in content.splitlines()]
                modified_content = "\n".join(modified_lines)
                
                return Response(modified_content, content_type=content_type)
            
            # Binary Stream (TS segments, MP4, etc)
            response = StreamingHttpResponse(
                r.iter_content(chunk_size=8192),
                status=r.status_code,
                content_type=content_type
            )
            for k, v in response_headers.items():
                response[k] = v
            return response

        except Exception as e:
            return Response({"error": f"Proxy Error [V2]: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)

class AdminStatsView(APIView):
    permission_classes = [IsSupport]

    def get(self, request):
        from django.db.models import Sum
        
        now = timezone.now()
        
        # 1. Total Revenue (Confirmed Payments)
        revenue = Payment.objects.filter(status=Payment.Status.CONFIRMED).aggregate(total=Sum('amount'))['total'] or 0
        
        # 2. Active Users (Devices seen in last 24h)
        active_users = Device.objects.filter(last_seen__gt=now - timedelta(hours=24)).count()
        
        # 3. Pending Payments
        pending_payments = Payment.objects.filter(status=Payment.Status.PENDING).count()
        
        # 4. Total Devices
        total_devices = Device.objects.count()

        # 5. Active Trials (Started in last 3 days and not marked as used yet)
        trial_users = Device.objects.filter(
            trial_start_date__isnull=False,
            trial_used=False,
            trial_start_date__gt=now - timedelta(days=3)
        ).count()

        return Response({
            "revenue": revenue,
            "active_users": active_users,
            "pending_payments": pending_payments,
            "total_devices": total_devices,
            "trial_users": trial_users,
            "currency": "CFA"
        })

class AdminAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsSuperAdmin]
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['resource_id', 'action', 'user__username', 'ip_address']

class PlaylistViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows playlists to be viewed.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = [] # Fix 403: Disable auth check for public endpoint
    serializer_class = PlaylistSerializer
    queryset = Playlist.objects.filter(is_active=True)

class AdminUserViewSet(viewsets.ModelViewSet):
    """
    Manage Admin Users. Only SuperAdmin can access.
    """
    permission_classes = [IsSuperAdmin]
    queryset = AdminUser.objects.all()
    serializer_class = AdminUserSerializer

    def get_queryset(self):
        # Prevent deleting oneself or other superadmins easily via bulk?
        # Standard filter
        return super().get_queryset()

class AdminSetupView(APIView):
    """
    Temporary view to create the admin user since shell access is unavailable.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        setup_token = request.headers.get('X-Setup-Token') or request.query_params.get('token')
        expected_token = os.environ.get('SETUP_TOKEN', 'SerenitySetup2026!')
        
        if setup_token != expected_token:
             return Response({"error": "Unauthorized. Setup token required."}, status=status.HTTP_403_FORBIDDEN)

        username = "Fayell"
        password = "Nellou962@"
        role = AdminUser.Role.SUPERADMIN

        if not AdminUser.objects.filter(username=username).exists():
            user = AdminUser.objects.create_superuser(username=username, password=password)
            user.role = role
            user.save()
            msg = f"Superuser '{username}' created successfully."
        else:
            user = AdminUser.objects.get(username=username)
            user.role = role
            user.set_password(password)
            user.save()
            msg = f"Superuser '{username}' updated successfully."
        
        return Response({"status": "ok", "message": msg})

class MaintenanceViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny] # Protected with Token
    authentication_classes = []

    def check_token(self, request):
        token = request.headers.get('X-Maintenance-Token') or request.query_params.get('token')
        expected = os.environ.get('MAINTENANCE_TOKEN', 'SerenityMaint2026!')
        return token == expected

    @action(detail=False, methods=['post', 'get'])
    def import_content(self, request):
        if not self.check_token(request):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        # Determine strict mode
        limit = request.query_params.get('limit')
        if limit: limit = int(limit)

        import sys
        sys.path.insert(0, settings.BASE_DIR)
        from import_m3u import import_all
        
        try:
            # Running synchronous for simplicity, but in prod should be async task (Celery/Huey)
            # Since user has no shell, we risk timeout. Just triggering it.
            import_all() 
            return Response({"status": "Import completed successfully", "count": Channel.objects.count()})
        except Exception as e:
            return Response({"error": f"Import failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post', 'get'])
    def clean_channels(self, request):
        if not self.check_token(request):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        from clean_channels import clean_channels
        try:
            clean_channels()
            return Response({"status": "Cleanup completed successfully"})
        except Exception as e:
             return Response({"error": f"Cleanup failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post', 'get'])
    def migrate_db(self, request):
        # Emergency migration endpoint
        if not self.check_token(request):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        from django.core.management import call_command
        try:
            call_command('migrate')
            return Response({"status": "Migration completed successfully"})
        except Exception as e:
            return Response({"error": f"Migration failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
