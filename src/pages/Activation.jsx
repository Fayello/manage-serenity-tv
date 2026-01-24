import React, { useState, useEffect } from 'react';
import { getDeviceId, activateDevice } from '../utils/device';
import { Lock, Tv, CheckCircle } from 'lucide-react';

const Activation = ({ onActivate }) => {
    const [activationCode, setActivationCode] = useState('');
    const [error, setError] = useState('');
    const [deviceId, setDeviceId] = useState('');

    useEffect(() => {
        setDeviceId(getDeviceId());
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await activateDevice(activationCode);
            onActivate();
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid activation code. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
            <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500">
                        <Tv size={40} />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Serenity Tv Player</h1>
                    <p className="text-slate-400">Please activate your device to continue.</p>
                </div>

                <div className="bg-slate-950/50 rounded-xl p-6 mb-8 border border-slate-800 text-center">
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">Your Device ID</p>
                    <p className="text-2xl font-mono text-blue-400 tracking-wider font-bold">{deviceId}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Activation Code</label>
                        <input
                            type="text"
                            value={activationCode}
                            onChange={(e) => setActivationCode(e.target.value)}
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
                </form>

                <div className="pt-6 border-t border-slate-800/50 mt-2">
                    <p className="text-center text-slate-400 text-sm mb-4">Prefer the big screen experience?</p>
                    <a
                        href="/Serenity_TV.apk"
                        download
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-700"
                    >
                        <Tv size={18} className="text-blue-400" /> Download Android App
                    </a>
                </div>

                <p className="text-center text-slate-500 text-xs mt-8">
                    Contact support if you don't have a code.
                </p>
            </div>
        </div>
    );
};

export default Activation;
