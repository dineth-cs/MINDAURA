import React, { useState, useContext, useRef } from 'react';
import { FiCamera, FiLock, FiMail, FiUser, FiCalendar, FiSave, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { UserContext } from '../../shared/context/UserContext';
import axiosInstance from '../../utils/axiosInstance';

export default function UserProfile() {
    const { user, token } = useContext(UserContext);
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [pwdStatus, setPwdStatus] = useState(null); 
    
    const [imagePreview, setImagePreview] = useState(user?.profilePicture || 'https://api.dicebear.com/7.x/notionists/svg?seed=' + user?.name + '&backgroundColor=f8fafc');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const userDetails = [
        { label: 'Full Name', value: user?.name, icon: <FiUser /> },
        { label: 'Email Address', value: user?.email, icon: <FiMail /> },
        { label: 'Age Range', value: user?.age ? `${user.age} Years Old` : 'Undefined', icon: <FiCalendar /> }
    ];

    const triggerFileSelect = () => fileInputRef.current.click();

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
            const base64data = reader.result;
            setImagePreview(base64data);
            
            setIsUploading(true);
            try {
                await axiosInstance.put('/auth/update-profile-picture', {
                    profilePicture: base64data
                });
            } catch (err) {
                alert("Failed to upload avatar securely: " + (err.response?.data?.message || 'Server Link broken'));
            } finally {
                setIsUploading(false);
            }
        };
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setPwdStatus(null);
        try {
            await axiosInstance.put('/auth/update-password', {
                currentPassword,
                newPassword
            });
            setPwdStatus({ type: 'success', msg: 'Password successfully changed!' });
            setCurrentPassword('');
            setNewPassword('');
        } catch (err) {
            setPwdStatus({ type: 'error', msg: err.response?.data?.message || 'Password update failed.' });
        }
    };

    return (
        <div className="font-sans text-slate-800 p-6 lg:p-10 animate-in fade-in duration-700 max-w-5xl mx-auto">
            
            <div className="mb-10 text-center lg:text-left">
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tighter">Your Personal Profile</h1>
                <p className="text-slate-500 mt-2 font-medium">Manage your personal data and application security in one place.</p>
            </div>

            {/* Clean Profile Header */}
            <div className="bg-white rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 lg:p-14 mb-8 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden group">
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-50 rounded-full blur-[100px] pointer-events-none transform group-hover:scale-110 transition-transform duration-1000"></div>
                
                <div className="relative">
                    <div className={`w-40 h-40 rounded-full border-8 border-slate-50 shadow-2xl flex items-center justify-center bg-white overflow-hidden relative z-10 ${isUploading ? 'animate-pulse' : ''}`}>
                        <img 
                            src={imagePreview} 
                            alt="Profile Avatar" 
                            className={`w-full h-full object-cover rounded-full transition-opacity ${isUploading ? 'opacity-40' : 'opacity-100'}`}
                        />
                        {isUploading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-8 rounded-full border-4 border-slate-800 border-t-transparent animate-spin"></div>
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={triggerFileSelect}
                        className="absolute bottom-1 right-1 bg-white text-slate-800 p-3.5 rounded-full shadow-lg hover:bg-slate-50 transition-transform hover:scale-110 border border-slate-100 z-20"
                        title="Change Avatar"
                    >
                        <FiCamera size={20} />
                    </button>
                    <input 
                        type="file" 
                        className="hidden" 
                        ref={fileInputRef} 
                        onChange={handleImageChange}
                        accept="image/*"
                    />
                </div>
                
                <div className="text-center md:text-left relative z-10 flex-col flex items-center md:items-start">
                    <div className="flex items-center space-x-3 mb-2">
                        <h2 className="text-[34px] font-black text-slate-900 tracking-tight">{user?.name}</h2>
                        <FiCheckCircle className="text-blue-500 text-[26px]" title="Verified Member" />
                    </div>
                    <p className="text-slate-500 font-semibold tracking-wide text-[16px]">{user?.email}</p>
                    <div className="mt-6 flex items-center px-5 py-2 bg-emerald-50 text-emerald-700 font-bold text-xs uppercase tracking-widest rounded-xl border border-emerald-100">
                        <FiCheckCircle className="mr-2" /> Verified MindAura Profile
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
                
                {/* Personal Details */}
                <div className="bg-white rounded-[3rem] p-8 lg:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <h3 className="text-2xl font-black text-slate-800 mb-8 tracking-tight flex items-center">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mr-4 shadow-sm border border-blue-100">
                            <FiUser className="text-2xl" />
                        </div>
                        Personal Data
                    </h3>
                    <div className="space-y-6">
                        {userDetails.map((detail, idx) => (
                            <div key={idx} className="flex flex-col">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2 ml-1">
                                    {detail.label}
                                </label>
                                <div className="px-5 py-4 bg-slate-50/80 rounded-2xl border border-slate-100 font-bold text-slate-800 text-[16px] shadow-sm flex items-center">
                                    <span className="text-blue-500 mr-3 text-lg">{detail.icon}</span>
                                    {detail.value}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Security Update */}
                <div className="bg-white rounded-[3rem] p-8 lg:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <h3 className="text-2xl font-black text-slate-800 mb-8 tracking-tight flex items-center">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mr-4 shadow-sm border border-purple-100">
                            <FiLock className="text-2xl" />
                        </div>
                        Security Details
                    </h3>
                    
                    {pwdStatus && (
                        <div className={`mb-8 p-4 rounded-2xl text-sm font-bold flex items-center shadow-sm ${
                            pwdStatus.type === 'error' ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                            {pwdStatus.type === 'error' ? <FiAlertCircle className="mr-3 text-xl shrink-0" /> : <FiCheckCircle className="mr-3 text-xl shrink-0" />}
                            {pwdStatus.msg}
                        </div>
                    )}

                    <form onSubmit={handlePasswordUpdate} className="space-y-6">
                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2 ml-1 block">
                                Current Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-transform group-focus-within:scale-110">
                                    <FiLock className="text-slate-400 group-focus-within:text-blue-500 transition-colors text-lg" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="block w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                                    placeholder="Enter current password"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2 ml-1 block">
                                New Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-transform group-focus-within:scale-110">
                                    <FiLock className="text-slate-400 group-focus-within:text-blue-500 transition-colors text-lg" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="block w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                                    placeholder="Enter new password"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!currentPassword || !newPassword}
                            className={`w-full flex justify-center items-center py-4 px-4 rounded-2xl shadow-lg shadow-blue-500/20 text-[15px] font-extrabold text-white transition-all duration-300 mt-2 ${
                                !currentPassword || !newPassword 
                                ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                                : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/30'
                            }`}
                        >
                            <FiSave className="mr-2 text-xl" /> Update Password
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
