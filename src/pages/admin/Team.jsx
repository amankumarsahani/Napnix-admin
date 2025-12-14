import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Team() {
    const { user } = useAuth();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [createdUser, setCreatedUser] = useState(null);
    const [isAddingDept, setIsAddingDept] = useState(false);
    const [departments, setDepartments] = useState(['Management', 'Sales', 'Marketing', 'Development', 'Support']);
    const [newDept, setNewDept] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        position: '',
        joinDate: '',
        role: 'sales_operator',
        department: '',
        status: 'active'
    });

    const fetchMembers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/teams`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setMembers(response.data.data);
                // Extract unique departments from data to update list dynamically
                const uniqueDepts = [...new Set(response.data.data.map(m => m.department).filter(Boolean))];
                setDepartments(prev => [...new Set([...prev, ...uniqueDepts])]);
            }
        } catch (error) {
            console.error('Failed to fetch stats', error);
            toast.error('Failed to load team members');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const handleAddDepartment = () => {
        if (newDept.trim() && !departments.includes(newDept)) {
            setDepartments([...departments, newDept]);
            setFormData({ ...formData, department: newDept });
            setNewDept('');
            setIsAddingDept(false);
            toast.success('Department added to list');
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/teams`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Success handling - email is now sent with credentials
            setCreatedUser({
                name: formData.name,
                email: formData.email,
                emailSent: response.data.emailSent
            });
            setShowModal(false);
            setShowSuccessModal(true);

            setFormData({
                name: '', email: '', phone: '', position: '',
                joinDate: '', role: 'sales_operator', department: '', status: 'active'
            });
            fetchMembers(); // Refresh list
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send invite');
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to remove this team member?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${API_URL}/teams/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMembers(members.filter(m => m.id !== id));
                toast.success('Member removed');
            } catch (error) {
                toast.error('Failed to remove member');
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Team Management</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage employees, roles and departments.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn btn-primary text-sm"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                    Add Employee
                </button>
            </div>

            {/* List */}
            <div className="glass-panel overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                <th className="px-6 py-4">Member</th>
                                <th className="px-6 py-4">Position</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Department</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {members.map((member) => (
                                <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold text-sm">
                                                {member.name[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white">{member.name}</div>
                                                <div className="text-sm text-slate-500 dark:text-slate-400">{member.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                        {member.position || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize 
                                            ${member.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400' :
                                                member.role === 'manager' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'}`}>
                                            {member.role || 'employee'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                        {member.department || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${member.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                            {member.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(member.id)}
                                            className="text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-2 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg"
                                            title="Remove Member"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Invite/Add Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-200 border border-transparent dark:border-slate-700">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Add New Employee</h2>
                        <form onSubmit={handleInvite} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                                    <input type="text" required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email</label>
                                    <input type="email" required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                                        value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Phone</label>
                                    <input type="tel" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                                        value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+1 234 567 890" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Position</label>
                                    <input type="text" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                                        value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} placeholder="Senior Developer" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Join Date</label>
                                    <input type="date" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                                        value={formData.joinDate} onChange={e => setFormData({ ...formData, joinDate: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Role</label>
                                    <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                                        value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                        <option value="admin">Admin</option>
                                        <option value="manager">Manager</option>
                                        <option value="sales_operator">Sales Operator</option>
                                        <option value="user">User</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Department
                                    {!isAddingDept ? (
                                        <button type="button" onClick={() => setIsAddingDept(true)} className="text-brand-600 dark:text-brand-400 hover:text-brand-700 text-xs font-bold uppercase">+ Add New</button>
                                    ) : (
                                        <button type="button" onClick={() => setIsAddingDept(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-700 text-xs font-bold uppercase">Cancel</button>
                                    )}
                                </label>

                                {isAddingDept ? (
                                    <div className="flex gap-2">
                                        <input type="text" className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 outline-none"
                                            value={newDept} onChange={e => setNewDept(e.target.value)} placeholder="New Department Name" autoFocus />
                                        <button type="button" onClick={handleAddDepartment} className="btn btn-primary whitespace-nowrap">Add</button>
                                    </div>
                                ) : (
                                    <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                                        value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}>
                                        <option value="">Select Department</option>
                                        {departments.map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">Cancel</button>
                                <button type="submit" className="btn btn-primary flex-1">Create Employee</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Success Modal - Email Sent */}
            {showSuccessModal && createdUser && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200 text-center border border-transparent dark:border-slate-700">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            {createdUser.emailSent ? (
                                <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            ) : (
                                <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Employee Created!</h2>

                        {createdUser.emailSent ? (
                            <>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                                    A welcome email with login credentials has been sent to the employee.
                                </p>

                                <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-xl p-4 text-left space-y-3 mb-6 border border-emerald-100 dark:border-emerald-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center">
                                            <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Email Sent To</p>
                                            <p className="font-medium text-slate-900 dark:text-white">{createdUser.email}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-lg p-3 mb-6 text-left">
                                    <p className="text-xs text-blue-700 dark:text-blue-400">
                                        <strong>📧 Email includes:</strong> Login credentials, password, and a link to the admin dashboard.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                                User already had an account. Team profile has been created.
                            </p>
                        )}

                        <button onClick={() => setShowSuccessModal(false)} className="btn btn-primary w-full">
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
