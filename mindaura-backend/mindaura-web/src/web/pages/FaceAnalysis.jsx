import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { FiCamera, FiCheckCircle } from 'react-icons/fi';
import Navbar from '../components/Navbar';

export default function FaceAnalysis() {
    const webcamRef = useRef(null);
    const [isScanning, setIsScanning] = useState(false);
    const [result, setResult] = useState(null);

    const handleScan = useCallback(() => {
        setIsScanning(true);
        setResult(null);
        // Simulate deep-learning edge extraction
        setTimeout(() => {
            setIsScanning(false);
            setResult({ emotion: "Happy", conf: "94.2%" });
        }, 4000);
    }, []);

    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-500">
          <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Facial Expression Matrix</h1>
              <p className="text-slate-500 mt-2">MindAura extracts 43 unique action units mapping directly to Ekman's model.</p>
          </div>
          
          <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="relative rounded-3xl overflow-hidden bg-slate-900 border-4 border-slate-800 aspect-video flex items-center justify-center shadow-inner group">
                <Webcam 
                    ref={webcamRef}
                    audio={false}
                    videoConstraints={{ facingMode: "user" }}
                    className={`w-full h-full object-cover transition-opacity duration-1000 ${isScanning ? 'opacity-50' : 'opacity-90'}`}
                    mirrored={true}
                />
                
                {/* HUD Overlay - Bounding Boxes */}
                <div className="absolute inset-0 pointer-events-none border-[12px] border-emerald-500/10 rounded-2xl transition-all"></div>
                <div className={`absolute inset-1/4 pointer-events-none rounded-2xl transition-all duration-1000 ${isScanning ? 'scale-90 border-2 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'border border-emerald-500/50 mix-blend-screen'}`}>
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg"></div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg"></div>
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg"></div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg"></div>
                </div>

                {isScanning && (
                    <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm flex flex-col items-center justify-center z-10 animate-in fade-in">
                        <div className="relative w-20 h-20 mb-6">
                            <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                            <div className="absolute inset-2 border-4 border-emerald-400 border-b-transparent rounded-full animate-spin-reverse delay-150"></div>
                        </div>
                        <p className="text-white font-extrabold tracking-widest uppercase text-sm drop-shadow-md">Mapping Neural Grid...</p>
                    </div>
                )}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="w-full sm:w-auto mb-4 sm:mb-0 h-14 flex items-center">
                    {result && (
                        <div className="px-5 py-3 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-extrabold flex items-center shadow-sm animate-in slide-in-from-left-4">
                            <FiCheckCircle className="mr-2 text-xl" /> 
                            <span>{result.emotion} <span className="text-emerald-600 ml-2 font-semibold">({result.conf})</span></span>
                        </div>
                    )}
                </div>
                
                <button 
                  onClick={handleScan}
                  disabled={isScanning}
                  className={`w-full sm:w-auto px-8 py-4 font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center ${
                      isScanning ? 'bg-slate-300 text-slate-500' : 'bg-slate-900 hover:bg-slate-800 text-white hover:shadow-slate-900/30 hover:-translate-y-0.5'
                  }`}
                >
                    <FiCamera className="mr-2 text-xl" /> {result ? 'Re-scan Local Arrays' : 'Initialize Lens'}
                </button>
            </div>
            
            <p className="mt-6 text-xs font-semibold text-slate-400 text-center uppercase tracking-widest hidden sm:block">
                Zero-Retention Policy • Frames dropped securely post-computation.
            </p>
          </div>
        </main>
      </div>
    );
}
