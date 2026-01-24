import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle2, Info, HelpCircle } from 'lucide-react';
import clsx from 'clsx';

const ActionModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = 'info', // 'info', 'warning', 'danger', 'success'
    requiresInput = false,
    inputPlaceholder = "Enter details...",
    loading = false
}) => {
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        if (isOpen) setInputValue('');
    }, [isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(requiresInput ? inputValue : true);
    };

    if (!isOpen) return null;

    const icons = {
        info: <Info className="text-blue-500" size={24} />,
        warning: <HelpCircle className="text-yellow-500" size={24} />,
        danger: <AlertTriangle className="text-red-500" size={24} />,
        success: <CheckCircle2 className="text-green-500" size={24} />
    };

    const buttonStyles = {
        info: "bg-blue-600 hover:bg-blue-500 shadow-blue-600/20",
        warning: "bg-yellow-600 hover:bg-yellow-500 shadow-yellow-600/20",
        danger: "bg-red-600 hover:bg-red-500 shadow-red-600/20",
        success: "bg-green-600 hover:bg-green-500 shadow-green-600/20"
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-[#0A0A18] border border-white/10 w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden relative"
                >
                    <div className="p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                                {icons[type]}
                            </div>
                            <h3 className="text-xl font-black text-white">{title}</h3>
                        </div>

                        <p className="text-gray-400 mb-8 leading-relaxed font-medium">{message}</p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {requiresInput && (
                                <div>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder={inputPlaceholder}
                                        className="w-full bg-[#1A1A2E] border border-white/10 rounded-xl py-4 px-5 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-600 font-medium"
                                        required
                                    />
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={loading}
                                    className="flex-1 py-4 rounded-xl bg-white/5 text-gray-400 font-bold text-sm hover:bg-white/10 transition-colors border border-white/5"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || (requiresInput && !inputValue.trim())}
                                    className={clsx(
                                        "flex-[2] py-4 rounded-xl text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed",
                                        buttonStyles[type]
                                    )}
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        confirmText
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ActionModal;
