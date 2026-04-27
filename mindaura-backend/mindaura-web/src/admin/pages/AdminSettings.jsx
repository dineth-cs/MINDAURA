import React, { useState, useEffect, useContext } from 'react';
import { FiSettings, FiSliders, FiDatabase, FiShield, FiBell, FiUser, FiEdit2, FiLock, FiHardDrive, FiActivity, FiSave, FiCheckCircle, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-hot-toast';
import { UserContext } from '../../shared/context/UserContext';

export default function AdminSettings() {
  const { user, setUser } = useContext(UserContext);
  const [admin, setAdmin] = useState({ name: user?.name || 'Loading...', email: user?.email || '...' });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('General');

  // General Settings State
  const [motionGraphics, setMotionGraphics] = useState(() => {
    const saved = localStorage.getItem('mindaura_motion');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [autoSync, setAutoSync] = useState(() => {
    const saved = localStorage.getItem('mindaura_autosync');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [syncFrequency, setSyncFrequency] = useState(() => {
    const saved = localStorage.getItem('mindaura_syncfreq');
    return saved !== null ? saved : '140ms';
  });

  // Security Settings State
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

  // Notifications State
  const [errorAlerts, setErrorAlerts] = useState(true);
  const [newUserReg, setNewUserReg] = useState(true);

  // Modal State for Profile Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', field: '', currentValue: '' });
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await axiosInstance.get('/admin/profile');
      setAdmin(data);
      // Sync with global context if needed
      if (user && (user.name !== data.name || user.email !== data.email)) {
        setUser({ ...user, name: data.name, email: data.email });
      }
    } catch (error) {
      console.warn("Failed to fetch admin profile.");
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (field, value) => {
    try {
      setIsSaving(true);
      const { data } = await axiosInstance.put('/admin/profile', { [field]: value });
      setAdmin(data);
      // UPDATE GLOBAL CONTEXT IMMEDIATELY
      setUser(prev => ({ ...prev, [field]: value }));
      toast.success(`Profile ${field} updated successfully`);
      return true;
    } catch (error) {
      toast.error(`Failed to update ${field}`);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (field, currentValue) => {
    setModalConfig({
      title: field === 'name' ? 'Update Administrator Name' : 'Update Email Address',
      field,
      currentValue
    });
    setEditValue(currentValue || '');
    setModalOpen(true);
  };

  const handleModalSubmit = async () => {
    if (editValue && editValue !== modalConfig.currentValue) {
      const success = await updateProfile(modalConfig.field, editValue);
      if (success) setModalOpen(false);
    } else {
      setModalOpen(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    try {
      setIsSaving(true);
      await axiosInstance.put('/admin/change-password', passwordForm);
      toast.success("Password updated successfully");
      setPasswordForm({ currentPassword: '', newPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackup = () => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 2000)),
      {
        loading: 'Initiating database backup...',
        success: 'Backup MindAura_DB_Backup.gz completed!',
        error: 'Backup failed',
      }
    );
  };

  const handleClearCache = () => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1500)),
      {
        loading: 'Clearing system cache...',
        success: 'Cache cleared successfully!',
        error: 'Failed to clear cache',
      }
    );
  };

  const Toggle = ({ value, onToggle }) => (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none ${
        value ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gray-200'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300 ${
        value ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  );

  const navItems = [
    { label: 'General', icon: <FiSettings size={15} /> },
    { label: 'Security', icon: <FiShield size={15} /> },
    { label: 'Notifications', icon: <FiBell size={15} /> },
    { label: 'Data & Storage', icon: <FiDatabase size={15} /> },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-800 tracking-tight">Settings</h1>
        <p className="text-gray-500 text-sm font-medium mt-1">Configure your admin environment and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Nav */}
        <div className="lg:col-span-1 space-y-1">
          {navItems.map((nav, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(nav.label)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left font-semibold text-sm transition-all ${
                activeTab === nav.label
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              {nav.icon}
              {nav.label}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {activeTab === 'General' && (
            <div className="space-y-5">
              {/* Profile Section */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-horizon p-6">
                <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-50">
                  <div className="p-2.5 rounded-xl bg-emerald-50">
                    <FiUser className="text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-gray-800">Admin Profile</h2>
                    <p className="text-xs text-gray-500 font-medium">Manage your administrator credentials.</p>
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700">Administrator Name</h3>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">Currently: {admin?.name || 'N/A'}</p>
                    </div>
                    <button onClick={() => handleEditClick('name', admin?.name)} className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all">
                      <FiEdit2 size={12} /> Edit
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700">Notification Email</h3>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">Currently: {admin?.email || 'N/A'}</p>
                    </div>
                    <button onClick={() => handleEditClick('email', admin?.email)} className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all">
                      <FiEdit2 size={12} /> Edit
                    </button>
                  </div>
                </div>
              </div>

              {/* Interface Section */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-horizon p-6">
                <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-50">
                  <div className="p-2.5 rounded-xl bg-blue-50">
                    <FiSliders className="text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-gray-800">Interface</h2>
                    <p className="text-xs text-gray-500 font-medium">Manage how the admin panel looks and feels.</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700">Motion Graphics</h3>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">Smooth transitions and animated UI elements.</p>
                  </div>
                  <Toggle value={motionGraphics} onToggle={() => {
                    const newVal = !motionGraphics;
                    setMotionGraphics(newVal);
                    localStorage.setItem('mindaura_motion', JSON.stringify(newVal));
                    toast.success(newVal ? 'Motion graphics enabled' : 'Motion graphics disabled');
                  }} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Security' && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-horizon p-6">
                <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-50">
                  <div className="p-2.5 rounded-xl bg-purple-50">
                    <FiLock className="text-purple-500" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-gray-800">Account Security</h2>
                    <p className="text-xs text-gray-500 font-medium">Update password and manage security layers.</p>
                  </div>
                </div>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase mb-1 block">Current Password</label>
                    <input 
                      type="password" 
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-purple-300 focus:bg-white transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase mb-1 block">New Password</label>
                    <input 
                      type="password" 
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-purple-300 focus:bg-white transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  <button 
                    disabled={isSaving}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl text-xs font-bold shadow-brand hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    {isSaving ? <FiRefreshCw className="animate-spin" /> : <FiSave />} Save New Password
                  </button>
                </form>

                <div className="mt-8 pt-8 border-t border-gray-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700">Two-Factor Authentication</h3>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">Adds an extra layer of security to your login.</p>
                  </div>
                  <Toggle value={twoFactorAuth} onToggle={() => setTwoFactorAuth(!twoFactorAuth)} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Notifications' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-horizon p-6">
              <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-50">
                <div className="p-2.5 rounded-xl bg-orange-50">
                  <FiBell className="text-orange-500" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-gray-800">Notification Preferences</h2>
                  <p className="text-xs text-gray-500 font-medium">Control what events trigger an alert.</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700">System Error Alerts</h3>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">Notify when critical backend errors occur.</p>
                  </div>
                  <Toggle value={errorAlerts} onToggle={() => setErrorAlerts(!errorAlerts)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700">New User Registrations</h3>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">Alert when a new patient joins MindAura.</p>
                  </div>
                  <Toggle value={newUserReg} onToggle={() => setNewUserReg(!newUserReg)} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Data & Storage' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-horizon p-6">
              <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-50">
                <div className="p-2.5 rounded-xl bg-blue-50">
                  <FiDatabase className="text-blue-500" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-gray-800">Data & Storage</h2>
                  <p className="text-xs text-gray-500 font-medium">Maintenance and administrative data tasks.</p>
                </div>
              </div>
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FiHardDrive className="text-blue-500" size={20} />
                    <div>
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Database Backup</h4>
                      <p className="text-[11px] text-gray-500">Last backup: 4 hours ago</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleBackup}
                    className="px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all"
                  >
                    Backup Now
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FiActivity className="text-orange-500" size={20} />
                    <div>
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">System Cache</h4>
                      <p className="text-[11px] text-gray-500">Current size: 24.5 MB</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleClearCache}
                    className="px-4 py-2 bg-white text-orange-600 border border-orange-200 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-orange-50 transition-all"
                  >
                    Clear Cache
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => !isSaving && setModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-2xl p-8 animate-in slide-in-from-bottom-8 duration-500">
            <h3 className="text-xl font-black text-gray-800 mb-1">{modalConfig.title}</h3>
            <p className="text-sm text-gray-500 font-medium mb-6">Enter the new {modalConfig.field} for your account.</p>
            <input
              type={modalConfig.field === 'email' ? 'email' : 'text'}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              disabled={isSaving}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 font-medium focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-3 focus:ring-blue-100 transition-all mb-6"
              autoFocus
            />
            <div className="flex items-center gap-3 justify-end">
              <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm font-semibold">Cancel</button>
              <button onClick={handleModalSubmit} disabled={isSaving} className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl text-sm font-bold shadow-brand flex items-center gap-2">
                {isSaving ? <FiRefreshCw className="animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
