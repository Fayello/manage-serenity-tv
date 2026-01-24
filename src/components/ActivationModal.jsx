import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

const ActivationModal = ({ isOpen, onClose, onConfirm, title = "Generate Activation Code" }) => {
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(
        new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
    );
    const [duration, setDuration] = useState(365);

    useEffect(() => {
        if (isOpen) {
            // Reset to defaults when opening
            const start = new Date();
            const end = new Date();
            end.setFullYear(start.getFullYear() + 1);

            setStartDate(start.toISOString().split('T')[0]);
            setEndDate(end.toISOString().split('T')[0]);
        }
    }, [isOpen]);

    useEffect(() => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDuration(diffDays);
    }, [startDate, endDate]);

    const handlePreset = (months) => {
        const start = new Date(startDate);
        const end = new Date(start);
        end.setMonth(start.getMonth() + months);
        setEndDate(end.toISOString().split('T')[0]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(duration);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#0A0A18] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
                >
                    <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/5">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Clock className="text-blue-500" /> {title}
                        </h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">

                        {/* Date Selection */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Start Date</label>
                                    <div className="relative">
                                        <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full bg-[#1A1A2E] border border-white/10 rounded-lg py-2.5 pl-10 pr-3 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">End Date</label>
                                    <div className="relative">
                                        <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
                                        <input
                                            type="date"
                                            value={endDate}
                                            min={startDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full bg-[#1A1A2E] border border-white/10 rounded-lg py-2.5 pl-10 pr-3 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Presets */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Quick Presets</label>
                            <div className="flex gap-2 flex-wrap">
                                {[
                                    { label: '1 Month', val: 1 },
                                    { label: '3 Months', val: 3 },
                                    { label: '6 Months', val: 6 },
                                    { label: '1 Year', val: 12 },
                                    { label: '2 Years', val: 24 },
                                ].map((preset) => (
                                    <button
                                        key={preset.label}
                                        type="button"
                                        onClick={() => handlePreset(preset.val)}
                                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all hover:border-blue-500/30"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4 flex items-center justify-between">
                            <div>
                                <p className="text-blue-200 text-xs font-medium">Total Duration</p>
                                <p className="text-2xl font-bold text-white">{duration} <span className="text-sm font-normal text-blue-300">Days</span></p>
                            </div>
                            <div className="h-10 w-10 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
                                <Clock size={20} />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-300 font-bold text-sm hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-[2] py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 size={18} /> Confirm Generation
                            </button>
                        </div>

                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ActivationModal;
