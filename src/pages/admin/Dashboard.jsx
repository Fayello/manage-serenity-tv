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
import AdminUsers from './AdminUsers';
import GenerateCodeModal from '../../components/GenerateCodeModal';

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
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [generateModalOpen, setGenerateModalOpen] = useState(false);

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
                case 'content': endpoint = '/channels/?limit=100'; break;
                case 'payments': endpoint = '/admin/payments/'; break;
                case 'codes': endpoint = '/admin/codes/'; break;
                case 'licenses': endpoint = '/admin/licenses/'; break;
                case 'fleet': endpoint = '/admin/devices/'; break;
                case 'audit': endpoint = '/admin/audit-logs/'; break;
                default: endpoint = '/admin/payments/';
            }
            const response = await api.get(endpoint);
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

    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchData(), fetchStats()]);
        setRefreshing(false);
        showToast("Dashboard Synchronized");
    };

    const handleConfirmPayment = (id, plan) => {
        setActionModal({
            isOpen: true,
            type: 'success',
            title: 'Confirm Payment',
            message: `Verify receipt of payment for ${plan} plan? This will issue an activation code.`,
            confirmText: 'Confirm & Activate',
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    await api.post(`/admin/payments/${id}/confirm/`);
                    showToast("Payment confirmed and code issued");
                    handleRefresh();
                    setActionModal(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    showToast("Failed to confirm payment", 'error');
                }
                setActionLoading(false);
            }
        });
    };

    const handleGenerateCode = () => {
        setGenerateModalOpen(true);
    };

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

    const handleRevokeCode = (id) => {
        setActionModal({
            isOpen: true,
            type: 'danger',
            title: 'Revoke Code',
            message: 'Are you sure? This code will no longer be usable.',
            confirmText: 'Revoke',
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    await api.post(`/admin/codes/${id}/revoke/`);
                    showToast("Code revoked");
                    handleRefresh();
                    setActionModal(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    showToast("Failed to revoke code", 'error');
                }
                setActionLoading(false);
            }
        });
    };

    const handleRevokeLicense = (id) => {
        setActionModal({
            isOpen: true,
            type: 'danger',
            title: 'Revoke License',
            message: 'Are you sure? Access will be cut off for this device immediately.',
            confirmText: 'Revoke Access',
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    await api.post(`/admin/licenses/${id}/revoke/`);
                    showToast("License revoked");
                    handleRefresh();
                    setActionModal(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    showToast("Failed to revoke license", 'error');
                }
                setActionLoading(false);
            }
        });
    };

    return (
        <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-blue-500/30">
            {/* Sidebar Overlay for Mobile */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMenuOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={clsx(
                "fixed lg:relative inset-y-0 left-0 w-72 bg-black/40 backdrop-blur-2xl border-r border-white/5 z-50 transform transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
                isMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                <div className="flex flex-col h-full p-6">
                    <div className="flex items-center gap-3 mb-10 px-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 rotate-3">
                            <LayoutDashboard size={24} className="text-white -rotate-3" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tighter leading-none">SERENITY</h1>
                            <p className="text-[10px] font-bold text-blue-500 tracking-[0.2em] uppercase mt-1">Command Center</p>
                        </div>
                    </div>

                    <nav className="flex-1 space-y-2">
                        <NavItem active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={BarChart3} label="Smart Metrics" onNavItemClick={() => setIsMenuOpen(false)} />
                        <NavItem active={activeTab === 'content'} onClick={() => setActiveTab('content')} icon={Film} label="Content Manager" onNavItemClick={() => setIsMenuOpen(false)} />
                        <div className="pt-4 mt-4 border-t border-white/10">
                            <NavItem active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} icon={CreditCard} label="Payments" badge={stats.pending_payments > 0 ? stats.pending_payments : null} onNavItemClick={() => setIsMenuOpen(false)} />
                            <NavItem active={activeTab === 'codes'} onClick={() => setActiveTab('codes')} icon={Key} label="Activation Codes" onNavItemClick={() => setIsMenuOpen(false)} />
                            <NavItem active={activeTab === 'licenses'} onClick={() => setActiveTab('licenses')} icon={Smartphone} label="User Licenses" onNavItemClick={() => setIsMenuOpen(false)} />
                            <NavItem active={activeTab === 'fleet'} onClick={() => setActiveTab('fleet')} icon={DeviceIcon} label="Device Fleet" onNavItemClick={() => setIsMenuOpen(false)} />
                            <NavItem active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} icon={Shield} label="Security Logs" onNavItemClick={() => setIsMenuOpen(false)} />
                        </div>
                        <div className="pt-4 mt-4 border-t border-white/10">
                            <NavItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={Settings} label="Settings" onNavItemClick={() => setIsMenuOpen(false)} />
                        </div>
                    </nav>

                    <div className="mt-auto pt-6">
                        <button
                            onClick={() => { authService.logout(); navigate('/admin/login'); }}
                            className="flex items-center gap-3 w-full p-4 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all duration-300 font-bold text-sm"
                        >
                            <LogOut size={20} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 relative overflow-y-auto overflow-x-hidden bg-black/20">
                <header className="sticky top-0 z-30 flex items-center justify-between p-6 lg:p-10 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsMenuOpen(true)} className="lg:hidden p-2 bg-white/5 rounded-xl border border-white/10">
                            <LayoutDashboard size={20} />
                        </button>
                        <h2 className="text-2xl font-black tracking-tight capitalize">{activeTab.replace('-', ' ')}</h2>
                    </div>
                    <button onClick={handleRefresh} className={clsx("p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all", refreshing && "animate-spin")}>
                        <RefreshCw size={20} />
                    </button>
                </header>

                <div className="p-6 lg:p-10 max-w-7xl mx-auto pb-32">
                    {/* Stats Grid */}
                    {activeTab !== 'analytics' && activeTab !== 'content' && activeTab !== 'settings' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
                            <StatCard title="Total Billing" value={`${stats.revenue.toLocaleString()} ${stats.currency}`} subtitle="Lifetime revenue" icon={TrendingUp} color="bg-blue-500" />
                            <StatCard title="Active Users" value={stats.active_users} subtitle="Last 24h" icon={Users} color="bg-green-500" />
                            <StatCard title="Active Trials" value={stats.trial_users} subtitle="3-day trial" icon={Clock} color="bg-orange-500" />
                            <StatCard title="Pending Syncs" value={stats.pending_payments} subtitle="Awaiting approval" icon={Clock} color="bg-yellow-500" />
                            <StatCard title="Total Fleet" value={stats.total_devices} subtitle="Unique handsets" icon={DeviceIcon} color="bg-purple-500" />
                        </div>
                    )}

                    {/* Views */}
                    {activeTab === 'analytics' && <AnalyticsView data={data} />}
                    {activeTab === 'content' && <ContentManager channels={Array.isArray(data) ? data : []} onDelete={handleDeleteChannel} />}
                    {activeTab === 'settings' && (
                        <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 border-white/10">
                            <AdminUsers />
                        </div>
                    )}

                    {/* Main Tables */}
                    {['payments', 'codes', 'licenses', 'fleet', 'audit'].includes(activeTab) && (
                        <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl border-white/10">
                            <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    {activeTab === 'payments' && <><CreditCard size={18} /> Recent Transactions</>}
                                    {activeTab === 'codes' && <><Key size={18} /> Master Codes</>}
                                    {activeTab === 'licenses' && <><Smartphone size={18} /> User Licenses</>}
                                    {activeTab === 'fleet' && <><DeviceIcon size={18} /> Device Registry</>}
                                    {activeTab === 'audit' && <><Shield size={18} /> Security Logs</>}
                                </h3>
                                {activeTab === 'codes' && (
                                    <button onClick={handleGenerateCode} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 transition-all">+ New Activation</button>
                                )}
                            </div>
                            <div className="p-0 min-h-[400px]">
                                <AnimatePresence mode="wait">
                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center p-20 gap-4">
                                            <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                                            <p className="text-gray-500 font-medium text-sm font-mono uppercase tracking-tighter">Syncing data...</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="bg-white/[0.02] text-gray-400 text-xs font-bold uppercase tracking-widest">
                                                    <tr>
                                                        {activeTab === 'payments' && <><th className="p-6">Reference</th><th className="p-6">Amount</th><th className="p-6">Plan</th><th className="p-6">Status</th><th className="p-6 text-right">Ops</th></>}
                                                        {activeTab === 'codes' && <><th className="p-6">Access Code</th><th className="p-6">Duration</th><th className="p-6">Reference</th><th className="p-6">State</th><th className="p-6 text-right">Ops</th></>}
                                                        {activeTab === 'licenses' && <><th className="p-6">Device</th><th className="p-6">Linked Code</th><th className="p-6">Expiration</th><th className="p-6">Status</th><th className="p-6 text-right">Ops</th></>}
                                                        {activeTab === 'fleet' && <><th className="p-6">Model</th><th className="p-6">Specs</th><th className="p-6">Network</th><th className="p-6">Last Seen</th><th className="p-6">Trial</th></>}
                                                        {activeTab === 'audit' && <><th className="p-6">Time</th><th className="p-6">Admin</th><th className="p-6">Action</th><th className="p-6">Target</th><th className="p-6">Details</th></>}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {data.map((item, idx) => (
                                                        <tr key={item.id || item.code || item.fingerprint} className="hover:bg-white/[0.02] transition-colors group">
                                                            {activeTab === 'payments' && (
                                                                <>
                                                                    <td className="p-6 font-mono text-sm text-blue-400 font-bold">{item.payment_reference}</td>
                                                                    <td className="p-6 font-bold">{item.amount} {item.currency}</td>
                                                                    <td className="p-6 text-xs text-gray-400">{item.plan_type}</td>
                                                                    <td className="p-6"><StatusBadge status={item.status} /></td>
                                                                    <td className="p-6 text-right">
                                                                        {item.status === 'PENDING' && <button onClick={() => handleConfirmPayment(item.id, item.plan_type)} className="bg-green-600/10 text-green-400 px-4 py-1.5 rounded-lg text-xs font-bold border border-green-500/20 hover:bg-green-600 hover:text-white transition-all">Confirm</button>}
                                                                    </td>
                                                                </>
                                                            )}
                                                            {activeTab === 'codes' && (
                                                                <>
                                                                    <td className="p-6 font-mono text-white font-bold">{item.code}</td>
                                                                    <td className="p-6 text-gray-400 text-sm">{item.plan_duration_days} Days</td>
                                                                    <td className="p-6 text-xs font-mono text-gray-500 uppercase">
                                                                        {item.client_reference ? <span className="text-white bg-blue-600/20 px-2 py-1 rounded border border-blue-500/30">{item.client_reference}</span> : (item.payment_reference || 'MANUAL')}
                                                                    </td>
                                                                    <td className="p-6"><StatusBadge status={item.status} /></td>
                                                                    <td className="p-6 text-right">
                                                                        {item.status === 'UNUSED' && <button onClick={() => handleRevokeCode(item.id)} className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-all"><Trash2 size={16} /></button>}
                                                                    </td>
                                                                </>
                                                            )}
                                                            {activeTab === 'licenses' && (
                                                                <>
                                                                    <td className="p-6 font-mono text-xs text-gray-400 max-w-[150px] truncate">{item.device}</td>
                                                                    <td className="p-6 font-mono text-xs text-blue-300">{item.activation_code}</td>
                                                                    <td className="p-6 text-sm font-bold">{formatDate(item.expiry_date)}</td>
                                                                    <td className="p-6"><span className={clsx("px-2 py-1 rounded text-[10px] font-bold", item.is_active ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400")}>{item.is_active ? 'ACTIVE' : 'EXPIRED'}</span></td>
                                                                    <td className="p-6 text-right">
                                                                        {item.is_active && <button onClick={() => handleRevokeLicense(item.id)} className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-all"><Trash2 size={16} /></button>}
                                                                    </td>
                                                                </>
                                                            )}
                                                            {activeTab === 'fleet' && (
                                                                <>
                                                                    <td className="p-6 font-bold text-sm">{item.model}</td>
                                                                    <td className="p-6 text-xs text-gray-500 font-mono">{item.os_version}</td>
                                                                    <td className="p-6 text-xs font-bold text-blue-400">{item.last_ip}</td>
                                                                    <td className="p-6 text-xs text-gray-500">{formatDateTime(item.last_seen)}</td>
                                                                    <td className="p-6">
                                                                        <span className={clsx("text-[10px] font-black uppercase px-2 py-1 rounded", item.trial_used ? "bg-red-500/10 text-red-500" : item.trial_start_date ? "bg-orange-500/10 text-orange-400" : "bg-gray-500/10 text-gray-500")}>
                                                                            {item.trial_used ? 'Expired' : item.trial_start_date ? 'Trialing' : 'None'}
                                                                        </span>
                                                                    </td>
                                                                </>
                                                            )}
                                                            {activeTab === 'audit' && (
                                                                <>
                                                                    <td className="p-6 text-xs text-gray-500 font-mono">{formatDateTime(item.timestamp)}</td>
                                                                    <td className="p-6 text-xs font-bold text-blue-400">{item.admin_username || 'System'}</td>
                                                                    <td className="p-6"><span className="px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-widest border-white/10 bg-white/5">{item.action.replace('_', ' ')}</span></td>
                                                                    <td className="p-6 text-xs text-gray-400 truncate max-w-[100px]">{item.resource_type}: {item.resource_id.slice(0, 8)}</td>
                                                                    <td className="p-6 text-[10px] text-gray-600 truncate max-w-[150px]">{JSON.stringify(item.details)}</td>
                                                                </>
                                                            )}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {data.length === 0 && <div className="p-20 text-center text-gray-600 font-mono text-sm tracking-widest">NO RECORDS FOUND</div>}
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <ActionModal {...actionModal} loading={actionLoading} onClose={() => setActionModal(prev => ({ ...prev, isOpen: false }))} />
            <GenerateCodeModal
                isOpen={generateModalOpen}
                onClose={() => setGenerateModalOpen(false)}
                onSuccess={() => { showToast("License Generated Successfully"); handleRefresh(); }}
            />
            {toast && <div className={clsx("fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-2xl z-[100] animate-in fade-in slide-in-from-bottom-5", toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600')}><span className="font-bold text-sm">{toast.message}</span></div>}
        </div>
    );
};

const NavItem = ({ active, onClick, icon: Icon, label, badge, onNavItemClick }) => (
    <button onClick={() => { onClick(); onNavItemClick?.(); }} className={clsx("flex items-center justify-between w-full p-4 rounded-2xl transition-all duration-300 gap-3 group", active ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : "text-gray-500 hover:text-gray-300 hover:bg-white/5")}>
        <div className="flex items-center gap-3"><Icon size={20} className={clsx("transition-transform", active ? "scale-110" : "group-hover:scale-110")} /><span className="font-semibold text-sm">{label}</span></div>
        {badge && <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full ring-4 ring-black/40">{badge}</span>}
    </button>
);

const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
    <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-3xl p-6 transition-all hover:bg-white/10">
        <div className={clsx("p-3 rounded-2xl inline-block mb-4", color)}><Icon size={20} className="text-white" /></div>
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-2xl font-black text-white">{value}</h3>
        <p className="text-gray-500 text-[10px] mt-1">{subtitle}</p>
    </div>
);

const StatusBadge = ({ status }) => {
    let style = "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    if (['CONFIRMED', 'USED', 'ACTIVE'].includes(status)) style = "bg-green-500/10 text-green-400 border-green-500/20";
    else if (['REJECTED', 'REVOKED'].includes(status)) style = "bg-red-500/10 text-red-400 border-red-500/20";
    return <span className={clsx("px-2 py-0.5 rounded-lg text-[9px] font-black border uppercase tracking-widest", style)}>{status}</span>;
};

const AnalyticsView = ({ data }) => {
    const topChannels = data.top_content || [];
    const recentActivity = data.recent_activity || [];
    const maxViews = Math.max(...topChannels.map(c => c.views), 1);

    const relativeTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="space-y-12">
            {/* Top Content */}
            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <TrendingUp size={20} className="text-blue-500" />
                    Top Performing Content
                </h3>
                <div className="space-y-4">
                    {topChannels.slice(0, 5).map((channel, idx) => (
                        <div key={idx} className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-bold">{idx + 1}. {channel.channel__name}</span>
                                <span className="text-gray-400 font-mono text-[10px]">{channel.views} VIEWS</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${(channel.views / maxViews) * 100}%` }} className="h-full bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Live Activity Feed */}
            <div className="bg-white/5 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                    <h3 className="font-bold text-xl flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                        Live Audience Activity
                    </h3>
                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest bg-white/5 px-3 py-1 rounded-full">Real-time Stream</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/[0.02] text-gray-500 text-[10px] font-black uppercase tracking-widest">
                            <tr>
                                <th className="p-6">Time</th>
                                <th className="p-6">Viewer / Client</th>
                                <th className="p-6">Content</th>
                                <th className="p-6">Location</th>
                                <th className="p-6">Device</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {recentActivity.map((event) => (
                                <tr key={event.id} className="hover:bg-white/[0.01] transition-colors">
                                    <td className="p-6 text-xs font-mono text-blue-400 whitespace-nowrap">{relativeTime(event.time)}</td>
                                    <td className="p-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-white">{event.reference}</span>
                                            <span className="text-[10px] text-gray-600 font-mono">{event.ip}</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                                                <Film size={14} className="text-blue-500" />
                                            </div>
                                            <span className="text-sm font-medium text-gray-300">{event.channel}</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-gray-400">
                                            {event.country}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <span className="text-[10px] text-gray-500 font-mono uppercase italic">{event.device_model}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {recentActivity.length === 0 && (
                        <div className="p-20 text-center text-gray-600 font-mono text-sm tracking-widest">AWAITING VIEWER ACTIVITY...</div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ContentManager = ({ channels, onDelete }) => (
    <div className="bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center"><h3 className="font-bold flex items-center gap-2"><Film size={18} /> Catalog Master</h3></div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-white/[0.02] text-gray-400 text-[10px] font-black uppercase tracking-widest">
                    <tr><th className="p-6">Name</th><th className="p-6">Category</th><th className="p-6">Region</th><th className="p-6 text-right">Ops</th></tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {channels.map((ch) => (
                        <tr key={ch.id} className="hover:bg-white/[0.01]">
                            <td className="p-6 font-bold text-sm">{ch.name}</td>
                            <td className="p-6 text-xs text-blue-400">{ch.category}</td>
                            <td className="p-6 text-xs text-gray-500">{ch.country}</td>
                            <td className="p-6 text-right"><button onClick={() => onDelete(ch.id)} className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-all"><Trash2 size={16} /></button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export default AdminDashboard;
