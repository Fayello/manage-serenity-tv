import React, { useState, useEffect } from 'react';
import api, { authService } from '../../services/api';
import { Trash2, UserPlus, Shield } from 'lucide-react';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [createMode, setCreateMode] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'SUPPORT' });
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        fetchUsers();
        const user = authService.getCurrentUser();
        setCurrentUser(user);
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/users/');
            setUsers(response.data);
        } catch (error) {
            console.error("Failed to fetch admins", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this admin?")) return;
        try {
            await api.delete(`/admin/users/${id}/`);
            fetchUsers();
        } catch (error) {
            alert("Failed to delete admin");
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/users/', newUser);
            setCreateMode(false);
            setNewUser({ username: '', email: '', password: '', role: 'SUPPORT' });
            fetchUsers();
        } catch (error) {
            alert("Failed to create admin: " + (error.response?.data?.detail || error.message));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Shield className="text-blue-500" /> Admin Access Control
                </h3>
                <button
                    onClick={() => setCreateMode(!createMode)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold text-sm"
                >
                    <UserPlus size={16} /> {createMode ? 'Cancel' : 'New Admin'}
                </button>
            </div>

            {createMode && (
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 animate-in fade-in slide-in-from-top-4">
                    <h4 className="text-lg font-bold mb-4 text-white">Create New Admin</h4>
                    <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
                        <input
                            type="text"
                            placeholder="Username"
                            className="p-3 bg-gray-700 rounded border border-gray-600 text-white"
                            value={newUser.username}
                            onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                            required
                        />
                        <input
                            type="email"
                            placeholder="Email (Optional)"
                            className="p-3 bg-gray-700 rounded border border-gray-600 text-white"
                            value={newUser.email}
                            onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            className="p-3 bg-gray-700 rounded border border-gray-600 text-white"
                            value={newUser.password}
                            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                            required
                        />
                        <select
                            className="p-3 bg-gray-700 rounded border border-gray-600 text-white"
                            value={newUser.role}
                            onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                        >
                            <option value="SUPPORT">Support Agent</option>
                            <option value="SUPERADMIN">Super Admin</option>
                        </select>
                        <div className="md:col-span-2">
                            <button type="submit" className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded">
                                Create User
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700">
                <table className="w-full text-left text-sm text-gray-300">
                    <thead className="bg-gray-800 text-gray-400 uppercase font-bold text-xs">
                        <tr>
                            <th className="p-4">Username</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-gray-700/50 transition-colors">
                                <td className="p-4 font-medium text-white">{user.username}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'SUPERADMIN' ? 'bg-purple-900 text-purple-200' : 'bg-blue-900 text-blue-200'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {user.username !== 'Fayell' && user.id !== currentUser?.user_id && (
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-2 rounded transition-colors"
                                            title="Delete User"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.length === 0 && !loading && (
                    <div className="p-8 text-center text-gray-500">No users found.</div>
                )}
            </div>
        </div>
    );
};

export default AdminUsers;
