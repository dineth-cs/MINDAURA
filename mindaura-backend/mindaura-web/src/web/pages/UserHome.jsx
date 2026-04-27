import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { FiEdit3, FiMic, FiCamera, FiTrendingUp, FiSmartphone, FiArrowRight, FiCheckCircle, FiStar } from 'react-icons/fi';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { UserContext } from '../../shared/context/UserContext';
import Logo from '../../assets/images/logo.svg';

const progressData = [
  { value: 40 }, { value: 50 }, { value: 45 }, { value: 60 }, { value: 55 }, { value: 70 }, { value: 80 }
];

export default function UserHome() {
  const { user } = useContext(UserContext);

  const features = [
    {
      id: 1,
      title: 'My Journal',
      description: 'Log your thoughts and feelings securely in your private space.',
      icon: <FiEdit3 className="text-2xl text-blue-600" />,
      glowColor: 'hover:shadow-[0_15px_40px_rgba(59,130,246,0.15)]',
      iconBoxContext: 'bg-blue-50 border-blue-100 shadow-sm',
      path: '/dashboard/journal'
    },
    {
      id: 2,
      title: 'Voice Scan',
      description: 'Analyze micro-fluctuations in your vocal tone naturally.',
      icon: <FiMic className="text-2xl text-purple-600" />,
      glowColor: 'hover:shadow-[0_15px_40px_rgba(168,85,247,0.15)]',
      iconBoxContext: 'bg-purple-50 border-purple-100 shadow-sm',
      path: '/dashboard/voice'
    },
    {
      id: 3,
      title: 'Scan My Face',
      description: 'Capture emotional expressions through your camera lens securely.',
      icon: <FiCamera className="text-2xl text-emerald-600" />,
      glowColor: 'hover:shadow-[0_15px_40px_rgba(16,185,129,0.15)]',
      iconBoxContext: 'bg-emerald-50 border-emerald-100 shadow-sm',
      path: '/dashboard/face'
    },
    {
      id: 4,
      title: 'My Progress',
      description: 'Track your emotional stability journey beautifully over time.',
      icon: <FiTrendingUp className="text-2xl text-amber-600" />,
      glowColor: 'hover:shadow-[0_15px_40px_rgba(245,158,11,0.15)]',
      iconBoxContext: 'bg-amber-50 border-amber-100 shadow-sm',
      path: '/dashboard/progress'
    }
  ];

  return (
    <div className="font-sans text-slate-800 p-6 lg:p-10 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
        
        {/* Welcome Section */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch gap-6 mb-10">
            {/* Greeting */}
            <div className="flex-1 bg-white rounded-[2.5rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-100/50 rounded-full blur-[80px] pointer-events-none transition-transform duration-1000 group-hover:scale-110"></div>
                <h1 className="text-4xl lg:text-[42px] font-black tracking-tighter text-slate-900 mb-3 relative z-10">
                    Welcome back, {user?.name?.split(' ')[0] || 'User'}
                </h1>
                <p className="text-slate-500 font-medium text-[16px] relative z-10 tracking-wide">
                    Your mood has been steady this week. Keep up the great work!
                </p>
            </div>

            {/* Mobile App Promo (Hero) */}
            <div className="w-full lg:w-[400px] bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden flex flex-col justify-center">
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/20 blur-3xl rounded-full"></div>
                <div className="flex items-center space-x-3 mb-4 relative z-10">
                    <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
                        <img src={Logo} alt="MindAura Logo" className="w-8 h-8 transform scale-105" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold tracking-tight mb-1">MindAura Mobile</h3>
                        <div className="flex items-center">
                            <span className="flex text-yellow-300 text-[10px]"><FiStar className="fill-current"/><FiStar className="fill-current"/><FiStar className="fill-current"/><FiStar className="fill-current"/><FiStar className="fill-current"/></span>
                            <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-lg text-xs font-bold tracking-widest backdrop-blur-sm shadow-sm ring-1 ring-white/10">50K+ DOWNLOADS</span>
                        </div>
                    </div>
                </div>
                <p className="text-blue-100 text-[13px] font-medium leading-relaxed mb-6 relative z-10">
                    Take your wellness on the go. Seamlessly sync with this dashboard portal securely.
                </p>
                <div className="flex gap-3 relative z-10">
                    <button className="flex-1 bg-white text-blue-700 font-bold py-3.5 rounded-2xl shadow-lg hover:bg-slate-50 transition-colors text-sm">
                        App Store
                    </button>
                    <button className="flex-1 bg-white/10 border border-white/20 text-white font-bold py-3.5 rounded-2xl hover:bg-white/20 transition-colors text-sm backdrop-blur-sm">
                        Google Play
                    </button>
                </div>
            </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-8">
            
            {/* Left Column: Core Workflows */}
            <div className="flex-1 flex flex-col space-y-8">
                
                {/* 4 Feature Nodes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                    {features.map((feature) => (
                    <Link
                        key={feature.id}
                        to={feature.path}
                        className={`bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1.5 group cursor-pointer ${feature.glowColor}`}
                    >
                        <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 ${feature.iconBoxContext}`}>
                            {feature.icon}
                        </div>
                        <h3 className="text-[22px] font-extrabold text-slate-800 mb-2 tracking-tight">{feature.title}</h3>
                        <p className="text-slate-500 font-medium leading-relaxed mb-8">
                            {feature.description}
                        </p>
                        <div className="flex items-center text-sm font-bold text-blue-600 tracking-wide group-hover:text-blue-700 transition-colors">
                            Launch Module <FiArrowRight className="ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                        </div>
                    </Link>
                    ))}
                </div>
            </div>

            {/* Right Column: Insights */}
            <div className="w-full xl:w-[400px] flex flex-col space-y-8 flex-shrink-0">
                
                {/* Last Sentiment */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-full blur-[60px] pointer-events-none transform group-hover:scale-110 transition-transform duration-500"></div>
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 font-extrabold mb-1">State Analysis</p>
                            <h3 className="text-slate-800 font-bold text-lg">Last Sentiment</h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                            <FiCheckCircle className="text-2xl" />
                        </div>
                    </div>
                    <p className="text-[40px] font-black text-slate-900 tracking-tighter relative z-10 mb-2 leading-none">Happy</p>
                    <p className="text-[13px] font-semibold text-slate-500 relative z-10">
                        AI Confidence Metric: <span className="text-emerald-500 font-extrabold ml-1">92%</span>
                    </p>
                </div>

                {/* Mood Insights Chart */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden flex-1 flex flex-col group">
                    <div className="absolute w-full h-full inset-0 bg-blue-500/5 blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>
                    <h2 className="text-lg font-bold text-slate-800 mb-1 relative z-10">Recent Progress</h2>
                    <p className="text-[13px] text-slate-400 font-medium mb-8 relative z-10">Stability trajectory plotted over the last 7 days.</p>
                    
                    <div className="h-[180px] w-full relative z-10 mt-auto">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={progressData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
}
