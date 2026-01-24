import React, { useEffect, useState } from 'react';
import api, { authService } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    CreditCard,
    Key,
    Smartphone,
    LogOut,
    TrendingUp,
    Users,
    Clock,
    Smartphone as DeviceIcon,
    RefreshCw,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Settings,
    Shield,
    Download,
    BarChart3,
    Film,
    Trash2
} from 'lucide-react';
import clsx from 'clsx';
import ActionModal from '../../components/ActionModal';
import ActivationModal from '../../components/ActivationModal';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('payments');
    const [data, setData] = useState([]);
    const [stats, setStats] = useState({
        revenue: 0,
        active_users: 0,
        trial_users: 0,
        pending_payments: 0,
        total_devices: 0,
        currency: 'CFA'
    });
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Modern UI State
    const [modalOpen, setModalOpen] = useState(false);
    const [actionModal, setActionModal] = useState({
        isOpen: false,
        type: 'info',
        title: '',
        message: '',
        confirmText: '',
        requiresInput: false,
        onConfirm: () => { }
    });
    const [toast, setToast] = useState(null); // { message: string, type: 'success'|'error' }
    const [pendingAction, setPendingAction] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Helpers
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return "N/A";
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? "N/A" : date.toLocaleString();
    };

    useEffect(() => {
        if (activeTab === 'settings') return;
        fetchData();
        fetchStats();
    }, [activeTab]);

    const fetchStats = async () => {
        try {
            const response = await api.get('/admin/stats/');
            setStats(response.data);
        } catch (error) {
            console.error("Failed to fetch stats", error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            let endpoint = '';
            switch (activeTab) {
                case 'analytics': endpoint = '/admin/analytics/top'; break;
                case 'content': endpoint = '/channels/?limit=100'; break; // Simple limit for now
                case 'payments': endpoint = '/admin/payments/'; break;
                case 'codes': endpoint = '/admin/codes/'; break;
                case 'licenses': endpoint = '/admin/licenses/'; break;
                case 'fleet': endpoint = '/admin/devices/'; break;
                case 'audit': endpoint = '/admin/audit-logs/'; break;
                default: endpoint = '/admin/payments/';
            }
            const response = await api.get(endpoint);
            // Handling difference in pagination vs direct list
            if (activeTab === 'content' && response.data.results) {
                setData(response.data.results);
            } else {
                setData(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        }
        setLoading(false);
    };

    // ... handles ...

    const handleDeleteChannel = (id) => {
        setActionModal({
            isOpen: true,
            type: 'danger',
            title: 'Delete Channel',
            message: 'Are you sure? This will remove the channel from all apps immediately.',
            confirmText: 'Delete Forever',
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    // We need a DELETE endpoint. Standard ViewSet provides it but we need authentication/permission
                    // ChannelViewSet is read-only for public, but we need Admin write access.
                    // We haven't enabled Write on ChannelViewSet yet! We need to fix that backend side first?
                    // Or we assume SuperAdmin has access if we change permission class.
                    // Actually ChannelViewSet is ReadOnlyModelViewSet. I need to change it to ModelViewSet in backend.

                    // Assuming I'll fix backend in a moment.
                    await api.delete(`/channels/${id}/`);
                    showToast("Channel deleted");
                    handleRefresh();
                    setActionModal(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    showToast("Failed to delete channel", 'error');
                }
                setActionLoading(false);
            }
        });
    };

    // ...

    <nav className="flex-1 space-y-2">
        <NavItem
            active={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
            icon={BarChart3}
            label="Smart Metrics"
            badge={null}
            onNavItemClick={() => setIsMenuOpen(false)}
        />
        <NavItem
            active={activeTab === 'content'}
            onClick={() => setActiveTab('content')}
            icon={Film}
            label="Content Manager"
            badge={null}
            onNavItemClick={() => setIsMenuOpen(false)}
        />
        <div className="pt-4 mt-4 border-t border-white/10">
            <NavItem
                active={activeTab === 'payments'}
                onClick={() => setActiveTab('payments')}
                icon={CreditCard}
                label="Payments"
                badge={stats.pending_payments > 0 ? stats.pending_payments : null}
                onNavItemClick={() => setIsMenuOpen(false)}
            />
            {/* ... other items ... */}
            <NavItem
                active={activeTab === 'codes'}
                onClick={() => setActiveTab('codes')}
                icon={Key}
                label="Activation Codes"
                onNavItemClick={() => setIsMenuOpen(false)}
            />
            <NavItem
                active={activeTab === 'licenses'}
                onClick={() => setActiveTab('licenses')}
                icon={Smartphone}
                label="User Licenses"
                onNavItemClick={() => setIsMenuOpen(false)}
            />
            <NavItem
                active={activeTab === 'fleet'}
                onClick={() => setActiveTab('fleet')}
                icon={DeviceIcon}
                label="Device Fleet"
                onNavItemClick={() => setIsMenuOpen(false)}
            />
            <NavItem
                active={activeTab === 'audit'}
                onClick={() => setActiveTab('audit')}
                icon={Shield}
                label="Security Logs"
                onNavItemClick={() => setIsMenuOpen(false)}
            />
        </div>
        <div className="pt-4 mt-4 border-t border-white/10">
            <NavItem
                active={activeTab === 'settings'}
                onClick={() => setActiveTab('settings')}
                icon={Settings}
                label="Settings"
                onNavItemClick={() => setIsMenuOpen(false)}
            />
        </div>
        <a
            href="/Serenity_TV.apk"
            download
            className="flex items-center gap-3 p-4 mt-2 rounded-xl text-blue-400 hover:bg-blue-500/10 border border-blue-500/20 transition-all duration-300 group"
            title="Download rebranded APK for manual distribution"
        >
            <Download size={20} className="transition-transform group-hover:translate-y-0.5" />
            <span className="font-bold text-sm tracking-tight">Download APK</span>
        </a>
    </nav>

    {/* ... */ }
    {/* Stats Grid */ }
    {
        activeTab === 'analytics' && (
            <div className="mb-12">
                <AnalyticsView data={data} />
            </div>
        )
    }

    {
        activeTab === 'content' && (
            <div className="mb-12">
                <ContentManager channels={Array.isArray(data) ? data : []} onDelete={handleDeleteChannel} />
            </div>
        )
    }

    {
        activeTab !== 'analytics' && activeTab !== 'content' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
                <StatCard
                    title="Total Billing"
                    value={`${stats.revenue.toLocaleString()} ${stats.currency}`}
                    subtitle="Lifetime confirmed revenue"
                    icon={TrendingUp}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Active Users"
                    value={stats.active_users}
                    subtitle="Devices active in last 24h"
                    icon={Users}
                    color="bg-green-500"
                />
                <StatCard
                    title="Active Trials"
                    value={stats.trial_users}
                    subtitle="Users in 3-day trial period"
                    icon={Clock}
                    color="bg-orange-500"
                />
                <StatCard
                    title="Pending Syncs"
                    value={stats.pending_payments}
                    subtitle="Payments awaiting approval"
                    icon={Clock}
                    color="bg-yellow-500"
                />
                <StatCard
                    title="Total Fleet"
                    value={stats.total_devices}
                    subtitle="Discovered unique handests"
                    icon={DeviceIcon}
                    color="bg-purple-500"
                />
            </div>

                        {/* Content Area */ }
        {
            activeTab === 'settings' ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-3xl p-8">
                        <AdminUsers />
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-3xl p-8">
                        <LicenseManager />
                    </div>
                </div>
            ) : (
            <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl border-white/10">
                <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        {activeTab === 'payments' && <><CreditCard size={18} /> Recent Transactions</>}
                        {activeTab === 'codes' && <><Key size={18} /> Master Codes</>}
                        {activeTab === 'licenses' && <><Smartphone size={18} /> Active Licenses</>}
                        {activeTab === 'fleet' && <><DeviceIcon size={18} /> Device Registry</>}
                        {activeTab === 'audit' && <><Shield size={18} /> Security Audit Trail</>}
                    </h3>
                    {activeTab === 'codes' && (
                        <button
                            onClick={handleGenerateCode}
                            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 transition-all"
                        >
                            + New Activation
                        </button>
                    )}
                </div>

                <div className="p-4 md:p-0 min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-20 gap-4">
                                <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                                <p className="text-gray-500 font-medium font-mono text-sm uppercase tracking-tighter">Synchronizing secure data...</p>
                            </div>
                        ) : (
                            <div className="w-full">
                                {/* Desktop Table */}
                                <table key={activeTab} className="hidden lg:table w-full text-left">
                                    <thead className="bg-white/[0.02] text-gray-400 text-xs font-bold uppercase tracking-widest">
                                        <tr>
                                            {activeTab === 'payments' && <><th className="p-6">Reference</th><th className="p-6">Amount</th><th className="p-6">Plan</th><th className="p-6">Status</th><th className="p-6">Actions</th></>}
                                            {activeTab === 'codes' && <><th className="p-6">Access Code</th><th className="p-6">Duration</th><th className="p-6">Source (Audit)</th><th className="p-6">State</th><th className="p-6">Issued On</th><th className="p-6">Actions</th></>}
                                            {activeTab === 'licenses' && <><th className="p-6">Target Fingerprint</th><th className="p-6">Linked Code</th><th className="p-6">Expiration</th><th className="p-6">Status & Audit</th><th className="p-6">Actions</th></>}
                                            {activeTab === 'fleet' && <><th className="p-6">Identifier</th><th className="p-6">Specs</th><th className="p-6">Network Info</th><th className="p-6">Activity</th><th className="p-6">Trial</th><th className="p-6">Actions</th></>}
                                            {activeTab === 'audit' && <><th className="p-6">Timestamp</th><th className="p-6">Admin</th><th className="p-6">Action</th><th className="p-6">Resource</th><th className="p-6">Details</th></>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {data.map((item, idx) => (
                                            <motion.tr
                                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                                                key={item.id || item.code || item.fingerprint}
                                                className="hover:bg-white/[0.02] transition-colors group"
                                            >
                                                {activeTab === 'payments' && (
                                                    <>
                                                        <td className="p-6 font-mono text-sm text-blue-400 font-bold">{item.payment_reference}</td>
                                                        <td className="p-6 font-bold">{item.amount} {item.currency}</td>
                                                        <td className="p-6"><span className="px-3 py-1 bg-white/5 rounded-lg text-xs font-mono">{item.plan_type}</span></td>
                                                        <td className="p-6"><StatusBadge status={item.status} /></td>
                                                        <td className="p-6">
                                                            {item.status === 'PENDING' && <button onClick={() => handleConfirmPayment(item.id, item.plan_type)} className="bg-green-600/10 text-green-400 border border-green-500/20 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600 hover:text-white transition-all">Confirm Payment</button>}
                                                            {item.status === 'CONFIRMED' && item.activation_code && <span className="font-mono text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">{item.activation_code.code}</span>}
                                                        </td>
                                                    </>
                                                )}
                                                {activeTab === 'codes' && (
                                                    <>
                                                        <td className="p-6 font-mono text-sm font-bold text-white select-all">{item.code}</td>
                                                        <td className="p-6 text-gray-400 text-sm">{item.plan_duration_days} Days</td>
                                                        <td className="p-6 text-xs font-mono text-gray-500 uppercase">{item.payment_reference || 'MANUAL'}</td>
                                                        <td className="p-6"><StatusBadge status={item.status} /></td>
                                                        <td className="p-6 text-gray-500 text-sm font-mono">{formatDate(item.generated_at)}</td>
                                                        <td className="p-6">{item.status === 'UNUSED' && <button onClick={() => handleRevokeCode(item.id)} className="text-gray-500 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded-lg transition-all" title="Revoke Code"><AlertCircle size={18} /></button>}</td>
                                                    </>
                                                )}
                                                {activeTab === 'licenses' && (
                                                    <>
                                                        <td className="p-6 font-mono text-xs text-blue-300 max-w-[200px] truncate select-all" title={item.device}>{item.device}</td>
                                                        <td className="p-6 font-mono text-xs text-gray-500">{item.activation_code}</td>
                                                        <td className="p-6 font-bold text-sm tracking-tight">{formatDate(item.expiry_date)}</td>
                                                        <td className="p-6">
                                                            <div className={clsx("flex flex-col gap-1", item.is_active ? "text-green-400" : "text-red-400")}>
                                                                <div className="flex items-center gap-2 text-xs font-bold">
                                                                    {item.is_active ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                                                    {item.is_active ? "SECURED" : "REVOKED"}
                                                                </div>
                                                                {item.revoked_reason && (
                                                                    <div className="text-[10px] text-gray-500 font-medium italic max-w-[150px] truncate" title={item.revoked_reason}>
                                                                        Reason: {item.revoked_reason}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="p-6">
                                                            <div className="flex items-center gap-2">
                                                                {item.is_active && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleUpdateExpiry(item.id, item.expiry_date)}
                                                                            className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-500/10 rounded-xl transition-all"
                                                                            title="Extend/Modify Expiration"
                                                                        >
                                                                            <Clock size={18} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleRevokeLicense(item.id)}
                                                                            className="text-gray-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-xl transition-all"
                                                                            title="Revoke License Access"
                                                                        >
                                                                            <AlertCircle size={18} />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </>
                                                )}
                                                {activeTab === 'fleet' && (
                                                    <>
                                                        <td className="p-6 font-mono text-[10px] text-blue-300/60 select-all" title={item.fingerprint}>{item.fingerprint.slice(0, 8)}...</td>
                                                        <td className="p-6"><div className="text-sm font-black text-white">{item.model}</div><div className="text-[10px] text-gray-500 font-mono">{item.os_version}</div></td>
                                                        <td className="p-6"><div className="text-[10px] font-bold text-blue-400">{item.last_ip || 'No IP recorded'}</div><div className="text-[8px] text-gray-600 truncate max-w-[120px]" title={item.user_agent}>{item.user_agent || 'Unknown UA'}</div></td>
                                                        <td className="p-6 text-gray-400 text-xs font-medium">{formatDateTime(item.last_seen)}</td>
                                                        <td className="p-6">
                                                            {item.trial_used ? (
                                                                <span className="text-red-400 text-[10px] font-black tracking-wider uppercase bg-red-400/10 px-2.5 py-1 rounded-full border border-red-500/20">Expired</span>
                                                            ) : item.trial_start_date ? (
                                                                <span className="text-orange-400 text-[10px] font-black tracking-wider uppercase bg-orange-400/10 px-2.5 py-1 rounded-full border border-orange-500/20 animate-pulse">On Trial</span>
                                                            ) : (
                                                                <span className="text-gray-500 text-[10px] font-black tracking-wider uppercase bg-white/5 px-2.5 py-1 rounded-full border border-white/5">None</span>
                                                            )}
                                                        </td>
                                                        <td className="p-6">
                                                            {item.trial_start_date && !item.trial_used && (
                                                                <button
                                                                    onClick={() => handleRevokeTrial(item.fingerprint)}
                                                                    className="text-gray-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-xl transition-all"
                                                                    title="Terminate Trial"
                                                                >
                                                                    <AlertCircle size={18} />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </>
                                                )}
                                                {activeTab === 'audit' && (
                                                    <>
                                                        <td className="p-6 text-xs text-gray-500 font-mono">{formatDateTime(item.timestamp)}</td>
                                                        <td className="p-6"><div className="flex items-center gap-2"><div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-[10px] text-blue-400 font-black">{item.admin_username?.charAt(0).toUpperCase()}</div><span className="text-xs font-bold">{item.admin_username || 'System'}</span></div></td>
                                                        <td className="p-6"><span className={clsx("px-2 py-0.5 rounded-lg text-[10px] font-black border uppercase tracking-widest", item.action.includes('REVOKE') ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-blue-500/10 border-blue-500/20 text-blue-400")}>{item.action.replace('_', ' ')}</span></td>
                                                        <td className="p-6 text-xs font-bold text-gray-300">{item.resource_type}: <span className="font-mono text-[10px] text-gray-500">{item.resource_id.slice(0, 8)}...</span></td>
                                                        <td className="p-6"><div className="text-[10px] text-gray-600 max-w-[200px] truncate" title={JSON.stringify(item.details)}>{Object.entries(item.details).map(([k, v]) => `${k}: ${v}`).join(', ') || 'No extra data'}</div></td>
                                                    </>
                                                )}
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Mobile Card Layout */}
                                <div className="lg:hidden grid grid-cols-1 gap-4">
                                    {data.map((item, idx) => (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}
                                            key={item.id || item.code || item.fingerprint}
                                            className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl"
                                        >
                                            {activeTab === 'payments' && (
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-start"><div><p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Reference</p><p className="font-mono text-blue-400 font-bold">{item.payment_reference}</p></div><StatusBadge status={item.status} /></div>
                                                    <div className="flex justify-between items-center"><div><p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Amount</p><p className="font-bold">{item.amount} {item.currency}</p></div><div className="text-right"><p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Plan</p><span className="px-2 py-1 bg-white/5 rounded-lg text-xs font-mono">{item.plan_type}</span></div></div>
                                                    {item.status === 'PENDING' && <button onClick={() => handleConfirmPayment(item.id, item.plan_type)} className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold transition-all mt-2 shadow-lg shadow-green-600/20 active:scale-95">Confirm Payment</button>}
                                                    {item.status === 'CONFIRMED' && item.activation_code && <div className="pt-2 border-t border-white/5"><p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Access Code</p><p className="font-mono text-sm text-green-400 font-bold mt-1 bg-green-400/5 p-2 rounded-lg border border-green-500/10 selection:bg-green-500/30">{item.activation_code.code}</p></div>}
                                                </div>
                                            )}
                                            {activeTab === 'codes' && (
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-start"><div className="flex-1 min-w-0"><p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Activation Key</p><p className="font-mono text-lg font-bold text-white truncate select-all">{item.code}</p></div><StatusBadge status={item.status} /></div>
                                                    <div className="grid grid-cols-2 gap-4 bg-white/5 p-3 rounded-xl border border-white/5"><div><p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Duration</p><p className="font-bold">{item.plan_duration_days} Days</p></div><div className="text-right"><p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Audit Source</p><p className="text-xs text-blue-400 font-mono font-bold">{item.payment_reference || 'MANUAL'}</p></div></div>
                                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5"><p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Generation Date</p><p className="text-xs text-gray-400 font-mono">{formatDate(item.generated_at)}</p></div>
                                                    {item.status === 'UNUSED' && <button onClick={() => handleRevokeCode(item.id)} className="w-full bg-red-600/10 text-red-500 py-3 rounded-xl font-bold text-sm border border-red-500/20 active:bg-red-600 active:text-white transition-colors">Revoke Activation</button>}
                                                </div>
                                            )}
                                            {activeTab === 'licenses' && (
                                                <div className="space-y-3">
                                                    <div><p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Target Device</p><p className="font-mono text-[10px] text-blue-300 break-all bg-black/40 p-3 rounded-xl border border-white/5">{item.device}</p></div>
                                                    <div className="grid grid-cols-2 gap-2"><div className="bg-white/5 p-2 rounded-lg border border-white/5"><p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Code</p><p className="font-mono text-[10px] text-gray-300 truncate">{item.activation_code || 'N/A'}</p></div><div className="bg-white/5 p-2 rounded-lg border border-white/5"><p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Status</p><p className={clsx("text-xs font-bold", item.is_active ? "text-green-400" : "text-red-400")}>{item.is_active ? "SECURE" : "EXPIRED"}</p></div></div>
                                                    <div className="flex justify-between items-center bg-blue-600/10 p-4 rounded-xl border border-blue-500/20"><div><p className="text-[10px] text-blue-400 uppercase tracking-widest font-bold leading-none mb-1">Expires On</p><p className="text-sm font-black">{formatDate(item.expiry_date)}</p></div><div className="flex gap-2">{item.is_active && <><button onClick={() => handleUpdateExpiry(item.id, item.expiry_date)} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20 active:scale-95"><Clock size={16} /></button><button onClick={() => handleRevokeLicense(item.id)} className="p-3 bg-red-600/20 text-red-500 rounded-xl border border-red-500/30 active:scale-95"><AlertCircle size={16} /></button></>}</div></div>
                                                </div>
                                            )}
                                            {activeTab === 'fleet' && (
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-start">
                                                        <div><p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Device Identifier</p><p className="font-mono text-xs text-blue-400">{item.fingerprint.slice(0, 16)}...</p></div>
                                                        <div className="text-right"><p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">IP Address</p><p className="text-xs font-black text-white">{item.last_ip || 'N/A'}</p></div>
                                                    </div>
                                                    <div className="bg-gradient-to-br from-white/[0.05] to-transparent p-4 rounded-2xl border border-white/5"><p className="text-lg font-black text-white">{item.model}</p><p className="text-xs text-gray-500 font-medium">Running {item.os_version}</p></div>
                                                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono"><div className="bg-black/20 p-2 rounded-lg border border-white/5"><p className="text-gray-600 uppercase font-black mb-1">Last Sync</p><p className="text-gray-400">{formatDateTime(item.last_seen)}</p></div><div className="bg-black/20 p-2 rounded-lg border border-white/5"><p className="text-gray-600 uppercase font-black mb-1">App Identity</p><p className="text-gray-400 truncate w-full">{item.user_agent || 'Unknown'}</p></div></div>
                                                    <div className="flex justify-between items-center bg-white/5 px-4 py-3 rounded-2xl border border-white/5">{item.trial_used ? <span className="text-red-400 text-[10px] font-black tracking-widest uppercase">Trial Over</span> : item.trial_start_date ? <span className="text-orange-400 text-[10px] font-black tracking-widest uppercase animate-pulse">On Trial Plan</span> : <span className="text-gray-500 text-[10px] font-black tracking-widest uppercase">Trial Ready</span>}{item.trial_start_date && !item.trial_used && <button onClick={() => handleRevokeTrial(item.fingerprint)} className="bg-red-500/20 text-red-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-red-500/30">Revoke</button>}</div>
                                                </div>
                                            )}
                                            {activeTab === 'audit' && (
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center"><span className="text-[10px] text-gray-500 font-mono">{formatDateTime(item.timestamp)}</span><span className={clsx("px-2 py-0.5 rounded-lg text-[9px] font-black border uppercase tracking-widest", item.action.includes('REVOKE') ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-blue-500/10 border-blue-500/20 text-blue-400")}>{item.action.replace('_', ' ')}</span></div>
                                                    <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/5"><div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-xs text-blue-400 font-black">{item.admin_username?.charAt(0).toUpperCase()}</div><div><p className="text-[10px] text-gray-500 font-bold uppercase leading-none mb-1">Admin</p><p className="text-sm font-black text-white leading-none">{item.admin_username || 'System'}</p></div></div>
                                                    <div className="grid grid-cols-2 gap-2 text-[10px]"><div className="bg-black/20 p-2 rounded-lg"><p className="text-gray-600 uppercase font-black mb-1">Target</p><p className="text-white font-bold truncate">{item.resource_type}: {item.resource_id.slice(0, 8)}</p></div><div className="bg-black/20 p-2 rounded-lg"><p className="text-gray-600 uppercase font-black mb-1">Origin IP</p><p className="text-white font-bold">{item.ip_address || 'Internal'}</p></div></div>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>

                                {data.length === 0 && (
                                    <div className="py-20 text-center text-gray-600 font-medium font-mono text-sm uppercase tracking-widest">No matching records found.</div>
                                )}
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        )
        }
                    </div >
                </main >
            </div >
        </div >
    );
};

const NavItem = ({ active, onClick, icon: Icon, label, badge, onNavItemClick }) => (
    <button
        onClick={() => { onClick(); onNavItemClick?.(); }}
        className={clsx(
            "flex items-center justify-between w-full p-4 rounded-2xl transition-all duration-300 gap-3 group",
            active ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
        )}
    >
        <div className="flex items-center gap-3">
            <Icon size={20} className={clsx("transition-transform duration-300", active ? "scale-110" : "group-hover:scale-110")} />
            <span className="font-semibold text-sm">{label}</span>
        </div>
        {badge && (
            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full ring-4 ring-black/40">
                {badge}
            </span>
        )}
    </button>
);

const StatusBadge = ({ status }) => {
    let icon = <Clock size={12} />;
    let style = "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";

    if (['CONFIRMED', 'USED', 'ACTIVE'].includes(status)) {
        icon = <CheckCircle2 size={12} />;
        style = "bg-green-500/10 text-green-400 border-green-500/20";
    } else if (['REJECTED', 'REVOKED'].includes(status)) {
        icon = <XCircle size={12} />;
        style = "bg-red-500/10 text-red-400 border-red-500/20";
    } else if (status === 'UNUSED') {
        icon = <Key size={12} />;
        style = "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }

    return (
        <span className={clsx("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider border", style)}>
            {icon}
            {status}
        </span>
    );
};

// --- Sub-Components for New Tabs ---

const AnalyticsView = ({ data }) => {
    // Expects data = { period: '24h', total_views: 100, top_channels: [{ channel__name: 'CNN', views: 50 }, ...] }
    const topChannels = data.top_channels || [];
    const maxViews = Math.max(...topChannels.map(c => c.views), 1);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Total Views (24h)</p>
                    <p className="text-4xl font-black text-white">{data.total_views}</p>
                </div>
                {/* Add more summary cards here */}
            </div>

            <div className="bg-white/5 p-8 rounded-3xl border border-white/5">
                <h3 className="text-xl font-bold text-white mb-6">Top Channels</h3>
                <div className="space-y-4">
                    {topChannels.map((channel, idx) => (
                        <div key={idx} className="space-y-2">
                            <div className="flex justify-between text-sm font-medium">
                                <span className="text-white">{idx + 1}. {channel.channel__name}</span>
                                <span className="text-gray-400">{channel.views} views</span>
                            </div>
                            <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(channel.views / maxViews) * 100}%` }}
                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                />
                            </div>
                        </div>
                    ))}
                    {topChannels.length === 0 && <p className="text-gray-500 text-center py-10">No analytics data reporting yet.</p>}
                </div>
            </div>
        </div>
    );
};

const ContentManager = ({ channels, onDelete }) => {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    // Simple client-side search for demo (server-side better for 10k items)
    // We already fetch via endpoint that supports search.
    // Dashboard fetchData currently overwrites `data`.
    // The Dashboard main data flow might need adjustment for pagination if we want robust content manager.
    // For now, we assume `channels` passed here is the list.

    return (
        <div className="bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <Film size={18} /> Channel Management
                </h3>
                <div className="flex bg-black/20 rounded-xl border border-white/5 p-1">
                    <input
                        type="text"
                        placeholder="Search channels..."
                        className="bg-transparent border-none focus:outline-none text-sm px-3 py-1 text-white w-48"
                        onChange={(e) => setSearch(e.target.value)} // Bind to parent fetch if implementing real search
                    />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-white/[0.02] text-gray-400 text-xs font-bold uppercase tracking-widest">
                        <tr>
                            <th className="p-6">Name</th>
                            <th className="p-6">Category</th>
                            <th className="p-6">Country</th>
                            <th className="p-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {channels.map((channel) => (
                            <tr key={channel.id} className="hover:bg-white/[0.02]">
                                <td className="p-6 font-bold text-white max-w-xs truncate">{channel.name}</td>
                                <td className="p-6 text-sm text-gray-400">{channel.category}</td>
                                <td className="p-6 text-sm text-gray-400">{channel.country}</td>
                                <td className="p-6 text-right">
                                    <button
                                        onClick={() => onDelete(channel.id)}
                                        className="text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 p-2 rounded-lg transition-colors"
                                        title="Delete Channel"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDashboard;
