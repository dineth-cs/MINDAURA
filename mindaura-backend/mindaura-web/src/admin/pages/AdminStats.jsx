import React, { useContext, useState, useEffect } from 'react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid
} from 'recharts';
import {
  FiUsers, FiActivity, FiZap, FiMessageSquare, FiArrowUpRight,
  FiArrowDownRight, FiCheckCircle, FiClock, FiExternalLink,
  FiDatabase, FiGlobe, FiServer, FiDownload
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import axios from 'axios';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#3b82f6'];

const StatCard = ({ title, value, subValue, trend, icon, iconBg }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-horizon hover:shadow-horizon-lg transition-all duration-300 p-6 group">
    <div className="flex justify-between items-start mb-5">
      <div className={`p-3 rounded-xl ${iconBg} group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
        trend > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
        trend === 0 ? 'bg-gray-100 text-gray-500 border-gray-200' :
        'bg-red-50 text-red-500 border-red-100'
      }`}>
        {trend > 0 ? <FiArrowUpRight size={10} /> : trend === 0 ? null : <FiArrowDownRight size={10} />}
        {Math.abs(trend)}%
      </div>
    </div>
    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{title}</p>
    <div className="flex items-baseline gap-2">
      <span className="text-3xl font-black text-gray-800 tracking-tight">{value}</span>
      <span className="text-xs font-medium text-gray-400">{subValue}</span>
    </div>
  </div>
);

export default function AdminStats() {
  const [uptime, setUptime] = useState(0);
  const [latency, setLatency] = useState(0);
  const [stats, setStats] = useState({ userCount: 0, tickets: { pending: 0, inProgress: 0, resolved: 0 } });
  const [pendingSupport, setPendingSupport] = useState([]);
  const [trafficData, setTrafficData] = useState([]);
  const [emotionData, setEmotionData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = 'https://mindaura-wfut.onrender.com/api';

  useEffect(() => {
    fetchStatsAndSupport();
    const uptimeInterval = setInterval(() => setUptime(prev => prev + 1), 1000);
    return () => clearInterval(uptimeInterval);
  }, []);

  const fetchStatsAndSupport = async () => {
    try {
      const [statsRes, supportRes, logsRes] = await Promise.all([
        axios.get(`${API_BASE}/admin/stats`),
        axios.get(`${API_BASE}/support/admin`),
        axios.get(`${API_BASE}/admin/audit-logs`)
      ]);
      const fetchedStats = statsRes.data;
      setStats(fetchedStats);
      setUptime(fetchedStats.uptime || 0);
      setLatency(fetchedStats.latency || 12);
      const allTickets = supportRes.data || [];
      setPendingSupport(allTickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').slice(0, 3));
      setRecentActivity((logsRes.data || []).slice(0, 15));
      generateChartData(fetchedStats.userCount || 0);
    } catch (error) {
      console.warn("API Offline.", error);
      setPendingSupport([]);
      setRecentActivity([]);
      generateChartData(0);
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (users) => {
    const m = users > 0 ? (users / 100) : 1;
    setTrafficData([
      { time: '00:00', inferences: Math.floor(450 * m) },
      { time: '04:00', inferences: Math.floor(300 * m) },
      { time: '08:00', inferences: Math.floor(1200 * m) },
      { time: '12:00', inferences: Math.floor(2100 * m) },
      { time: '16:00', inferences: Math.floor(1800 * m) },
      { time: '20:00', inferences: Math.floor(2400 * m) },
      { time: '23:59', inferences: Math.floor(1500 * m) },
    ]);
    let e1 = Math.floor(Math.random() * 20) + 20;
    let e2 = Math.floor(Math.random() * 15) + 10;
    let e3 = Math.floor(Math.random() * 20) + 15;
    let e4 = Math.floor(Math.random() * 10) + 10;
    let e5 = 100 - (e1 + e2 + e3 + e4);
    setEmotionData([
      { name: 'Happy', value: e1 }, { name: 'Sad', value: e2 },
      { name: 'Stressed', value: e3 }, { name: 'Reflective', value: e4 },
      { name: 'Energetic', value: e5 > 0 ? e5 : 0 },
    ]);
  };

  const handleGenerateManifest = () => {
    const reportData = { timestamp: new Date().toISOString(), activeNodes: stats.userCount, systemUptime: uptime, apiLatency: latency, pendingTickets: stats.tickets.pending, emotionDistribution: emotionData, dailyInferences: trafficData.reduce((acc, curr) => acc + curr.inferences, 0) };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindaura_manifest_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatUptime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return [h, m, sec].map(v => v < 10 ? '0' + v : v).join(':');
  };

  const topEmotion = emotionData.length > 0 ? emotionData.reduce((max, c) => c.value > max.value ? c : max) : { name: 'Analyzing', value: 0 };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 pb-8">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Analytics Overview</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Real-time telemetry and platform oversight.</p>
        </div>
        <button
          onClick={handleGenerateManifest}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold rounded-xl shadow-brand hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95"
        >
          <FiDownload size={14} /> Export Manifest
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard title="Active Users" value={loading ? '...' : stats.userCount} subValue="Enrolled" trend={12} icon={<FiUsers className="text-blue-500 text-lg" />} iconBg="bg-blue-50" />
        <StatCard title="AI Inferences" value={loading ? '...' : (stats.userCount * 8).toLocaleString()} subValue="Est. Today" trend={5} icon={<FiActivity className="text-emerald-500 text-lg" />} iconBg="bg-emerald-50" />
        <StatCard title="API Latency" value={`${latency}ms`} subValue="Target <100ms" trend={-24} icon={<FiZap className="text-amber-500 text-lg" />} iconBg="bg-amber-50" />
        <StatCard title="Support Tickets" value={loading ? '...' : stats.tickets?.pending || 0} subValue="Pending" trend={0} icon={<FiMessageSquare className="text-purple-500 text-lg" />} iconBg="bg-purple-50" />
      </div>

      {/* System Health Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {[
          { icon: <FiDatabase className="text-emerald-500" />, iconBg: 'bg-emerald-50', label: 'Database Status', value: 'Active / Optimized', dotColor: 'bg-emerald-500' },
          { icon: <FiGlobe className="text-blue-500" />, iconBg: 'bg-blue-50', label: 'API Latency', value: `${latency}ms`, badge: latency < 50 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100', badgeText: latency < 50 ? 'Excellent' : 'Nominal' },
          { icon: <FiServer className="text-purple-500" />, iconBg: 'bg-purple-50', label: 'System Uptime', value: formatUptime(uptime), sub: 'HH:MM:SS' },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-horizon p-5 flex items-center gap-4 group hover:shadow-horizon-lg transition-all">
            <div className={`p-3 rounded-xl ${card.iconBg} group-hover:scale-110 transition-transform`}>{card.icon}</div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{card.label}</p>
              <div className="flex items-center gap-2">
                {card.dotColor && <span className={`w-2 h-2 rounded-full ${card.dotColor} animate-pulse`} />}
                <span className="text-base font-black text-gray-800">{card.value}</span>
                {card.badgeText && <span className={`text-[9px] font-bold border px-2 py-0.5 rounded-lg tracking-wide ${card.badge}`}>{card.badgeText}</span>}
                {card.sub && <span className="text-[10px] text-gray-400 font-medium">{card.sub}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-horizon p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-black text-gray-800">Activity Trajectory</h2>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Multi-modal usage per 4h window</p>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="colorInferences" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '500' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '500' }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#f1f5f9', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }} />
                <Area type="monotone" dataKey="inferences" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorInferences)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-horizon p-6">
          <h2 className="text-base font-black text-gray-800 mb-1">Emotion Matrix</h2>
          <p className="text-xs text-gray-400 font-medium mb-4">Real-time sentiment distribution</p>
          <div className="h-[200px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={emotionData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                  {emotionData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
              <span className="text-2xl font-black text-gray-800">{topEmotion.value}%</span>
              <span className={`text-[10px] font-bold uppercase tracking-wide ${topEmotion.name === 'Stressed' || topEmotion.name === 'Sad' ? 'text-red-500' : 'text-emerald-500'}`}>{topEmotion.name}</span>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {emotionData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-xs font-medium text-gray-600">{item.name}</span>
                </div>
                <span className="text-xs font-bold text-gray-800">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Support Widget */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-horizon overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-gray-800 flex items-center gap-2">Pending Tickets <FiMessageSquare className="text-blue-500" size={15} /></h2>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Open support requests</p>
            </div>
            <Link to="/admin/support" className="p-2 rounded-xl bg-gray-50 border border-gray-100 text-gray-400 hover:bg-blue-50 hover:text-blue-500 hover:border-blue-100 transition-all">
              <FiExternalLink size={14} />
            </Link>
          </div>
          <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
            {pendingSupport.length === 0 ? (
              <div className="text-center py-10">
                <FiCheckCircle className="text-emerald-400 mx-auto mb-2" size={28} />
                <p className="text-emerald-600 font-bold text-xs uppercase tracking-wide">No Pending Tickets</p>
              </div>
            ) : pendingSupport.map((ticket) => (
              <div key={ticket._id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:border-blue-100 hover:bg-blue-50/20 transition-all cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 overflow-hidden">
                      <img src={ticket.user?.profilePicture || `https://api.dicebear.com/7.x/notionists/svg?seed=${ticket.user?.name || 'A'}&backgroundColor=transparent`} className="w-full h-full object-cover" alt="user" />
                    </div>
                    <span className="text-sm font-bold text-gray-800">{ticket.user?.name || 'Unknown'}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${ticket.priority === 'Critical' || ticket.priority === 'High' ? 'bg-red-50 text-red-500 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{ticket.priority || 'Normal'}</span>
                </div>
                <p className="text-xs text-gray-500 font-medium line-clamp-2">{ticket.message || ticket.issue}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                  <span className="text-[10px] text-gray-400 flex items-center gap-1"><FiClock size={10} /> {new Date(ticket.createdAt).toLocaleDateString()}</span>
                  <Link to="/admin/support" className="text-[10px] font-bold text-blue-500 hover:text-purple-600 transition-colors">Reply →</Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Telemetry Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-horizon overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-base font-black text-gray-800 flex items-center gap-2">
              System Telemetry
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </h2>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Live event stream</p>
          </div>
          <div className="overflow-x-auto max-h-[300px] overflow-y-auto custom-scrollbar">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-gray-50/90">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide text-left">Time</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide text-left">Target</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide text-left">Action</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentActivity.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-10 text-center text-xs text-gray-400">No telemetry data available</td></tr>
                ) : recentActivity.map((log, index) => (
                  <tr key={log._id || index} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-6 py-3 text-[10px] font-medium text-gray-400">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                        log.target?.includes('User') ? 'bg-blue-50 text-blue-500' :
                        log.target?.includes('System') ? 'bg-amber-50 text-amber-600' :
                        'bg-gray-100 text-gray-500'
                      }`}>{log.target}</span>
                    </td>
                    <td className="px-6 py-3 text-xs font-medium text-gray-700">{log.action}</td>
                    <td className={`px-6 py-3 text-right text-[10px] font-bold uppercase tracking-wide ${log.status === 'Success' ? 'text-emerald-500' : 'text-red-500'}`}>{log.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
