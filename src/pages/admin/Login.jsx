import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await authService.login(username, password);
            navigate('/admin/dashboard');
        } catch (err) {
            setError('Invalid credentials');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
                <h2 className="text-3xl font-bold text-center text-blue-400">Admin Login</h2>
                {error && <div className="p-3 text-red-500 bg-red-900/30 rounded text-center">{error}</div>}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium">Username</label>
                        <input
                            type="text"
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium">Password</label>
                        <input
                            type="password"
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full p-3 font-bold text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                    >
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
