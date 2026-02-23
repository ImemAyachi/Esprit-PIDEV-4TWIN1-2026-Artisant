import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Trash2, Edit2, Shield, AlertCircle } from 'lucide-react';

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data.data.users);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch users');
            setLoading(false);
            console.error(err);
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            await api.put(`/users/${id}`, { isActive: !currentStatus });
            // Optimistic update
            setUsers(users.map(u => u._id === id ? { ...u, isActive: !currentStatus } : u));
        } catch (err) {
            console.error('Update failed', err);
        }
    };

    const deleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await api.delete(`/users/${id}`);
            setUsers(users.filter(u => u._id !== id));
        } catch (err) {
            console.error('Delete failed', err);
        }
    };

    if (loading) return <div className="p-8 text-center text-brand-teal">Loading User Database...</div>;
    if (error) return <div className="p-8 text-center text-red-500 flex items-center justify-center gap-2"><AlertCircle /> {error}</div>;

    return (
        <div className="bg-white border-4 border-brand-teal p-8">
            <h3 className="text-2xl font-black uppercase tracking-tighter text-brand-teal mb-6 flex items-center gap-3">
                <Shield className="w-8 h-8" /> User Management Protocol
            </h3>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b-4 border-brand-teal/10 text-brand-teal/60">
                            <th className="p-4 font-black uppercase tracking-widest text-[10px]">Identity</th>
                            <th className="p-4 font-black uppercase tracking-widest text-[10px]">Role</th>
                            <th className="p-4 font-black uppercase tracking-widest text-[10px]">Status</th>
                            <th className="p-4 font-black uppercase tracking-widest text-[10px]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-brand-teal/5">
                        {users.map((user) => (
                            <tr key={user._id} className="hover:bg-brand-cream transition-colors group">
                                <td className="p-4">
                                    <div className="font-bold text-brand-teal">{user.name}</div>
                                    <div className="text-xs text-brand-slate opacity-60">{user.email}</div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-widest ${user.role === 'Admin' ? 'bg-brand-orange text-white' :
                                        user.role === 'Expert' ? 'bg-brand-teal text-white' :
                                            'bg-brand-slate/10 text-brand-slate'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <button
                                        onClick={() => toggleStatus(user._id, user.isActive)}
                                        className={`w-4 h-4 rounded-full ${user.isActive ? 'bg-brand-green' : 'bg-red-500'} ring-2 ring-offset-2 ring-transparent hover:ring-brand-teal/20 transition-all focus:z-10`}
                                        aria-label={`Toggle status for ${user.name}. Currently ${user.isActive ? 'Active' : 'Inactive'}.`}
                                        title={user.isActive ? 'Active' : 'Inactive'}
                                    />
                                </td>
                                <td className="p-4 flex gap-3">
                                    <button
                                        className="text-brand-teal hover:text-brand-orange transition-colors focus:z-10"
                                        aria-label={`Edit user ${user.name}`}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => deleteUser(user._id)}
                                        className="text-brand-slate/40 hover:text-red-500 transition-colors focus:z-10"
                                        aria-label={`Delete user ${user.name}`}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserList;
