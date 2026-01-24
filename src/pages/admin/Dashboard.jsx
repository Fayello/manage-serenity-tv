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
    Settings
} from 'lucide-react';
import clsx from 'clsx';
import AdminUsers from './AdminUsers';
import LicenseManager from './LicenseManager';

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
        currency: 'XAF'
    });
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (activeTab === 'settings') return; // No generic data fetch for settings
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
                case 'payments': endpoint = '/admin/payments/'; break;
                case 'codes': endpoint = '/admin/codes/'; break;
                case 'licenses': endpoint = '/admin/licenses/'; break;
                case 'fleet': endpoint = '/admin/devices/'; break;
                default: endpoint = '/admin/payments/';
            }
            const response = await api.get(endpoint);
            setData(response.data);
        } catch (error) {
            console.error("Failed to fetch data", error);
        }
        setLoading(false);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        if (activeTab !== 'settings') {
            await Promise.all([fetchData(), fetchStats()]);
        } else {
            await fetchStats();
        }
        setRefreshing(false);
    };

    const handleConfirmPayment = async (id, planType) => {
        const defaultDuration = planType === '1_YEAR' ? 365 : 1095;
        const duration = prompt(`Confirm payment and generate code?\nEnter custom duration in DAYS (default ${defaultDuration}):`, defaultDuration);
        if (duration === null) return;

        try {
            const response = await api.post(`/admin/payments/${id}/confirm/`, { duration: parseInt(duration) });
            alert(`Generated Code: ${response.data.generated_code}`);
            handleRefresh();
        } catch (error) {
            alert("Error confirming payment");
        }
    };

    const handleRevokeLicense = async (id) => {
        const reason = prompt("Enter revocation reason:");
        if (!reason) return;
        try {
            await api.post(`/admin/licenses/${id}/revoke/`, { reason });
            alert("License revoked");
            handleRefresh();
        } catch (error) {
            alert("Error revoking license");
        }
    };

    const handleGenerateCode = async () => {
        const duration = prompt("Enter duration in days (default 365):", "365");
        if (!duration) return;
        try {
            const response = await api.post('/admin/codes/generate/', { duration: parseInt(duration) });
            alert(`Generated Code: ${response.data.code}`);
            handleRefresh();
        } catch (error) {
            alert("Error generating code");
        }
    };

    const handleRevokeCode = async (id) => {
        if (!window.confirm("Revoke this activation code? It will no longer be usable.")) return;
        try {
            await api.post(`/admin/codes/${id}/revoke/`);
            alert("Code revoked");
            handleRefresh();
        } catch (error) {
            alert("Error revoking code");
        }
    };

    const handleRevokeTrial = async (fingerprint) => {
        if (!window.confirm("Revoke trial for this device?")) return;
        try {
            await api.post(`/admin/devices/${fingerprint}/revoke_trial/`);
            alert("Trial revoked");
            handleRefresh();
        } catch (error) {
            alert("Error revoking trial");
        }
    };

    const handleUpdateExpiry = async (id, currentExpiry) => {
        const newExpiry = prompt("Enter new expiration date (YYYY-MM-DD):", currentExpiry.split('T')[0]);
        if (!newExpiry) return;
        try {
            await api.post(`/admin/licenses/${id}/update_expiry/`, { new_expiry: newExpiry });
            alert("Expiration updated");
            handleRefresh();
        } catch (error) {
            alert("Error updating expiration");
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/admin/login');
    };

    const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl flex items-start justify-between shadow-2xl relative overflow-hidden group"
        >
            <div className={clsx("absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 transition-opacity group-hover:opacity-20", color)} />
            <div>
                <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
                {subtitle && <p className="text-xs text-gray-500 font-medium">{subtitle}</p>}
            </div>
            <div className={clsx("p-3 rounded-xl bg-white/5 border border-white/5", color.replace('bg-', 'text-'))}>
                <Icon size={24} />
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-[#050510] relative overflow-hidden text-white font-['Inter',sans-serif]">
            {/* Mesh Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full" />

            <div className="relative z-10 flex min-h-screen">
                {/* Sidebar */}
                <aside className="w-72 bg-black/40 backdrop-blur-3xl border-r border-white/5 p-8 flex flex-col">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <LayoutDashboard size={20} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-black bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">SERENITY</h1>
                    </div>

                    <nav className="flex-1 space-y-2">
                        <NavItem
                            active={activeTab === 'payments'}
                            onClick={() => setActiveTab('payments')}
                            icon={CreditCard}
                            label="Payments"
                            badge={stats.pending_payments > 0 ? stats.pending_payments : null}
                        />
                        <NavItem
                            active={activeTab === 'codes'}
                            onClick={() => setActiveTab('codes')}
                            icon={Key}
                            label="Activation Codes"
                        />
                        <NavItem
                            active={activeTab === 'licenses'}
                            onClick={() => setActiveTab('licenses')}
                            icon={Smartphone}
                            label="User Licenses"
                        />
                        <NavItem
                            active={activeTab === 'fleet'}
                            onClick={() => setActiveTab('fleet')}
                            icon={DeviceIcon}
                            label="Device Fleet"
                        />
                        <div className="pt-4 mt-4 border-t border-white/10">
                            <NavItem
                                active={activeTab === 'settings'}
                                onClick={() => setActiveTab('settings')}
                                icon={Settings}
                                label="Settings"
                            />
                        </div>
                    </nav>

                    <button
                        onClick={handleLogout}
                        className="mt-auto flex items-center gap-3 p-4 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all duration-300 w-full group"
                    >
                        <LogOut size={20} className="transition-transform group-hover:-translate-x-1" />
                        <span className="font-semibold text-sm">Sign Out</span>
                    </button>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-10 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        <header className="flex justify-between items-end mb-10">
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-2">Management Console</h2>
                                <p className="text-gray-400">Manage your subscribers and monitor system growth.</p>
                            </div>
                            <button
                                onClick={handleRefresh}
                                className={clsx(
                                    "p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all",
                                    refreshing && "animate-spin"
                                )}
                            >
                                <RefreshCw size={22} />
                            </button>
                        </header>

                        {/* Stats Grid */}
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

                        {/* Content Area */}
                        {activeTab === 'settings' ? (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-3xl p-8">
                                    <AdminUsers />
                                </div>
                                <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-3xl p-8">
                                    <LicenseManager />
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                                <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                                    <h3 className="font-bold text-lg flex items-center gap-2">
                                        {activeTab === 'payments' && <><CreditCard size={18} /> Recent Transactions</>}
                                        {activeTab === 'codes' && <><Key size={18} /> Master Codes</>}
                                        {activeTab === 'licenses' && <><Smartphone size={18} /> Active Licenses</>}
                                        {activeTab === 'fleet' && <><DeviceIcon size={18} /> Device Registry</>}
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

                                <div className="overflow-x-auto min-h-[400px]">
                                    <AnimatePresence mode="wait">
                                        {loading ? (
                                            <div className="flex flex-col items-center justify-center p-20 gap-4">
                                                <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                                                <p className="text-gray-500 font-medium font-mono text-sm">SYNCHRONIZING SECURE DATA...</p>
                                            </div>
                                        ) : (
                                            <motion.table
                                                key={activeTab}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="w-full text-left"
                                            >
                                                <thead className="bg-white/[0.02] text-gray-400 text-xs font-bold uppercase tracking-widest">
                                                    <tr>
                                                        {activeTab === 'payments' && (
                                                            <>
                                                                <th className="p-6">Reference</th>
                                                                <th className="p-6">Amount</th>
                                                                <th className="p-6">Plan</th>
                                                                <th className="p-6">Status</th>
                                                                <th className="p-6">Actions</th>
                                                            </>
                                                        )}
                                                        {activeTab === 'codes' && (
                                                            <>
                                                                <th className="p-6">Access Code</th>
                                                                <th className="p-6">Duration</th>
                                                                <th className="p-6">State</th>
                                                                <th className="p-6">Issued On</th>
                                                                <th className="p-6">Actions</th>
                                                            </>
                                                        )}
                                                        {activeTab === 'licenses' && (
                                                            <>
                                                                <th className="p-6">Device Fingerprint</th>
                                                                <th className="p-6">Linked Code</th>
                                                                <th className="p-6">Expiration</th>
                                                                <th className="p-6">Status</th>
                                                                <th className="p-6">Actions</th>
                                                            </>
                                                        )}
                                                        {activeTab === 'fleet' && (
                                                            <>
                                                                <th className="p-6">Fingerprint</th>
                                                                <th className="p-6">Model/OS</th>
                                                                <th className="p-6">First Seen</th>
                                                                <th className="p-6">Last Seen</th>
                                                                <th className="p-6">Trial Status</th>
                                                                <th className="p-6">Actions</th>
                                                            </>
                                                        )}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {data.map((item, idx) => (
                                                        <motion.tr
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: idx * 0.05 }}
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
                                                                        {item.status === 'PENDING' && (
                                                                            <button onClick={() => handleConfirmPayment(item.id, item.plan_type)} className="bg-green-600/10 text-green-400 border border-green-500/20 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600 hover:text-white transition-all">Confirm Payment</button>
                                                                        )}
                                                                        {item.status === 'CONFIRMED' && item.activation_code && (
                                                                            <span className="font-mono text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">{item.activation_code.code}</span>
                                                                        )}
                                                                    </td>
                                                                </>
                                                            )}
                                                            {activeTab === 'codes' && (
                                                                <>
                                                                    <td className="p-6 font-mono text-sm font-bold text-white select-all">{item.code}</td>
                                                                    <td className="p-6 text-gray-400 text-sm">{item.plan_duration_days} Days</td>
                                                                    <td className="p-6"><StatusBadge status={item.status} /></td>
                                                                    <td className="p-6 text-gray-500 text-sm font-mono">{new Date(item.generated_at).toLocaleDateString()}</td>
                                                                    <td className="p-6">
                                                                        {item.status === 'UNUSED' && (
                                                                            <button onClick={() => handleRevokeCode(item.id)} className="text-gray-500 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded-lg transition-all" title="Revoke Code">
                                                                                <AlertCircle size={18} />
                                                                            </button>
                                                                        )}
                                                                    </td>
                                                                </>
                                                            )}
                                                            {activeTab === 'licenses' && (
                                                                <>
                                                                    <td className="p-6 font-mono text-xs text-blue-300 max-w-[200px] truncate" title={item.device}>{item.device}</td>
                                                                    <td className="p-6 font-mono text-xs text-gray-500">{item.activation_code}</td>
                                                                    <td className="p-6 font-bold text-sm">{new Date(item.expiry_date).toLocaleDateString()}</td>
                                                                    <td className="p-6">
                                                                        <div className={clsx(
                                                                            "flex items-center gap-2 text-xs font-bold",
                                                                            item.is_active ? "text-green-400" : "text-red-400"
                                                                        )}>
                                                                            {item.is_active ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                                                            {item.is_active ? "SECURED" : "REVOKED"}
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-6">
                                                                        <div className="flex items-center gap-2">
                                                                            {item.is_active && (
                                                                                <>
                                                                                    <button
                                                                                        onClick={() => handleUpdateExpiry(item.id, item.expiry_date)}
                                                                                        className="text-blue-400 hover:text-blue-300 p-1.5 hover:bg-blue-500/10 rounded-lg transition-all"
                                                                                        title="Change Expiration"
                                                                                    >
                                                                                        <Clock size={18} />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => handleRevokeLicense(item.id)}
                                                                                        className="text-gray-500 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded-lg transition-all"
                                                                                        title="Revoke License"
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
                                                                    <td className="p-6 font-mono text-xs text-blue-300">{item.fingerprint}</td>
                                                                    <td className="p-6">
                                                                        <div className="text-sm font-bold text-white">{item.model}</div>
                                                                        <div className="text-[10px] text-gray-500">{item.os_version}</div>
                                                                    </td>
                                                                    <td className="p-6 text-gray-400 text-xs">{new Date(item.first_seen).toLocaleDateString()}</td>
                                                                    <td className="p-6 text-gray-400 text-xs">{new Date(item.last_seen).toLocaleString()}</td>
                                                                    <td className="p-6">
                                                                        {item.trial_used ? (
                                                                            <span className="text-red-400 text-[10px] font-black tracking-wider uppercase bg-red-400/10 px-2 py-1 rounded-full border border-red-500/20">Trial Expired</span>
                                                                        ) : item.trial_start_date ? (
                                                                            <span className="text-orange-400 text-[10px] font-black tracking-wider uppercase bg-orange-400/10 px-2 py-1 rounded-full border border-orange-500/20 shadow-[0_0_10px_rgba(251,146,60,0.2)] animate-pulse">On Trial</span>
                                                                        ) : (
                                                                            <span className="text-gray-500 text-[10px] font-black tracking-wider uppercase bg-white/5 px-2 py-1 rounded-full border border-white/5">Not Started</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="p-6">
                                                                        {item.trial_start_date && !item.trial_used && (
                                                                            <button onClick={() => handleRevokeTrial(item.fingerprint)} className="text-gray-500 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded-lg transition-all" title="Revoke Trial">
                                                                                <AlertCircle size={18} />
                                                                            </button>
                                                                        )}
                                                                    </td>
                                                                </>
                                                            )}
                                                        </motion.tr>
                                                    ))}
                                                    {data.length === 0 && (
                                                        <tr><td colSpan="5" className="p-20 text-center text-gray-600 font-medium">No system records found for this entry.</td></tr>
                                                    )}
                                                </tbody>
                                            </motion.table>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

const NavItem = ({ active, onClick, icon: Icon, label, badge }) => (
    <button
        onClick={onClick}
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

export default AdminDashboard;
