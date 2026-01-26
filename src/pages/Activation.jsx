import React, { useState, useEffect } from 'react';
import { getDeviceId, activateDevice } from '../utils/device';
import { Lock, Tv, CheckCircle } from 'lucide-react';
import PinSuccessModal from '../components/PinSuccessModal';

const Activation = ({ onActivate }) => {
    const [activationCode, setActivationCode] = useState('');
    const [error, setError] = useState('');
    const [deviceId, setDeviceId] = useState('');
    const [showPinModal, setShowPinModal] = useState(false);
    const [showPinEntry, setShowPinEntry] = useState(false);
    const [pinCode, setPinCode] = useState('');
    const [usagePin, setUsagePin] = useState('');

    useEffect(() => {
        const fetchId = async () => {
            const id = await getDeviceId();
            setDeviceId(id);
        };
        fetchId();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await activateDevice(activationCode);

            // Check if PIN was returned (successful activation)
            if (response?.data?.usage_pin) {
                setUsagePin(response.data.usage_pin);
                setShowPinModal(true);
                // Will auto-continue after modal is dismissed
            } else if (response) {
                // No PIN but success (shouldn't happen with new backend)
                setTimeout(() => {
                    onActivate();
                }, 500);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error || '';
            const successMsg = err.response?.data?.message || '';

            // Handle "Welcome back" case (code reactivated on same device)
            if (successMsg && successMsg.includes('Welcome back')) {
                setTimeout(() => {
                    onActivate();
                }, 500);
                return;
            }

            if (errorMsg.includes('already active on another device')) {
                setError(
                    <span>
                        This code is active on a different device.<br />
                        Contact support to transfer your license.
                    </span>
                );
            } else if (errorMsg.includes('already used')) {
                setError(
                    <span>
                        This code was already used.<br />
                        <button
                            onClick={() => window.location.reload()}
                            className="underline text-red-200 hover:text-white mt-1"
                        >
                            Click to check your license status
                        </button>
                    </span>
                );
            } else if (errorMsg.includes('expired')) {
                setError('This code has expired. Please purchase a new one.');
            } else if (errorMsg.includes('revoked')) {
                setError('This code has been revoked by an administrator. Access is denied.');
            } else {
                setError(errorMsg || 'Invalid activation code. Please try again.');
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-4">
            <div className="max-w-md mx-auto pt-12 pb-8">
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500">
                            <Tv size={40} />
                        </div>
                        <h1 className="text-3xl font-bold mb-2">Serenity TV</h1>
                        <p className="text-slate-400">Please activate your device to continue.</p>
                    </div>

                    <div className="bg-slate-950/50 rounded-xl p-6 mb-8 border border-slate-800 text-center overflow-hidden">
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">Your Device ID</p>
                        <p className="text-xl font-mono text-blue-400 font-bold break-all select-all">
                            {deviceId.match(/.{1,4}/g)?.join(' ') || deviceId}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Activation Code</label>
                            <input
                                type="text"
                                value={activationCode}
                                onChange={(e) => {
                                    let val = e.target.value;
                                    // Regex to extract Tango ID from pasted SMS (e.g. "Trans ID: 123456")
                                    // Adjust regex as needed based on actual SMS format. Assuming alphanumeric.
                                    // Example: "Txn ID: 123ABC456" or "Ref: 987654"
                                    // User said: "tu extrait donc l ID tango"
                                    // Common Tango patterns: "Tango ID: XXXXX" or just matching a specific code pattern if pasted.
                                    // Simple heuristic: if len > 20 and contains "ID", try to find a sequence.
                                    if (val.length > 20) {
                                        const match = val.match(/(?:ID|Ref|Trans|Code)[:\s]+([A-Z0-9]+)/i);
                                        if (match && match[1]) {
                                            val = match[1];
                                        }
                                    }
                                    setActivationCode(val);
                                }}
                                placeholder="Enter Activation Code"
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center tracking-widest font-mono uppercase"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Lock size={20} /> Activate Device
                        </button>

                        <div className="text-center space-y-2">
                            <button
                                type="button"
                                onClick={() => setShowPinEntry(!showPinEntry)}
                                className="text-green-400 text-sm hover:text-green-300 underline font-semibold"
                            >
                                {showPinEntry ? '← Back to Activation Code' : 'Have a PIN? Click here'}
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    window.location.reload();
                                }}
                                className="text-blue-400 text-xs hover:text-blue-300 underline block mx-auto"
                            >
                                Device already activated? Refresh
                            </button>
                        </div>
                    </form>

                    {/* PIN Entry Form */}
                    {showPinEntry && (
                        <div className="mt-6 p-6 bg-green-500/10 border-2 border-green-500/30 rounded-2xl">
                            <h3 className="text-lg font-bold text-green-400 mb-3 text-center">Enter Your PIN</h3>
                            <input
                                type="text"
                                maxLength="6"
                                value={pinCode}
                                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                                placeholder="000000"
                                className="w-full bg-slate-800 border border-green-500/50 rounded-xl px-4 py-4 text-3xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-center tracking-[0.5em] font-mono font-bold"
                            />
                            <button
                                onClick={async () => {
                                    setError('');
                                    try {
                                        const api = await import('../services/api').then(m => m.default);
                                        const response = await api.post('/license/verify-pin', {
                                            device_hash: deviceId,
                                            usage_pin: pinCode
                                        });
                                        if (response.data.status === 'ACTIVE') {
                                            setTimeout(() => onActivate(), 500);
                                        }
                                    } catch (err) {
                                        setError(err.response?.data?.error || 'Invalid PIN. Please try again.');
                                    }
                                }}
                                className="w-full mt-4 bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-green-500/20"
                            >
                                Unlock with PIN
                            </button>
                        </div>
                    )}

                    {/* Original content below */}

                    {/* Pricing / Trial Section */}
                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <button
                            onClick={async () => {
                                try {
                                    const response = await import('../services/api').then(m => m.deviceService.startTrial(deviceId));
                                    if (response.data.status === 'trial_active') {
                                        onActivate();
                                    }
                                } catch (err) {
                                    setError(err.response?.data?.error || 'Trial activation failed');
                                }
                            }}
                            className="bg-slate-800 hover:bg-slate-700 p-4 rounded-xl border border-slate-700 text-center transition-all group"
                        >
                            <p className="font-bold text-white group-hover:text-blue-400">Free Trial</p>
                            <p className="text-xs text-slate-500">3 Days access</p>
                        </button>
                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center opacity-80">
                            <p className="font-bold text-white">Full Access</p>
                            <p className="text-xs text-slate-500">10,000 FCFA / Year</p>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-800/50 mt-2">
                        <p className="text-center text-slate-400 text-sm mb-4">Prefer the big screen experience?</p>
                        <a
                            href="https://serenity-tv.vercel.app/Serenity_TV.apk"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-700"
                        >
                            <Tv size={18} className="text-blue-400" /> Download Android App
                        </a>
                    </div>

                    <p className="text-center text-slate-500 text-xs mt-8">
                        Contact support if you don't have a code.
                    </p>
                </div>

                {/* PIN Success Modal */}
                {showPinModal && (
                    <PinSuccessModal
                        pin={usagePin}
                        onContinue={() => {
                            setShowPinModal(false);
                            onActivate();
                        }}
                    />
                )}
            </div>
        </div>
        </div >
    );
};

export default Activation;
