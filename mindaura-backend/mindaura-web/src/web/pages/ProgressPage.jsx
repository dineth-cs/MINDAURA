import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from '../components/Navbar';

export default function ProgressPage() {
    // Simulated remote backend mapping over 7 days
    const moodData = [
        { day: 'Mon', score: 65, emotion: 'Stressed' },
        { day: 'Tue', score: 72, emotion: 'Neutral' },
        { day: 'Wed', score: 85, emotion: 'Happy' },
        { day: 'Thu', score: 80, emotion: 'Happy' },
        { day: 'Fri', score: 60, emotion: 'Stressed' },
        { day: 'Sat', score: 92, emotion: 'Very Happy' },
        { day: 'Sun', score: 88, emotion: 'Happy' },
    ];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-100">
                    <p className="font-extrabold text-slate-900 mb-1">{label}</p>
                    <p className="text-blue-600 font-bold text-sm uppercase tracking-wider">
                        State: {payload[0].payload.emotion}
                    </p>
                    <p className="text-slate-500 font-semibold text-xs mt-1">
                        Stability Metric: {payload[0].value}%
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Navbar />
            <main className="max-w-5xl mx-auto px-4 py-8 animate-in fade-in duration-500">
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Emotional Progress Tracker</h1>
                    <p className="text-slate-500 mt-2 font-medium">Observe your cognitive fluctuations over the last 7 days.</p>
                </div>

                <div className="bg-white rounded-[2rem] p-6 sm:p-10 shadow-sm border border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800 mb-8 tracking-tight">7-Day Stability Metric Graph</h2>
                    
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={moodData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                  dataKey="day" 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }}
                                  dy={15}
                                />
                                <YAxis 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                                  dx={-10}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                <Line 
                                  type="monotone" 
                                  dataKey="score" 
                                  stroke="#3b82f6" 
                                  strokeWidth={4} 
                                  dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                                  activeDot={{ r: 8, strokeWidth: 0, fill: '#8b5cf6' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </main>
        </div>
    );
}
