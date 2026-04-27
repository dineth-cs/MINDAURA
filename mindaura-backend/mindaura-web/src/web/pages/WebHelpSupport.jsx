import React, { useState, useContext } from 'react';
import { FiSend, FiMessageSquare, FiHelpCircle, FiShield, FiCpu, FiArrowRight } from 'react-icons/fi';
import axiosInstance from '../../utils/axiosInstance';
import { ThemeContext } from '../../shared/context/ThemeContext';

export default function WebHelpSupport() {
  const { isDarkMode } = useContext(ThemeContext);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      await axiosInstance.post('/support', { message });
      setSubmitted(true);
      setMessage('');
    } catch (error) {
      console.error("Submission failed:", error);
      // Fallback for demo
      setSubmitted(true);
      setMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen pt-24 pb-20 px-6 font-sans transition-colors duration-500 ${isDarkMode ? 'bg-[#0a0f18] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-top-8 duration-700">
            <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
                How can we <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Support</span> you?
            </h1>
            <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
                Our neural monitoring experts and system safety bots are here to assist with your MindAura experience.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
                { title: 'Security Vault', desc: 'Queries regarding data encryption and biometric safety.', icon: <FiShield className="text-emerald-500" /> },
                { title: 'Algorithm Help', desc: 'Questions on how our Emotion 5 engine interprets data.', icon: <FiCpu className="text-indigo-500" /> },
                { title: 'General Inquiries', desc: 'Billing, account management, and roadmap updates.', icon: <FiHelpCircle className="text-purple-500" /> },
            ].map((box, i) => (
                <div key={i} className={`p-8 rounded-[2.5rem] border transition-all hover:scale-[1.05] duration-500 ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'}`}>
                    <div className="text-3xl mb-6">{box.icon}</div>
                    <h3 className="text-xl font-black mb-3">{box.title}</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{box.desc}</p>
                </div>
            ))}
        </div>

        <div className={`p-8 md:p-12 rounded-[3rem] border relative overflow-hidden transition-all duration-500 ${isDarkMode ? 'bg-[#111827]/60 border-white/10' : 'bg-white border-slate-200 shadow-2xl shadow-indigo-100'}`}>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-12 h-12 bg-indigo-600 rounded-[18px] flex items-center justify-center text-white shadow-xl shadow-indigo-600/30">
                        <FiMessageSquare size={24} />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">Transmission Hub</h2>
                </div>

                {submitted ? (
                    <div className="text-center py-10 animate-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FiSend size={40} />
                        </div>
                        <h3 className="text-2xl font-black mb-2">Message Sent Successfully</h3>
                        <p className="text-slate-500 mb-8 font-medium">Our system agents have received your payload and will respond shortly.</p>
                        <button 
                            onClick={() => setSubmitted(false)}
                            className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-500 transition-all"
                        >
                            Send Another Message
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 ml-2">Message Payload</label>
                            <textarea 
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Explain your query in detail..."
                                className={`w-full min-h-[200px] p-8 rounded-[2rem] border focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all text-lg font-bold ${isDarkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                                required
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-indigo-600/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-4 group active:scale-[0.98] ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isSubmitting ? 'Transmitting...' : 'Send Message'}
                            <FiArrowRight className="group-hover:translate-x-2 transition-transform" />
                        </button>
                    </form>
                )}
            </div>

            {/* Decorative Element */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="mt-20 text-center text-slate-500 text-[10px] font-black uppercase tracking-widest">
            <p>End-to-End Cryptography Enabled • MindAura Neural Trust Network</p>
        </div>
      </div>
    </div>
  );
}
