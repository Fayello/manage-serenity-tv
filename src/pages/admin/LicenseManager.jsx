import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const LicenseManager = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resetSuccess, setResetSuccess] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);
        setResetSuccess(null);

        try {
            // We search by Activation Code logic. 
            // Since we don't have a direct "Search License by Code" endpoint exposed easily nicely 
            // (unless we filter list), let's assume we search by Device Hash for now or exact Code string.
            // Actually, backend 'AdminLicenseViewSet' is generic.
            // Let's list all licenses and filter client side for MVP or use generic generic search if configured.
            // Wait, looking at AdminLicenseViewSet, it has no search fields defined? default ModelViewSet.
            // Let's try to fetch all licenses and filter (not ideal for scale but ok for mvp)
            // Or better: Search by activation code?

            // Let's assume the admin has the "Code" connected to the User.
            // So we search activation codes.

            const response = await api.get('/admin/licenses/');
            // This returns a list. We filter match.
            const licenses = response.data.results || response.data;
            const found = licenses.find(l =>
                l.activation_code?.code === searchTerm ||
                l.device?.fingerprint === searchTerm
            );

            if (found) {
                setResult(found);
            } else {
                setError('No license found with that Code or Device Hash');
            }
        } catch (err) {
            setError('Search failed: ' + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        if (!result) return;
        if (!window.confirm(`Are you sure you want to RESET license for ${result.device?.model}? \nThis will UNLINK the device and allow the code to be used again.`)) return;

        setLoading(true);
        try {
            const response = await api.post(`/admin/licenses/${result.id}/reset/`);
            setResetSuccess(response.data.message);
            setResult(null); // Clear result as it's now invalid/reset
        } catch (err) {
            setError('Reset failed: ' + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-gray-800 rounded-lg border border-gray-700 text-white min-h-[500px]">
            <h2 className="text-2xl font-bold mb-6 text-blue-400">License Manager (Reset Tool)</h2>

            <form onSubmit={handleSearch} className="flex gap-4 mb-8">
                <input
                    type="text"
                    placeholder="Enter Activation Code or Device Hash"
                    className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 rounded hover:bg-blue-700 font-bold"
                    disabled={loading}
                >
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </form>

            {error && <div className="p-4 bg-red-900/50 text-red-200 rounded mb-4">{error}</div>}
            {resetSuccess && <div className="p-4 bg-green-900/50 text-green-200 rounded mb-4">{resetSuccess}</div>}

            {result && (
                <div className="bg-gray-700 p-6 rounded-lg border border-gray-600 space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1">License Found</h3>
                            <p className="text-gray-400 text-sm">ID: {result.id}</p>
                        </div>
                        <span className={`px-3 py-1 rounded text-sm font-bold ${result.is_active ? 'bg-green-600' : 'bg-red-600'}`}>
                            {result.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-gray-800 p-3 rounded">
                            <span className="block text-gray-500 mb-1">Device Model</span>
                            <span className="font-mono">{result.device?.model}</span>
                        </div>
                        <div className="bg-gray-800 p-3 rounded">
                            <span className="block text-gray-500 mb-1">OS Version</span>
                            <span>{result.device?.os_version}</span>
                        </div>
                        <div className="bg-gray-800 p-3 rounded">
                            <span className="block text-gray-500 mb-1">Activation Code</span>
                            <span className="font-mono text-yellow-400">{result.activation_code?.code}</span>
                        </div>
                        <div className="bg-gray-800 p-3 rounded">
                            <span className="block text-gray-500 mb-1">Expiry Date</span>
                            <span>{new Date(result.expiry_date).toLocaleDateString()}</span>
                        </div>
                    </div>

                    {result.is_active && (
                        <div className="pt-4 border-t border-gray-600">
                            <button
                                onClick={handleReset}
                                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded shadow-lg uppercase tracking-wider"
                            >
                                ⚠️ Master Reset Device Link
                            </button>
                            <p className="text-xs text-gray-400 mt-2 text-center">
                                This will deactivate this license and make the code available for a new device immediately.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LicenseManager;
