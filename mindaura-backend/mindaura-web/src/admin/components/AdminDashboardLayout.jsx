import React, { useState, useEffect, useContext } from 'react';
import { NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  FiHome, FiUsers, FiMessageSquare, FiShield, FiBarChart2, 
  FiSettings, FiLogOut, FiBell, FiSearch, FiMenu, FiX 
} from 'react-icons/fi';
import io from 'socket.io-client';
import { UserContext } from '../../shared/context/UserContext';

export default function AdminDashboardLayout() {
  const { user } = useContext(UserContext);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const socket = io('https://mindaura-wfut.onrender.com', { transports: ['websocket'] });
    
    socket.on('connect', () => {
      console.log('⚡ Admin socket connected');
      socket.emit('join_admin');
    });

    socket.on('new_notification', (data) => {
      console.log('🔔 Admin received new notification:', data);
      if (data.type === 'support') {
        setHasNewMessage(true);
      }
    });

    return () => socket.disconnect();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', icon: <FiHome />, path: '/admin/dashboard' },
    { name: 'User Management', icon: <FiUsers />, path: '/admin/users' },
    { name: 'Support Requests', icon: <FiMessageSquare />, path: '/admin/support', badge: hasNewMessage },
    { name: 'Model Analytics', icon: <FiBarChart2 />, path: '/admin/models' },
    { name: 'System Security', icon: <FiShield />, path: '/admin/security' },
    { name: 'Audit Logs', icon: <FiBarChart2 />, path: '/admin/audit-logs' },
    { name: 'Admin Settings', icon: <FiSettings />, path: '/admin/settings' },
  ];

  const notifications = [
    { id: 1, text: 'New user registration: Sarah Connor', time: '2 mins ago', type: 'user' },
    { id: 2, text: 'High priority support ticket #829', time: '15 mins ago', type: 'support' },
    { id: 3, text: 'System security audit completed', time: '1 hour ago', type: 'security' },
  ];

  return (
    <div className="flex h-screen bg-[#F4F7FE] font-sans text-[#1B254B]">
      
      {/* Sidebar - Premium White Aesthetic */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white transition-all duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 shadow-horizon overflow-y-auto custom-scrollbar border-r border-gray-100`}>
        <div className="flex flex-col h-full min-h-screen">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-12 px-2">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center text-white shadow-brand">
                <FiShield size={20} />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-[#1B254B]">MindAura</h1>
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest leading-none mt-1">Admin Control</p>
              </div>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => {
                    if (item.path === '/admin/support') setHasNewMessage(false);
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={({ isActive }) => `
                    relative flex items-center justify-between px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-200 group
                    ${isActive 
                      ? 'bg-blue-600/5 text-blue-600' 
                      : 'text-gray-500 hover:text-[#1B254B] hover:bg-gray-50'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xl transition-colors ${location.pathname === item.path ? 'text-blue-600' : 'text-gray-400 group-hover:text-[#1B254B]'}`}>
                      {item.icon}
                    </span>
                    {item.name}
                  </div>
                  {item.badge && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-sm shadow-blue-400" />
                  )}
                  {location.pathname === item.path && (
                    <div className="absolute right-[-32px] w-1.5 h-8 bg-blue-600 rounded-l-full shadow-lg shadow-blue-500/50" />
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="mt-auto p-8 border-t border-gray-50">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-5 py-4 w-full rounded-2xl text-sm font-bold text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
            >
              <FiLogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Modern Header */}
        <header className="h-24 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-3 rounded-2xl bg-white shadow-horizon text-[#1B254B] transition-all hover:scale-105"
            >
              {isSidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
            <div className="hidden md:flex items-center gap-3 bg-white px-6 py-3.5 rounded-3xl shadow-horizon border border-white w-96 group focus-within:border-blue-400/30 transition-all">
              <FiSearch className="text-gray-400 group-focus-within:text-blue-500" />
              <input 
                type="text" 
                placeholder="Search telemetry..." 
                className="bg-transparent border-none text-sm font-medium focus:outline-none w-full text-[#1B254B] placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Right Header Section */}
          <div className="flex items-center gap-4 bg-white p-2.5 rounded-3xl shadow-horizon border border-white">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-3 rounded-2xl text-gray-400 hover:bg-gray-50 hover:text-blue-500 transition-all relative group"
              >
                <FiBell size={20} />
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-6 w-96 bg-white rounded-3xl shadow-horizon-lg border border-gray-100 p-8 animate-in fade-in slide-in-from-top-4 duration-300 z-[100]">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-base font-black text-[#1B254B]">Notifications</h3>
                    <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">3 New</span>
                  </div>
                  <div className="space-y-5">
                    {notifications.map(n => (
                      <div key={n.id} className="flex gap-4 group cursor-pointer p-2 rounded-2xl hover:bg-gray-50 transition-all">
                        <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-sm
                          ${n.type === 'user' ? 'bg-blue-50 text-blue-600' : 
                            n.type === 'support' ? 'bg-purple-50 text-purple-600' : 
                            'bg-gray-50 text-gray-600'}`}>
                          {n.type === 'user' ? <FiUsers size={18} /> : n.type === 'support' ? <FiMessageSquare size={18} /> : <FiShield size={18} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1B254B] group-hover:text-blue-600 transition-colors leading-snug">{n.text}</p>
                          <p className="text-[11px] font-semibold text-gray-400 mt-1">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-8 py-3 text-[11px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-500 transition-colors border-t border-gray-50 pt-6">
                    See all notifications
                  </button>
                </div>
              )}
            </div>

            <div className="h-10 w-px bg-gray-100 mx-1"></div>

            <div className="flex items-center gap-3 pr-3 pl-1 group cursor-pointer">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Admin'}`} 
                alt="Admin" 
                className="w-11 h-11 rounded-2xl border-2 border-white shadow-sm transition-transform group-hover:scale-105"
              />
              <div className="hidden sm:block">
                <p className="text-sm font-black text-[#1B254B] group-hover:text-blue-600 transition-colors leading-none">{user?.name || 'Root Admin'}</p>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter mt-1">{user?.role || 'Superuser'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Router Viewport */}
        <div className="flex-1 overflow-y-auto px-8 pb-10 custom-scrollbar animate-in fade-in duration-500">
          <div className="max-w-7xl mx-auto pt-4">
            <Outlet />
          </div>
        </div>

      </main>
    </div>
  );
}
