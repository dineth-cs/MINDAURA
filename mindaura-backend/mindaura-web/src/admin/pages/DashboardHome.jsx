import React, { useState, useEffect } from 'react';
import { FiUsers, FiActivity, FiServer, FiDownload, FiArrowUpRight, FiTrendingUp, FiCalendar } from 'react-icons/fi';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import axiosInstance from '../../utils/axiosInstance';

export default function DashboardHome() {
  const [stats, setStats] = useState({ userCount: 0, uptime: 0, latency: 0, tickets: { pending: 0, inProgress: 0, resolved: 0 } });
  const [growthData, setGrowthData] = useState([]);
  const [moodDistribution, setMoodDistribution] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('Weekly');

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      setStats(prev => ({ ...prev, uptime: (prev.uptime || 0) + 1 }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, logsRes] = await Promise.all([
        axiosInstance.get('/admin/stats'),
        axiosInstance.get('/admin/audit-logs')
      ]);
      setStats(statsRes.data);
      setLogs(logsRes.data || []);
    } catch (error) {
      console.warn("API Offline. Failed to fetch dashboard data.", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setChartsLoading(true);
    try {
      const [growthRes, moodRes] = await Promise.all([
        axiosInstance.get(`/admin/analytics/user-growth?range=${timeframe.toLowerCase()}`),
        axiosInstance.get('/admin/analytics/mood-distribution')
      ]);
      setGrowthData(growthRes.data);
      setMoodDistribution(moodRes.data);
    } catch (error) {
      console.warn("Analytics API Error", error);
    } finally {
      setChartsLoading(false);
    }
  };

  const handleExport = () => {
    if (logs.length === 0) return alert("No system data available to export.");
    const headers = ['Timestamp', 'Action', 'Target', 'Initiator', 'Status', 'IP'];
    const csvRows = [headers.join(',')];
    logs.forEach(log => {
      const row = [
        new Date(log.createdAt).toISOString(),
        `"${log.action}"`,
        `"${log.target}"`,
        `"${log.user}"`,
        log.status,
        log.ip
      ];
      csvRows.push(row.join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindaura_system_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatUptime = (seconds) => {
    if (!seconds) return '0h 0m 0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
  };

  const statCards = [
    {
      label: 'Total Enrolled Users',
      value: stats.userCount.toLocaleString(),
      change: 'Live',
      icon: <FiUsers className="text-blue-500 text-xl" />,
      iconBg: 'bg-blue-50',
      badge: 'bg-blue-50 text-blue-600 border-blue-100'
    },
    {
      label: 'Active Support Tickets',
      value: (stats.tickets?.pending || 0) + (stats.tickets?.inProgress || 0),
      change: `${stats.tickets?.pending || 0} Pending`,
      icon: <FiActivity className="text-purple-500 text-xl" />,
      iconBg: 'bg-purple-50',
      badge: 'bg-purple-50 text-purple-600 border-purple-100'
    },
    {
      label: 'System Uptime',
      value: formatUptime(stats.uptime),
      change: 'Healthy',
      icon: <FiServer className="text-emerald-500 text-xl" />,
      iconBg: 'bg-emerald-50',
      badge: 'bg-emerald-50 text-emerald-600 border-emerald-100'
    },
  ];

  const systemAlerts = logs.filter(l =>
    l.target === 'System Logs' || l.target === 'System Firewall' || l.status !== 'Success'
  ).slice(0, 5);

  const positiveMood = moodDistribution.find(m => m.name === 'Happy' || m.name === 'Energy')?.value || 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">

      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Platform telemetry and user engagement metrics.</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold rounded-xl shadow-brand hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
        >
          <FiDownload size={14} />
          Export Report
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-gray-100 p-6 shadow-horizon hover:shadow-horizon-lg transition-all duration-300 group cursor-default"
          >
            <div className="flex items-center justify-between mb-5">
              <div className={`p-3 rounded-xl ${stat.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                {stat.icon}
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide ${stat.badge}`}>
                {stat.change}
              </span>
            </div>
            <p className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">{stat.label}</p>
            <h3 className="text-3xl font-black text-gray-800 tracking-tight">
              {loading ? (
                <span className="inline-block w-16 h-8 bg-gray-100 rounded-lg animate-skeleton"></span>
              ) : stat.value}
            </h3>
          </div>
        ))}
      </div>

      {/* Enhanced Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* User Growth Area Chart */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-horizon p-6 flex flex-col min-h-[420px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-lg font-black text-gray-800">User Growth</h2>
              <p className="text-xs text-gray-400 font-medium">Monitoring registration velocity</p>
            </div>
            
            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 self-start sm:self-center">
              {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide rounded-lg transition-all ${
                    timeframe === t 
                      ? 'bg-white text-blue-600 shadow-sm border border-gray-100' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 w-full relative">
            {chartsLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontBold: true }} 
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontBold: true }} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '16px', boxShadow: '0 15px 30px -10px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#6366f1' }}
                    labelStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '4px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="newUsers" 
                    stroke="#6366f1" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorUsers)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-xs font-medium">No growth data for this period</div>
            )}
          </div>
        </div>

        {/* Global Mood Distribution Doughnut Chart */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-horizon p-6 flex flex-col min-h-[420px]">
          <div className="mb-8">
            <h2 className="text-lg font-black text-gray-800">Global Mood Distribution</h2>
            <p className="text-xs text-gray-400 font-medium">Real-time emotional aggregate</p>
          </div>
          
          <div className="flex-1 flex flex-col md:flex-row items-center justify-between gap-8 relative">
            {chartsLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            
            <div className="h-[260px] w-full md:w-1/2 relative">
              {moodDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={moodDistribution}
                      innerRadius={75}
                      outerRadius={100}
                      paddingAngle={6}
                      dataKey="value"
                      stroke="none"
                      animationBegin={200}
                      animationDuration={1800}
                    >
                      {moodDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-xs">No mood data</div>
              )}
              
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none translate-y-[-4px]">
                <span className="text-4xl font-black text-gray-800 leading-none">{positiveMood}%</span>
                <span className="text-[11px] font-bold text-blue-500 uppercase tracking-[0.15em] mt-2">Positive</span>
              </div>
            </div>

            <div className="w-full md:w-[45%] grid grid-cols-1 gap-3 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
              {moodDistribution.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50/50 border border-gray-50 hover:border-gray-200 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.fill }} />
                    <span className="text-xs font-bold text-gray-700 group-hover:text-gray-900">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-gray-800">{item.value}%</span>
                    <FiArrowUpRight className={`text-[10px] ${item.value > 20 ? 'text-emerald-500' : 'text-gray-300'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed and System Health (Remaining same as before) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-horizon p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-black text-gray-800">Recent System Events</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Live Audit Ledger</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">Event Time</th>
                  <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">Action Descriptor</th>
                  <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">Module</th>
                  <th className="pb-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan="4" className="py-10 text-center">Syncing...</td></tr>
                ) : logs.slice(0, 7).map((log, i) => (
                  <tr key={i} className="hover:bg-gray-50/70 transition-colors group">
                    <td className="py-4 text-xs text-gray-400 font-medium whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors leading-tight">{log.action}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="px-2 py-0.5 rounded bg-gray-50 text-[10px] font-bold text-gray-500 uppercase border border-gray-100">{log.target}</span>
                    </td>
                    <td className="py-4 text-right">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wide border ${log.status === 'Success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-horizon p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-black text-gray-800">System Health</h2>
            <div className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </div>
          </div>
          <div className="space-y-4 mb-8">
            {[
              { label: 'API Connectivity', status: 'Optimal', val: `${stats.latency || 12}ms`, color: 'text-emerald-500' },
              { label: 'Cloud Database', status: 'Healthy', val: '99.9%', color: 'text-blue-500' },
              { label: 'System Uptime', status: 'Active', val: formatUptime(stats.uptime).split(' ')[0], color: 'text-purple-500' },
            ].map((h, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/50 border border-gray-50">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{h.label}</p>
                  <p className="text-xs font-black text-gray-800">{h.status}</p>
                </div>
                <span className={`text-[10px] font-black ${h.color}`}>{h.val}</span>
              </div>
            ))}
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-1">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Priority Alerts</h3>
            {systemAlerts.map((alert, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group">
                <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${alert.status !== 'Success' ? 'bg-red-500' : 'bg-blue-500'}`} />
                <div>
                  <p className="text-xs font-bold text-gray-700 leading-snug">{alert.action}</p>
                  <p className="text-[9px] text-gray-400 mt-1 font-medium">{new Date(alert.createdAt).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
