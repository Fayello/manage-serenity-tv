from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DeviceRegisterView, LicenseActivateView, LicenseStatusView, LicenseTrialStartView,
    AdminPaymentViewSet, AdminActivationCodeViewSet, AdminLicenseViewSet, AdminDeviceViewSet,
    ChannelViewSet, PlaylistViewSet, AdminStatsView, AdminSetupView, AdminUserViewSet,
    AdminAuditLogViewSet, MaintenanceViewSet, AnalyticsAccessView, AnalyticsDashboardView,
    StreamProxyView, SeriesViewSet
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

router = DefaultRouter()
router.register(r'admin/users', AdminUserViewSet, basename='admin-users')
router.register(r'admin/payments', AdminPaymentViewSet, basename='admin-payments')
router.register(r'admin/codes', AdminActivationCodeViewSet, basename='admin-codes')
router.register(r'admin/licenses', AdminLicenseViewSet, basename='admin-licenses')
router.register(r'admin/devices', AdminDeviceViewSet, basename='admin-devices')
router.register(r'admin/audit-logs', AdminAuditLogViewSet, basename='admin-audit-logs')
router.register(r'channels', ChannelViewSet, basename='channels')
router.register(r'playlists', PlaylistViewSet, basename='playlists')
router.register(r'series', SeriesViewSet, basename='series')
router.register(r'maintenance', MaintenanceViewSet, basename='maintenance')

urlpatterns = [
    path('device/register', DeviceRegisterView.as_view(), name='device-register'),
    path('license/activate', LicenseActivateView.as_view(), name='license-activate'),
    path('license/trial/start', LicenseTrialStartView.as_view(), name='license-trial-start'),
    path('license/status', LicenseStatusView.as_view(), name='license-status'),
    path('admin/login', TokenObtainPairView.as_view(), name='admin-login'),
    path('admin/stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('analytics/record', AnalyticsAccessView.as_view(), name='analytics-record'),
    path('admin/analytics/top', AnalyticsDashboardView.as_view(), name='admin-analytics-top'),
    path('stream/proxy', StreamProxyView.as_view(), name='stream-proxy'), # v2 fix
    path('setup_admin_secret/', AdminSetupView.as_view(), name='admin_setup_secret'),
    path('', include(router.urls)),
]
