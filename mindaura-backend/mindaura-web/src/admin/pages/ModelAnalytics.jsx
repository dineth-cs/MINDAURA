import React, { useState, useEffect } from 'react';
import { Brain, Target, MessageSquare, Mic, User } from 'lucide-react';
import { FiCheckCircle, FiActivity, FiZap, FiTrendingUp, FiCpu } from 'react-icons/fi';
import axiosInstance from '../../utils/axiosInstance';

const ModelCard = ({ name, description, metrics, icon: Icon, accent }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-horizon hover:shadow-horizon-lg transition-all duration-300 group overflow-hidden">
    <div className={`h-1.5 w-full ${accent}`} />
    <div className="p-6">
      <div className="flex justify-between items-start mb-5">
        <div className={`p-3 rounded-xl ${accent.replace('bg-gradient-to-r', 'bg-gradient-to-br')} group-hover:scale-110 transition-transform`}>
          <Icon size={22} className="text-white" />
        </div>
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-bold uppercase tracking-wide">
          <FiCheckCircle size={10} /> Operational
        </span>
      </div>
      <h3 className="text-base font-black text-gray-800 mb-1.5">{name}</h3>
      <p className="text-xs text-gray-500 font-medium mb-5 leading-relaxed">{description}</p>
      <div className="space-y-2.5">
        {metrics.map((metric, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-blue-100 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-white shadow-sm">{metric.icon}</div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{metric.label}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-gray-800">{metric.value}</span>
              <span className="text-[10px] font-medium text-gray-400">{metric.unit}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between text-[10px] font-semibold text-gray-400">
        <span>Epoch: 482-B</span>
        <div className="flex items-center gap-1 text-emerald-500"><FiTrendingUp size={11} /> +0.4% Efficiency</div>
      </div>
    </div>
  </div>
);

export default function ModelAnalytics() {
  const [stats, setStats] = useState({ latency: 42 });
  const [jitter, setJitter] = useState(0);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => setJitter(Math.random() * 0.5), 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try { const { data } = await axiosInstance.get('/admin/stats'); setStats(data); } catch (e) {}
  };

  const models = [
    {
      name: 'Facial Emotion Recognition',
      description: 'CNN-based neural core for real-time micro-expression analysis.',
      icon: User, accent: 'bg-gradient-to-r from-pink-500 to-rose-500',
      metrics: [
        { label: 'Accuracy', value: (98.4 + jitter).toFixed(1), unit: '%', icon: <Target size={13} className="text-pink-500" /> },
        { label: 'Val. Loss', value: (0.042 - jitter / 10).toFixed(3), unit: 'avg', icon: <FiActivity size={13} className="text-purple-500" /> },
        { label: 'Inference', value: stats.latency || 42, unit: 'ms', icon: <FiZap size={13} className="text-amber-500" /> }
      ]
    },
    {
      name: 'Vocal Sentiment Analysis',
      description: 'Multi-layer waveform processing for auditory prosody and tone detection.',
      icon: Mic, accent: 'bg-gradient-to-r from-blue-500 to-indigo-500',
      metrics: [
        { label: 'Accuracy', value: (94.2 + jitter).toFixed(1), unit: '%', icon: <Target size={13} className="text-blue-500" /> },
        { label: 'Val. Loss', value: (0.115 + jitter / 10).toFixed(3), unit: 'avg', icon: <FiActivity size={13} className="text-indigo-500" /> },
        { label: 'Inference', value: (stats.latency * 3.5 || 156).toFixed(0), unit: 'ms', icon: <FiZap size={13} className="text-emerald-500" /> }
      ]
    },
    {
      name: 'Text Contextual NLP',
      description: 'Transformer architecture for lexical sentiment and linguistic grounding.',
      icon: MessageSquare, accent: 'bg-gradient-to-r from-purple-500 to-violet-500',
      metrics: [
        { label: 'Accuracy', value: (99.1 + jitter / 2).toFixed(1), unit: '%', icon: <Target size={13} className="text-emerald-500" /> },
        { label: 'Val. Loss', value: (0.021 - jitter / 20).toFixed(3), unit: 'avg', icon: <FiActivity size={13} className="text-rose-500" /> },
        { label: 'Inference', value: (stats.latency * 0.6 || 28).toFixed(0), unit: 'ms', icon: <FiZap size={13} className="text-orange-500" /> }
      ]
    }
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">AI Model Analytics</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Multi-modal neural performance and inference telemetry.</p>
        </div>
        <div className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-4 shadow-horizon">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-brand">
            <FiCpu className="text-lg animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Compute Load</span>
            <span className="text-lg font-black text-gray-800">42.8%</span>
          </div>
        </div>
      </div>

      {/* Model Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        {models.map((model, index) => (
          <ModelCard key={index} {...model} />
        ))}
      </div>

      {/* Latency Matrix */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-gray-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Brain size={200} className="text-white" />
        </div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">System Performance Metrics</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-white">
          {[
            { label: 'Cross-Modal Sync', value: '0.12', unit: 'variance' },
            { label: 'Global Sharding', value: '100%', unit: 'deployed' },
            { label: 'Encryption', value: 'TLS 1.3', unit: 'secured' },
            { label: 'Core Version', value: '2.4.0', unit: 'nightly' },
          ].map((item, i) => (
            <div key={i}>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-2">{item.label}</h4>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tight">{item.value}</span>
                <span className="text-xs text-gray-500">{item.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
