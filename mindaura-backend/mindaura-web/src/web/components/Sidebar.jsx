import { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiEdit3, FiMic, FiCamera, FiTrendingUp, FiCalendar, FiUser, FiLogOut, FiHelpCircle } from 'react-icons/fi';
import { UserContext } from '../../shared/context/UserContext';
import Logo from '../../assets/images/logo.svg';

export default function Sidebar() {
    const { user, logout } = useContext(UserContext);
    const location = useLocation();
    const navigate = useNavigate();

    const navLinks = [
        { name: 'Dashboard', path: '/dashboard', icon: <FiHome className="mr-4 text-xl" /> },
        { name: 'My Journal', path: '/dashboard/journal', icon: <FiEdit3 className="mr-4 text-xl" /> },
        { name: 'Voice Scan', path: '/dashboard/voice', icon: <FiMic className="mr-4 text-xl" /> },
        { name: 'Scan My Face', path: '/dashboard/face', icon: <FiCamera className="mr-4 text-xl" /> },
        { name: 'Progress', path: '/dashboard/progress', icon: <FiTrendingUp className="mr-4 text-xl" /> },
        { name: 'Calendar', path: '/dashboard/calendar', icon: <FiCalendar className="mr-4 text-xl" /> },
        { name: 'Profile', path: '/dashboard/profile', icon: <FiUser className="mr-4 text-xl" /> },
        { name: 'Help & Support', path: '/dashboard/support', icon: <FiHelpCircle className="mr-4 text-xl" /> },
    ];

    return (
        <aside className="w-[280px] relative z-20 flex-shrink-0 border-r border-slate-200/60 bg-white/70 backdrop-blur-3xl h-full flex-col hidden lg:flex shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
            <div className="p-8 pb-4">
                <Link to="/dashboard" className="flex items-center space-x-3 mb-10 group">
                    <img src={Logo} alt="MindAura Official Logo" className="w-12 h-12 group-hover:scale-105 transition-transform duration-300 drop-shadow-md" />
                    <span className="text-2xl font-black tracking-tight text-slate-800">MindAura</span>
                </Link>

                <nav className="flex flex-col space-y-2 mb-8">
                    <div className="mb-2 ml-1 mt-4">
                        <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-400">Main Menu</span>
                    </div>
                    {navLinks.map((link) => {
                        const isActive = location.pathname === link.path;
                        return (
                            <Link
                                key={link.name}
                                to={link.path}
                                className={`flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 font-bold text-[15px] ${
                                    isActive 
                                    ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100/50' 
                                    : 'text-slate-500 border border-transparent hover:text-blue-600 hover:bg-slate-50'
                                }`}
                            >
                                {link.icon}
                                {link.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto p-5 m-5 bg-slate-50/80 border border-slate-100 rounded-3xl backdrop-blur-md">
                <div className="flex items-center mb-5">
                    <img 
                      src={user?.profilePicture || 'https://api.dicebear.com/7.x/initials/svg?seed=' + user?.name} 
                      alt="Profile" 
                      className="w-11 h-11 rounded-full shadow-sm object-cover bg-white" 
                    />
                    <div className="ml-3 overflow-hidden">
                        <p className="text-[15px] font-extrabold text-slate-800 truncate">{user?.name}</p>
                        <p className="text-[13px] font-medium text-slate-500 truncate tracking-wide">{user?.email}</p>
                    </div>
                </div>
                <button 
                  onClick={() => {
                    logout();
                    navigate('/', { replace: true });
                  }} 
                  className="w-full flex items-center justify-center px-4 py-3.5 rounded-2xl text-[14px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all shadow-sm"
                >
                    <FiLogOut className="mr-2 text-lg" /> Sign Out
                </button>
            </div>
        </aside>
    );
}
