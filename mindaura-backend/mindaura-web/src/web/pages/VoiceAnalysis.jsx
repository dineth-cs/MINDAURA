import React, { useState } from 'react';
import { FiMic, FiSquare, FiActivity } from 'react-icons/fi';
import Navbar from '../components/Navbar';

export default function VoiceAnalysis() {
    const [isRecording, setIsRecording] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState(null);

    const toggleRecording = () => {
        if (!isRecording) {
            setIsRecording(true);
            setResult(null);
        } else {
            setIsRecording(false);
            setIsAnalyzing(true);
            setTimeout(() => {
                setIsAnalyzing(false);
                setResult("Calm & Confident (82% Metric)");
            }, 3500);
        }
    };

    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-10 animate-in fade-in duration-500">
          <div className="text-center mb-10">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Vocal Tone Analysis</h1>
              <p className="text-slate-500 mt-2">MindAura extracts micro-fluctuations directly from your pitch arrays.</p>
          </div>
          
          <div className="bg-white rounded-[2rem] p-8 md:p-16 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
            
            {/* Background decoration */}
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply opacity-5 blur-3xl"></div>
            
            <div className="mb-12 relative">
                <div className={`absolute inset-0 rounded-full ${isRecording ? 'bg-red-500 animate-ping opacity-20' : 'bg-purple-100 opacity-50'} transition-all duration-1000`}></div>
                <div className={`w-40 h-40 rounded-full flex items-center justify-center relative z-10 shadow-2xl transition-all duration-500 border-8 ${isRecording ? 'bg-red-50 border-red-200 scale-105' : 'bg-white border-purple-50 hover:scale-105 hover:border-purple-100'}`}>
                    {isRecording ? (
                        <FiActivity className="text-7xl text-red-500 animate-pulse" />
                    ) : (
                        <FiMic className="text-7xl text-purple-600" />
                    )}
                </div>
            </div>

            <h2 className={`text-2xl font-bold mb-3 ${isRecording ? 'text-red-600' : 'text-slate-800'}`}>
                {isRecording ? 'Recording Live Audio Stream...' : 'Ready to Listen'}
            </h2>
            <p className="text-slate-500 mb-10 max-w-sm font-medium leading-relaxed">
                {isRecording 
                  ? 'Speak naturally about your day. Algorithms are mapping pitch, cadence, and vocal fry frequencies securely.' 
                  : 'Press the button below to stream biometric vocal waveforms sequentially.'}
            </p>

            <div className="h-24 w-full flex justify-center items-center">
                {isAnalyzing ? (
                    <div className="flex flex-col items-center bg-slate-50 py-4 px-8 rounded-2xl border border-slate-100 w-full max-w-sm animate-in zoom-in-95">
                        <div className="w-8 h-8 rounded-full border-4 border-purple-500 border-t-transparent animate-spin mb-3"></div>
                        <span className="font-bold text-slate-700 tracking-tight">Processing Graph Maps...</span>
                    </div>
                ) : result ? (
                    <div className="py-4 px-8 bg-purple-50 border border-purple-100 rounded-2xl w-full max-w-sm animate-in zoom-in-95">
                        <p className="text-purple-600 font-semibold mb-1 uppercase tracking-widest text-xs">Acoustic State Hook:</p>
                        <p className="text-2xl font-extrabold text-purple-900 tracking-tight">{result}</p>
                    </div>
                ) : null}
            </div>

            <button 
                onClick={toggleRecording}
                disabled={isAnalyzing}
                className={`mt-10 px-10 py-4 rounded-2xl font-bold shadow-xl transition-all flex items-center justify-center space-x-2 text-lg transform hover:-translate-y-1 ${
                    isRecording 
                        ? 'bg-red-500 text-white hover:bg-red-600 hover:shadow-red-500/30' 
                        : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-purple-600/30 w-full sm:w-auto'
                } ${isAnalyzing ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}
            >
                {isRecording ? <><FiSquare className="mr-2 fill-current" /> Stop Recording</> : <><FiMic className="mr-2" /> Start Microphone Array</>}
            </button>
            
          </div>
        </main>
      </div>
    );
}
