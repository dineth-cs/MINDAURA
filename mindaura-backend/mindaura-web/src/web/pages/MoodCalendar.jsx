import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { FiCalendar, FiClock, FiFileText } from 'react-icons/fi';
import axiosInstance from '../../utils/axiosInstance';
import Navbar from '../components/Navbar';

export default function MoodCalendar() {
    const [value, onChange] = useState(new Date());
    const [history, setHistory] = useState([]);
    const [selectedEntry, setSelectedEntry] = useState(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const { data } = await axiosInstance.get('/journal');
            setHistory(data.journals || []);
        } catch (err) {
            console.warn('Fallback history for Calendar visual testing.');
            
            // Build pseudo-dates for the last 3 days
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            setHistory([
                { _id: '1', content: 'Felt really productive today after setting up the new calendar!', emotion: 'Happy', createdAt: today.toISOString() },
                { _id: '2', content: 'Huge deadline is looming. Not sleeping well.', emotion: 'Stressed', createdAt: yesterday.toISOString() }
            ]);
        }
    };

    // Filter entry when active date changes
    useEffect(() => {
        const matchingEntry = history.find(entry => {
            const entryDate = new Date(entry.createdAt);
            return entryDate.toDateString() === value.toDateString();
        });
        setSelectedEntry(matchingEntry || null);
    }, [value, history]);

    // Enhance Calendar Tile injection
    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const hasJournal = history.find(entry => new Date(entry.createdAt).toDateString() === date.toDateString());
            if (hasJournal) {
                const colorMap = {
                    Happy: 'bg-emerald-500',
                    Stressed: 'bg-rose-500',
                    Neutral: 'bg-slate-400',
                    Reflective: 'bg-purple-500'
                };
                const colorClass = colorMap[hasJournal.emotion] || 'bg-blue-500';
                return (
                    <div className="flex justify-center items-center mt-1">
                        <div className={`w-2 h-2 rounded-full ${colorClass} shadow-sm`}></div>
                    </div>
                );
            }
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <Navbar />
            <main className="max-w-5xl mx-auto px-4 py-8 animate-in fade-in duration-500">
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Emotional Calendar</h1>
                    <p className="text-slate-500 mt-2 font-medium">Review exactly how you've felt across specific days visually.</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    
                    {/* Calendar Core */}
                    <div className="w-full lg:w-1/2">
                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex items-center justify-center">
                            <Calendar 
                                onChange={onChange} 
                                value={value} 
                                tileContent={tileContent}
                                className="custom-calendar-shadow w-full border-none rounded-2xl font-sans"
                            />
                        </div>
                    </div>

                    {/* Entry Reading Panel */}
                    <div className="w-full lg:w-1/2 flex flex-col">
                        <div className={`flex-1 bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-slate-100 transition-all duration-300 relative overflow-hidden ${selectedEntry ? 'border-blue-200' : ''}`}>
                            
                            {selectedEntry && (
                                <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full opacity-20 pointer-events-none ${
                                    selectedEntry.emotion === 'Happy' ? 'bg-emerald-500' :
                                    selectedEntry.emotion === 'Stressed' ? 'bg-rose-500' :
                                    selectedEntry.emotion === 'Neutral' ? 'bg-slate-500' :
                                    'bg-blue-500'
                                }`}></div>
                            )}

                            <h2 className="text-2xl font-extrabold text-slate-800 mb-6 flex items-center tracking-tight">
                                <FiCalendar className="mr-3 text-blue-500" />
                                {value.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            </h2>

                            {selectedEntry ? (
                                <div className="animate-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest border ${
                                            selectedEntry.emotion === 'Happy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                            selectedEntry.emotion === 'Stressed' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                            selectedEntry.emotion === 'Neutral' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                                            'bg-blue-50 text-blue-700 border-blue-200'
                                        }`}>
                                            State: {selectedEntry.emotion || 'Unanalyzed'}
                                        </span>
                                        <span className="flex items-center text-xs text-slate-400 font-bold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                            <FiClock className="mr-1.5" />
                                            {new Date(selectedEntry.createdAt).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center">
                                        <FiFileText className="mr-2" />
                                        Private Journal Entry
                                    </h4>
                                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 font-medium leading-relaxed shadow-inner">
                                        {selectedEntry.content}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[300px] text-center px-4 opacity-70">
                                    <FiFileText className="text-6xl text-slate-200 mb-4" />
                                    <h3 className="text-lg font-bold text-slate-400 mb-2">No Logging Detected</h3>
                                    <p className="text-slate-400 font-medium">You did not log any journals or sensor predictions on this date.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
