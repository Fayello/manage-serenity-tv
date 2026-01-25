import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Calendar, Tag, Layers, CheckCircle2, X } from 'lucide-react';
import clsx from 'clsx';
import api from '../services/api';

const GenerateCodeModal = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        duration: 365,
        reference: '',
        planType: 'PREMIUM'
    });

    const PRESETS = [
        { label: '1 Month', days: 30 },
        { label: '3 Months', days: 90 },
        { label: '6 Months', days: 178 },
        { label: '1 Year', days: 365 },
        { label: 'Lifetime', days: 3650 }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/admin/codes/generate/', {
                duration: parseInt(formData.duration),
                reference: formData.reference || 'MANUAL',
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert("Failed to generate code");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-[#0A0A18] border border-white/10 w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-8 pb-4 border-b border-white/5 flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                <Key className="text-blue-500" size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white">Generate Access Code</h3>
                                <p className="text-gray-400 text-xs mt-1">Configure new license parameters</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-8 overflow-y-auto custom-scrollbar">
                        <form id="generate-form" onSubmit={handleSubmit} className="space-y-6">

                            {/* Duration Selection */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-gray-300 flex items-center gap-2">
                                    <Calendar size={16} className="text-blue-400" /> Duration
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {PRESETS.map((preset) => (
                                        <button
                                            key={preset.days}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, duration: preset.days }))}
                                            className={clsx(
                                                "p-3 rounded-xl border text-sm font-bold transition-all relative overflow-hidden",
                                                formData.duration === preset.days
                                                    ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20"
                                                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20"
                                            )}
                                        >
                                            {preset.label}
                                            {formData.duration === preset.days && (
                                                <div className="absolute top-1 right-1">
                                                    <CheckCircle2 size={12} className="text-white" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                    <div className="relative col-span-1">
                                        <input
                                            type="number"
                                            value={formData.duration}
                                            onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                                            className="w-full h-full bg-[#151525] border border-white/10 rounded-xl px-3 text-center text-white font-mono font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                            placeholder="Custom"
                                        />
                                        <span className="absolute bottom-1 right-2 text-[8px] text-gray-500 font-bold uppercase">Days</span>
                                    </div>
                                </div>
                            </div>

                            {/* Reference / Tag */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-gray-300 flex items-center gap-2">
                                    <Tag size={16} className="text-orange-400" /> Client Reference (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={formData.reference}
                                    onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                                    placeholder="e.g. John Doe, WhatsApp Order #123"
                                    className="w-full bg-[#151525] border border-white/10 rounded-xl p-4 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none placeholder:text-gray-600"
                                />
                            </div>

                            {/* Plan Type (Visual only for now if backend doesn't support distinct plans) */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-gray-300 flex items-center gap-2">
                                    <Layers size={16} className="text-purple-400" /> Plan Tier
                                </label>
                                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
                                        <Layers size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">Premium Access</h4>
                                        <p className="text-xs text-purple-200/60">Full content library + HD Streaming</p>
                                    </div>
                                    <span className="ml-auto text-xs font-black bg-purple-500 text-white px-2 py-1 rounded">DEFAULT</span>
                                </div>
                            </div>

                        </form>
                    </div>

                    {/* Footer */}
                    <div className="p-8 pt-4 border-t border-white/5 bg-black/20 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 py-4 rounded-xl bg-white/5 text-gray-400 font-bold text-sm hover:bg-white/10 transition-colors border border-white/5"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="generate-form"
                            disabled={loading}
                            className="flex-[2] py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Generate Code"}
                        </button>
                    </div>

                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default GenerateCodeModal;
