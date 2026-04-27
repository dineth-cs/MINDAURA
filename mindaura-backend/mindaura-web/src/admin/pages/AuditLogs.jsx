import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import {
  FiShield, FiClock, FiUser, FiActivity,
  FiCheckCircle, FiXCircle, FiInfo, FiKey,
  FiSearch, FiFilter, FiDownload
} from 'react-icons/fi';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPurging, setIsPurging] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchLogs = async () => {
    try {
      const { data } = await axiosInstance.get('/admin/audit-logs');
      setLogs(data);
    } catch (error) {
      console.error("Backend logs unavailable:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const handlePurge = async () => {
    if (!window.confirm("Are you sure you want to purge all audit logs? This cannot be undone.")) return;
    setIsPurging(true);
    try {
      await axiosInstance.delete('/admin/audit-logs/purge');
      await fetchLogs();
      setCurrentPage(1);
    } catch (err) {
      console.error("Failed to purge logs", err);
      alert("Failed to purge logs. Please check server connection.");
    } finally {
      setIsPurging(false);
    }
  };

  const exportLogs = () => {
    if (logs.length === 0) return alert("No logs available to export.");
    const headers = ['Timestamp', 'Action', 'Initiator', 'Target', 'Status', 'IP Address'];
    const csvRows = logs.map(log => [
      log.time || new Date(log.createdAt).toLocaleString(),
      log.action, log.user, log.target, log.status, log.ip
    ].map(v => `"${v}"`).join(','));
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindaura-audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const cycleFilter = () => {
    const statuses = ['All', 'Success', 'Failed', 'Blocked'];
    const nextIndex = (statuses.indexOf(filterStatus) + 1) % statuses.length;
    setFilterStatus(statuses[nextIndex]);
    setCurrentPage(1);
  };

  const filteredLogs = logs.filter(log => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (log.action && log.action.toLowerCase().includes(searchLower)) ||
      (log.user && log.user.toLowerCase().includes(searchLower)) ||
      (log.target && log.target.toLowerCase().includes(searchLower)) ||
      (log.ip && log.ip.toLowerCase().includes(searchLower));
    const matchesStatus = filterStatus === 'All' || log.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Success': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Failed': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'Blocked': return 'bg-red-50 text-red-500 border-red-100';
      default: return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Page Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Audit Logs</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">System-wide security ledger and administrative event stream.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 border border-blue-100">
          <FiKey className="text-blue-500 text-sm" />
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">Security Level: Root</span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-horizon p-4 flex flex-col md:flex-row items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 w-full md:w-72 gap-2">
            <FiSearch className="text-gray-400 text-sm flex-shrink-0" />
            <input
              type="text"
              placeholder="Search logs..."
              className="bg-transparent border-none focus:outline-none text-sm text-gray-700 placeholder-gray-400 w-full"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <button
            onClick={cycleFilter}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
              filterStatus !== 'All'
                ? 'bg-purple-50 border-purple-100 text-purple-600'
                : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
            }`}
          >
            <FiFilter size={14} />
            <span className="hidden sm:inline">{filterStatus === 'All' ? 'Filter' : filterStatus}</span>
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePurge}
            disabled={isPurging}
            className="px-4 py-2.5 bg-red-50 border border-red-100 text-red-500 rounded-xl text-xs font-bold transition-all hover:bg-red-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPurging ? 'Purging...' : 'Purge Logs'}
          </button>
          <button
            onClick={exportLogs}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-100 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-100 transition-all"
          >
            <FiDownload size={14} />
            Export
          </button>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-horizon overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Action</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Initiator</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Target</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Status</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wide">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs text-gray-400 font-medium">Loading logs...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FiInfo className="w-8 h-8 text-gray-300" />
                      <span className="text-xs text-gray-400 font-medium">No events found.</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedLogs.map((log) => (
                <tr key={log.id || log._id} className="hover:bg-gray-50/70 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <FiClock className="text-gray-300 w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-xs font-medium text-gray-600">
                        {log.time || new Date(log.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">{log.action}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
                        <FiUser size={11} />
                      </div>
                      <span className="text-xs font-semibold text-gray-600">{log.user}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-gray-500">{log.target}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide ${getStatusStyle(log.status)}`}>
                      {log.status === 'Success' ? <FiCheckCircle size={10} /> : <FiXCircle size={10} />}
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-[11px] font-mono font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">{log.ip}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/30">
          <p className="text-xs font-medium text-gray-400">
            Showing {paginatedLogs.length} of {filteredLogs.length} events
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
