import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  FiMessageSquare, FiCheckCircle, FiClock, FiSend, FiX, FiActivity,
  FiAlertCircle, FiLoader, FiMoreVertical, FiSearch
} from 'react-icons/fi';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-hot-toast';
import io from 'socket.io-client';

export default function SupportRequests() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [socket, setSocket] = useState(null);
  const chatEndRef = useRef(null);
  const activeTicketRef = useRef(null);

  useEffect(() => { activeTicketRef.current = activeTicketId; }, [activeTicketId]);

  useEffect(() => {
    const newSocket = io('https://mindaura-wfut.onrender.com', { transports: ['websocket'], autoConnect: true });
    setSocket(newSocket);
    newSocket.on('receive_message', (newMessage) => {
      const currentRoomId = activeTicketRef.current;
      if (currentRoomId) {
        setTickets(prev => prev.map(t => {
          if (t._id === currentRoomId) {
            const historyArray = Array.isArray(t?.history) ? t.history : [];
            const exists = historyArray.some(msg => msg?.text === newMessage?.text && msg?.sender === newMessage?.sender);
            if (!exists) {
              setTimeout(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, 150);
              return { ...t, history: [...historyArray, newMessage] };
            }
          }
          return t;
        }));
      }
    });
    return () => { newSocket.off('receive_message'); newSocket.disconnect(); };
  }, []);

  useEffect(() => { if (socket && activeTicketId) socket.emit('join_ticket', activeTicketId); }, [socket, activeTicketId]);

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async () => {
    try {
      const { data } = await axiosInstance.get('/support/admin');
      setTickets(data.map(d => ({ ...d, history: Array.isArray(d?.history) ? d.history : [] })));
    } catch (error) {
      console.warn("API Offline.");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const { data } = await axiosInstance.put(`/support/admin/${id}/status`, { status: newStatus });
      setTickets(tickets.map(t => t._id === id ? { ...data, history: data?.history || [] } : t));
      toast.success(`Ticket marked as ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleReplySubmit = async (id) => {
    if (!replyText.trim()) return;
    const payload = replyText;
    setReplyText('');
    try {
      const { data } = await axiosInstance.post(`/support/admin/${id}/reply`, { text: payload });
      setTickets(prev => prev.map(t => t._id === id ? { ...data, history: Array.isArray(data?.history) ? data.history : [] } : t));
      toast.success("Reply sent.");
      setTimeout(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, 150);
    } catch (error) {
      toast.error("Failed to send reply");
    }
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return { badge: 'bg-amber-50 text-amber-600 border-amber-100', icon: <FiAlertCircle /> };
      case 'in-progress': return { badge: 'bg-blue-50 text-blue-600 border-blue-100', icon: <FiLoader className="animate-spin" /> };
      case 'resolved': return { badge: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <FiCheckCircle /> };
      default: return { badge: 'bg-gray-100 text-gray-500 border-gray-200', icon: <FiClock /> };
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Support Requests</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-gray-400 text-sm font-medium">Real-time Socket.io active</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-horizon gap-2 w-full md:w-64">
            <FiSearch className="text-gray-400 text-sm flex-shrink-0" />
            <input type="text" placeholder="Search tickets..." className="bg-transparent border-none focus:outline-none text-sm text-gray-700 placeholder-gray-400 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-xl shadow-horizon">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="agent" />
                </div>
              ))}
            </div>
            <span className="text-xs font-semibold text-gray-500">3 Agents Online</span>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-400 font-medium">Loading support tickets...</p>
          </div>
        ) : tickets
          ?.filter(t =>
            t?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t?.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t?.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t?._id?.toLowerCase().includes(searchTerm.toLowerCase())
          )
          ?.map((ticket) => {
            const { badge, icon } = getStatusStyle(ticket?.status || 'pending');
            const isActive = activeTicketId === ticket?._id;
            return (
              <div key={ticket?._id} className="bg-white rounded-2xl border border-gray-100 shadow-horizon overflow-hidden hover:shadow-horizon-lg transition-all duration-300">
                {/* Ticket Header */}
                <div className="px-6 py-3.5 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                      #{ticket?._id?.slice(-6).toUpperCase()}
                    </span>
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide ${badge}`}>
                      {icon} {ticket?.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${ticket?.priority === 'High' ? 'text-red-500' : 'text-gray-400'}`}>
                      {ticket?.priority} Priority
                    </span>
                    <FiMoreVertical className="text-gray-400 cursor-pointer" />
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row">
                  {/* Left: User Info */}
                  <div className="p-6 lg:w-80 border-r border-gray-50 flex-shrink-0">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="relative flex-shrink-0">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden">
                          <img src={ticket?.user?.profilePicture || `https://api.dicebear.com/7.x/notionists/svg?seed=${ticket?.user?.name}&backgroundColor=transparent`} alt="avatar" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                      </div>
                      <div>
                        <p className="text-base font-black text-gray-800 leading-tight">{ticket?.user?.name || "Anonymous"}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{ticket?.user?.email}</p>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-1">Connection</p>
                        <div className="flex items-center justify-between text-xs font-semibold text-blue-600">
                          <span>{isActive ? 'Chat Active' : 'Idle'}</span>
                          <FiActivity size={12} className={isActive ? 'animate-pulse text-emerald-500' : 'text-gray-300'} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleStatusUpdate(ticket?._id, 'in-progress')} className="py-2 rounded-xl text-[10px] font-bold uppercase border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all">In Progress</button>
                        <button onClick={() => handleStatusUpdate(ticket?._id, 'resolved')} className="py-2 rounded-xl text-[10px] font-bold uppercase border border-emerald-100 text-emerald-600 hover:bg-emerald-50 transition-all">Resolve</button>
                      </div>
                    </div>
                  </div>

                  {/* Right: Chat */}
                  <div className="p-6 flex-1 flex flex-col">
                    {isActive ? (
                      <>
                        <div className="flex-1 space-y-4 max-h-[380px] overflow-y-auto pr-2 mb-5 custom-scrollbar">
                          {ticket?.history?.map((msg, i) => {
                            const isAdmin = msg?.sender === 'admin';
                            return (
                              <div key={i} className={`flex gap-3 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed ${
                                  isAdmin
                                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-br-sm shadow-brand'
                                    : 'bg-gray-100 text-gray-700 rounded-tl-sm'
                                }`}>
                                  <p className="whitespace-pre-wrap">{msg?.text}</p>
                                  <span className={`block mt-1.5 text-[9px] font-bold uppercase tracking-wide text-right ${isAdmin ? 'text-blue-200' : 'text-gray-400'}`}>
                                    {isAdmin ? 'You' : ticket?.user?.name} · {msg?.time ? new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={chatEndRef} />
                        </div>
                        <div className="relative">
                          <textarea
                            className="w-full p-4 pr-28 rounded-2xl border border-gray-200 bg-gray-50 resize-none focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-3 focus:ring-blue-100 transition-all text-sm text-gray-700 placeholder-gray-400"
                            placeholder="Type your reply..."
                            rows={3}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReplySubmit(ticket?._id); } }}
                          />
                          <button
                            onClick={() => handleReplySubmit(ticket?._id)}
                            className="absolute bottom-3 right-3 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
                          >
                            Send <FiSend size={12} />
                          </button>
                        </div>
                        <button
                          onClick={() => { setActiveTicketId(null); if (socket) socket.emit('leave_ticket', ticket?._id); }}
                          className="mt-3 text-xs font-semibold text-gray-400 hover:text-red-500 flex items-center gap-1.5 transition-colors"
                        >
                          <FiX size={12} /> Close Chat
                        </button>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <button
                          onClick={() => setActiveTicketId(ticket?._id)}
                          className="w-full max-w-xs py-8 rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 flex flex-col items-center gap-3 text-gray-400 hover:text-blue-500 transition-all group"
                        >
                          <FiMessageSquare size={22} className="group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-bold uppercase tracking-wide">Open Chat</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {tickets.length === 0 && !loading && (
        <div className="text-center py-24 space-y-5">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
            <FiCheckCircle size={36} />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-800">All Clear!</h3>
            <p className="text-gray-400 text-sm font-medium mt-1">No support tickets at the moment.</p>
          </div>
        </div>
      )}
    </div>
  );
}
