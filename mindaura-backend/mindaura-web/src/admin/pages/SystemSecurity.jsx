import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import {
  Activity, Brain, Shield, Zap, AlertTriangle, RefreshCw, Lock, Globe, Search
} from 'lucide-react';

export default function AdminSecurityPanel() {
  const [isRotating, setIsRotating] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [stats, setStats] = useState({ latency: 12, uptime: 0 });
  const [auditLogs, setAuditLogs] = useState([]);
  const [toggles, setToggles] = useState({
    intrusion: true, neuralShield: true, traffic: false, autoScale: true
  });

  const fetchData = async () => {
    try {
      const [statsRes, logsRes] = await Promise.all([
        axiosInstance.get('/admin/stats').catch(() => ({ data: { latency: 12, uptime: 0 } })),
        axiosInstance.get('/admin/audit-logs').catch(() => ({ data: [] }))
      ]);
      setStats(statsRes.data);
      setAuditLogs(logsRes.data);
    } catch (err) { console.error('Error fetching admin data', err); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = async (key) => {
    const newState = !toggles[key];
    setToggles(prev => ({ ...prev, [key]: newState }));
    try {
      await axiosInstance.post('/admin/firewall/toggle', { setting: key, enabled: newState });
    } catch (err) {
      setToggles(prev => ({ ...prev, [key]: !newState }));
    }
  };

  const rotateKeys = async () => {
    setIsRotating(true);
    try {
      await axiosInstance.post('/admin/rotate-keys');
      setTimeout(() => setIsRotating(false), 1000);
    } catch (err) { setIsRotating(false); }
  };

  const purgeLogs = async () => {
    setIsPurging(true);
    try {
      await axiosInstance.delete('/admin/audit-logs/purge');
      await fetchData();
    } catch (err) { console.error("Failed to purge logs", err); }
    finally { setIsPurging(false); }
  };

  const nodes = [
    { id: 1, region: "US-West-1", role: "PRIMARY", status: "SYNCING", statusStyle: "bg-purple-50 text-purple-600 border-purple-100", latency: `${stats.latency}ms`, load: "42%", progress: 42, progressColor: "bg-purple-500" },
    { id: 2, region: "EU-Central-1", role: "REPLICA", status: "ONLINE", statusStyle: "bg-emerald-50 text-emerald-600 border-emerald-100", latency: `${stats.latency + 40}ms`, load: "12%", progress: 12, progressColor: "bg-emerald-500" },
    { id: 3, region: "US-East-1", role: "COLD-STORE", status: "STANDBY", statusStyle: "bg-gray-100 text-gray-500 border-gray-200", latency: "12ms", load: "0%", progress: 0, progressColor: "bg-gray-300" }
  ];

  const threats = auditLogs.slice(0, 5).map((log, idx) => {
    const isError = log.status === 'Failed' || log.status === 'Blocked';
    return {
      id: log._id || idx,
      risk: isError ? "HIGH" : "LOW",
      riskStyle: isError ? "bg-red-50 text-red-500 border-red-100" : "bg-blue-50 text-blue-600 border-blue-100",
      time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      title: log.action,
      origin: log.ip || "Internal",
      action: log.status ? log.status : "LOGGED",
      actionStyle: isError ? "text-red-500" : "text-emerald-600"
    };
  });

  if (threats.length === 0) {
    threats.push({ id: 1, risk: "HIGH", riskStyle: "bg-red-50 text-red-500 border-red-100", time: "15:10:22", title: "Unauthorized cross-origin request", origin: "102.33.1.5", action: "BLOCKED", actionStyle: "text-red-500" });
    threats.push({ id: 2, risk: "MED", riskStyle: "bg-amber-50 text-amber-600 border-amber-100", time: "14:22:01", title: "Sequential login failure (ID: 4492)", origin: "88.1.12.9", action: "MONITORED", actionStyle: "text-amber-600" });
  }

  const Toggle = ({ active, onClick }) => (
    <button
      onClick={onClick}
      className={`w-10 h-5 rounded-full relative transition-all duration-300 ${active ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${active ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Page Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">System Security</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Security monitoring, firewall governance, and threat detection.</p>
        </div>
        <button
          onClick={rotateKeys}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-brand hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
          {isRotating ? 'Rotating...' : 'Rotate Access Keys'}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {[
          { icon: <Lock className="w-5 h-5" />, iconBg: 'bg-emerald-50 text-emerald-500', badge: 'bg-emerald-50 text-emerald-600 border-emerald-100', badgeText: 'Secure', subtitle: 'E2EE Status', title: 'AES-256 Enabled', desc: 'Data streams encrypted at rest & in transit.' },
          { icon: <Search className="w-5 h-5" />, iconBg: 'bg-blue-50 text-blue-500', badge: 'bg-blue-50 text-blue-600 border-blue-100', badgeText: 'Monitoring', subtitle: 'Threat Detection', title: 'AI-Sentinel Active', desc: 'DPI running on all neural nodes.' },
          { icon: <Globe className="w-5 h-5" />, iconBg: 'bg-purple-50 text-purple-500', badge: 'bg-purple-50 text-purple-600 border-purple-100', badgeText: 'Optimal', subtitle: 'Active Nodes', title: '3/3 Cluster', desc: 'Distribution network is fully synced.' },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-horizon p-5 hover:shadow-horizon-lg transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2.5 rounded-xl ${card.iconBg} group-hover:scale-110 transition-transform`}>{card.icon}</div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide ${card.badge}`}>{card.badgeText}</span>
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{card.subtitle}</p>
            <h3 className="text-lg font-black text-gray-800 mb-1">{card.title}</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Firewall Governance */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-horizon p-5">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-2 rounded-xl bg-purple-50"><Shield className="w-4 h-4 text-purple-500" /></div>
            <h2 className="text-base font-black text-gray-800">Firewall Governance</h2>
          </div>
          <div className="space-y-4 mb-5">
            {[
              { label: 'Intrusion Detection', key: 'intrusion', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
              { label: 'Neural Shield V2', key: 'neuralShield', icon: <Brain className="w-3.5 h-3.5" /> },
              { label: 'Traffic Filtering', key: 'traffic', icon: <Activity className="w-3.5 h-3.5" /> },
              { label: 'Auto-Scale Protection', key: 'autoScale', icon: <Zap className="w-3.5 h-3.5" /> },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-gray-400">{item.icon}</span>
                  <span className="text-sm font-semibold text-gray-700">{item.label}</span>
                </div>
                <Toggle active={toggles[item.key]} onClick={() => handleToggle(item.key)} />
              </div>
            ))}
          </div>
          <div className="bg-purple-50 rounded-xl p-3 flex items-center gap-2 border border-purple-100">
            <Shield className="w-4 h-4 text-purple-500 flex-shrink-0" />
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wide">Neural Guard Operational</span>
          </div>
        </div>

        {/* Node Topology */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-horizon p-5">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-base font-black text-gray-800">Node Topology</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">Active Latency Mapping</p>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50"><Activity className="w-4 h-4 text-emerald-500" /></div>
          </div>
          <div className="space-y-3">
            {nodes.map(node => (
              <div key={node.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <div className="text-sm font-bold text-gray-800">{node.region}</div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">{node.role}</div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-full border ${node.statusStyle}`}>{node.status}</span>
                </div>
                <div className="flex justify-between text-[10px] font-semibold text-gray-400 mb-2">
                  <div className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" /> {node.latency}</div>
                  <div className="flex items-center gap-1"><Activity className="w-3 h-3 text-blue-400" /> {node.load} Load</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div className={`${node.progressColor} h-1 rounded-full transition-all`} style={{ width: `${node.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Threat Matrix */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-horizon p-5 flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-base font-black text-gray-800">Threat Matrix</h2>
            <span className="text-gray-300 font-mono text-base">{`>_`}</span>
          </div>
          <div className="space-y-3 flex-1">
            {threats.map(threat => (
              <div key={threat.id} className="border-l-2 border-gray-200 hover:border-purple-400 pl-3 py-1 transition-colors group">
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${threat.riskStyle}`}>{threat.risk} RISK</span>
                  <span className="text-[9px] font-mono text-gray-400">{threat.time}</span>
                </div>
                <h4 className="text-xs font-semibold text-gray-700 mb-1 truncate">{threat.title}</h4>
                <div className="flex justify-between text-[9px] font-bold uppercase">
                  <span className="text-gray-400">Origin: <span className="text-gray-600">{threat.origin}</span></span>
                  <span className={threat.actionStyle}>{threat.action}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-[10px] font-semibold text-gray-400 hover:bg-gray-50 transition-colors">
            Export Security Report
          </button>
        </div>
      </div>

      {/* Bottom Action Banner */}
      <div className="mt-6 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm flex-shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-emerald-800">Deep-Security Shield Active</h4>
            <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">All nodes operational</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={purgeLogs} className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all active:scale-95">
            {isPurging ? 'Purging...' : 'Purge Logs'}
          </button>
          <button onClick={fetchData} className="flex-1 sm:flex-none px-4 py-2 bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50 text-xs font-bold rounded-xl transition-all active:scale-95">
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
