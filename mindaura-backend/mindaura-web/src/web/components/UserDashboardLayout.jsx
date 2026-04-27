import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function UserDashboardLayout() {
    return (
        <div className="flex h-screen w-full bg-[#f8fafc] font-sans text-slate-800 selection:bg-blue-500/30 overflow-hidden relative">
            {/* Soft Green/Blue Mesh Gradient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/10 blur-[120px] rounded-full"></div>
                <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-emerald-400/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[60%] bg-teal-400/5 blur-[120px] rounded-full"></div>
            </div>
            
            <Sidebar />
            
            <div className="flex-1 relative z-10 overflow-y-auto w-full h-full custom-scrollbar">
                <Outlet />
            </div>
        </div>
    );
}
