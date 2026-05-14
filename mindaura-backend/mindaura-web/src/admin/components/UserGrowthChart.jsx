import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import axios from 'axios';

export default function UserGrowthChart() {
  const [timeframe, setTimeframe] = useState('monthly');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/admin/analytics/user-growth?range=${timeframe.toLowerCase()}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        // Sometimes backend might be on different URL, ideally use env vars or relative paths if proxied.
        // If the app uses a proxy, '/api/admin/...' would work. Assuming standard setup based on user prompt.
        setData(response.data);
      } catch (error) {
        console.error("Failed to fetch user growth data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeframe]);

  return (
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
              onClick={() => setTimeframe(t.toLowerCase())}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide rounded-lg transition-all ${
                timeframe === t.toLowerCase() 
                  ? 'bg-white text-[#4F46E5] shadow-sm border border-gray-100' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
            <div className="w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
                dy={10} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '16px', boxShadow: '0 15px 30px -10px rgba(0,0,0,0.1)' }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#4F46E5' }}
                labelStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '4px' }}
              />
              <Area 
                type="monotone" 
                dataKey="users" 
                stroke="#4F46E5" 
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
  );
}
