import React, { useState } from 'react';
import { Key, Copy, CheckCircle } from 'lucide-react';

const PinSuccessModal = ({ pin, onContinue }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(pin);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border-2 border-green-500 rounded-3xl p-8 max-w-md w-full">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={32} className="text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Activation Successful!</h2>
                    <p className="text-slate-400 text-sm">Save your access PIN for future logins</p>
                </div>

                <div className="bg-black/40 border border-green-500/30 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <Key size={16} className="text-green-400" />
                        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Your Access PIN</p>
                    </div>
                    <div className="text-center">
                        <p className="text-5xl font-mono font-black text-green-400 tracking-[0.5em] mb-4">
                            {pin}
                        </p>
                        <button
                            onClick={handleCopy}
                            className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2 mx-auto border border-slate-700 transition-all"
                        >
                            {copied ? (
                                <>
                                    <CheckCircle size={16} className="text-green-400" />
                                    <span className="text-green-400">Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Copy size={16} />
                                    <span>Copy PIN</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                    <p className="text-xs text-blue-300 text-center">
                        💾 <strong>Important:</strong> Save this PIN! Use it to access from any browser or device.
                    </p>
                </div>

                <button
                    onClick={onContinue}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-green-500/20"
                >
                    Continue to Player
                </button>
            </div>
        </div>
    );
};

export default PinSuccessModal;
