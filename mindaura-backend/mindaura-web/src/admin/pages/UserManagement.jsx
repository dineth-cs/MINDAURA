import React, { useState, useEffect } from 'react';
import { Eye, UserX, X, Activity, Clock, Brain, Shield, ShieldAlert, Search, Trash2 } from 'lucide-react';
import { LineChart, Line, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import axiosInstance from '../../utils/axiosInstance';
import io from 'socket.io-client';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [profileStats, setProfileStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    const newSocket = io('https://mindaura-wfut.onrender.com', { transports: ['websocket'], autoConnect: true });
    newSocket.on('new_user_registered', (newUser) => {
      setUsers(prev => {
        if (prev.some(u => u._id === newUser._id)) return prev;
        return [{ ...newUser, id: newUser._id, avatar: newUser.profilePicture || `https://api.dicebear.com/7.x/notionists/svg?seed=${newUser.name}&backgroundColor=6366f1`, joinDate: new Date(newUser.createdAt || Date.now()).toLocaleDateString(), status: newUser.status || 'ACTIVE', tier: newUser.tier || 'TIER 1' }, ...prev];
      });
    });
    return () => { newSocket.off('new_user_registered'); newSocket.disconnect(); };
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchProfileStats(selectedUser.id || selectedUser._id);
    } else {
      setProfileStats(null);
    }
  }, [selectedUser]);

  const fetchUsers = async () => {
    try {
      const { data } = await axiosInstance.get('/admin/users');
      setUsers(data.map(u => ({ 
        ...u, 
        id: u._id, 
        avatar: u.profilePicture || `https://api.dicebear.com/7.x/notionists/svg?seed=${u.name}&backgroundColor=6366f1`, 
        joinDate: new Date(u.createdAt).toLocaleDateString()
      })));
    } catch (error) { console.warn("API Offline.", error); } finally { setLoading(false); }
  };

  const fetchProfileStats = async (userId) => {
    setStatsLoading(true);
    try {
      const { data } = await axiosInstance.get(`/admin/users/${userId}/profile-stats`);
      setProfileStats(data);
    } catch (error) {
      console.warn("Failed to fetch profile stats", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSuspend = async (id) => {
    try {
      const { data } = await axiosInstance.put(`/admin/users/${id}/suspend`);
      setUsers(users.map(u => (u.id === id || u._id === id) ? { ...u, status: data.status } : u));
      if (selectedUser && (selectedUser.id === id || selectedUser._id === id)) {
        setSelectedUser(prev => ({ ...prev, status: data.status }));
      }
    } catch (err) { alert("Failed to update user status."); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this user and all their data (Moods, Tickets, Journals)? This cannot be undone.")) return;
    try {
      await axiosInstance.delete(`/admin/users/${id}`);
      setUsers(users.filter(u => u.id !== id && u._id !== id));
      if (selectedUser && (selectedUser.id === id || selectedUser._id === id)) setSelectedUser(null);
    } catch (err) { alert("Failed to delete user."); }
  };

  const filtered = users.filter(u =>
    (u.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">User Management</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Manage all registered users and their access.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-horizon w-full md:w-64">
          <Search size={15} className="text-gray-400 flex-shrink-0" />
          <input type="text" placeholder="Search users..." className="bg-transparent border-none focus:outline-none text-sm text-gray-700 placeholder-gray-400 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-horizon overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wide">User</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Joined</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Role</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((user) => (
                <tr key={user.id || user._id} className="hover:bg-gray-50/70 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-xl object-cover border border-gray-100" />
                        {user.status === 'ACTIVE' && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-full uppercase tracking-wide ${user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>{user.status}</span>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-gray-500">{user.joinDate}</td>
                  <td className="px-6 py-4 text-xs font-semibold text-purple-600 uppercase tracking-wide">{user.isAdmin ? 'ADMIN' : (user.tier || 'TIER 1')}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setSelectedUser(user)} className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:bg-blue-50 hover:text-blue-500 hover:border-blue-100 transition-all" title="View"><Eye size={15} /></button>
                      <button onClick={() => handleSuspend(user.id || user._id)} className={`p-2 rounded-xl border transition-all ${user.status === 'ACTIVE' ? 'border-gray-200 text-gray-400 hover:bg-orange-50 hover:text-orange-500 hover:border-orange-100' : 'bg-emerald-50 text-emerald-500 border-emerald-100 shadow-sm'}`} title="Suspend"><UserX size={15} /></button>
                      <button onClick={() => handleDelete(user.id || user._id)} className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all" title="Delete"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && <div className="p-16 text-center flex flex-col items-center gap-3"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /><span className="text-xs text-gray-400">Loading users...</span></div>}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-2xl flex flex-col animate-in slide-in-from-bottom-12 duration-700">
            <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-black text-gray-800">User Analytics Profile</h2>
              <button onClick={() => setSelectedUser(null)} className="p-2 rounded-xl bg-gray-50 hover:bg-red-50 hover:text-red-500 text-gray-500 transition-all"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-64 p-8 border-r border-gray-100 flex flex-col items-center bg-gray-50/50 flex-shrink-0">
                  <div className="relative mb-5">
                    <img src={selectedUser.avatar} alt={selectedUser.name} className="w-24 h-24 rounded-2xl border border-gray-200 object-cover shadow-sm" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-white rounded-xl flex items-center justify-center text-white shadow-md"><Activity size={14} /></div>
                  </div>
                  <h3 className="text-lg font-black text-gray-800 text-center">{selectedUser.name}</h3>
                  <p className="text-xs text-gray-400 text-center mt-1">{selectedUser.email}</p>
                  <div className="mt-6 w-full space-y-2">
                    <div className="p-3 rounded-xl border border-gray-100 bg-white text-center shadow-sm">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-0.5">Account Status</span>
                      <span className={`text-sm font-black uppercase ${selectedUser.status === 'ACTIVE' ? 'text-emerald-500' : 'text-orange-500'}`}>{selectedUser.status}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-8 space-y-8 relative">
                  {statsLoading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Journals', value: profileStats?.journals || 0, icon: <Activity size={13} className="text-blue-500" /> },
                      { label: 'Joined', value: profileStats ? new Date(profileStats.joinDate).toLocaleDateString() : '...', icon: <Clock size={13} className="text-emerald-500" /> },
                      { label: 'Top Emotion', value: profileStats?.topEmotion || 'None', icon: <Brain size={13} className="text-purple-500" /> },
                      { label: 'Modality', value: profileStats?.modalityUsage?.length || 0, icon: <Shield size={13} className="text-amber-500" /> },
                    ].map((s, i) => (
                      <div key={i} className="p-4 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-2"><div className="p-1.5 rounded-lg bg-gray-50">{s.icon}</div><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{s.label}</span></div>
                        <p className="text-lg font-black text-gray-800">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm">
                      <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider mb-5 flex items-center gap-2"><Activity size={14} className="text-indigo-500" /> Interaction Trend</h4>
                      <div className="h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={profileStats?.moodTrend || []}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                            <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm">
                      <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider mb-5 flex items-center gap-2"><Brain size={14} className="text-purple-500" /> Modality Share</h4>
                      <div className="h-[180px] flex items-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={profileStats?.modalityUsage || []} innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value" stroke="none">
                              {(profileStats?.modalityUsage || []).map((e, i) => <Cell key={i} fill={e.color} />)}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-2 ml-4 flex-shrink-0">
                          {(profileStats?.modalityUsage || []).map(item => (
                            <div key={item.name} className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{item.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl border border-red-100 bg-red-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-black text-red-800 flex items-center gap-2"><ShieldAlert size={15} /> Dangerous Area</p>
                      <p className="text-[11px] text-red-600/80 font-medium mt-0.5 leading-relaxed">Permanently purge this user and all linked neural telemetry, support history, and journals. This action is irreversible.</p>
                    </div>
                    <button onClick={() => handleDelete(selectedUser.id || selectedUser._id)} className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 whitespace-nowrap flex items-center gap-2"><Trash2 size={14} /> Purge Records</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 py-5 border-t border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Secure Cloud Sync Active</span></div>
              <div className="flex gap-3">
                <button onClick={() => setSelectedUser(null)} className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100 text-xs font-bold uppercase tracking-widest transition-all">Dismiss</button>
                <button 
                  onClick={() => handleSuspend(selectedUser.id || selectedUser._id)} 
                  className={`px-6 py-2.5 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 ${selectedUser.status === 'ACTIVE' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                >
                  {selectedUser.status === 'ACTIVE' ? <><UserX size={14} /> Suspend Access</> : <><Shield size={14} /> Restore Access</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
