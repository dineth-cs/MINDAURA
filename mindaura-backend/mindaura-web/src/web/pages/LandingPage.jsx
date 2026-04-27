import React from 'react';
import { Link } from 'react-router-dom';
import { 
  HiMicrophone, 
  HiCamera, 
  HiChatBubbleBottomCenterText,
  HiChevronRight,
  HiCheckCircle
} from 'react-icons/hi2';
import Logo from '../../assets/images/logo.svg';

const EmotionCard = ({ name, emoji, desc, tint, border, shadow }) => (
  <div className="group relative transition-all duration-500 hover:-translate-y-2">
    <div className={`absolute -inset-0.5 bg-gradient-to-r ${border} rounded-[2rem] opacity-0 group-hover:opacity-100 transition duration-500 blur`}></div>
    <div className={`relative ${tint} backdrop-blur-xl border border-white/60 p-8 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] ${shadow} transition-all h-full flex flex-col items-center text-center`}>
      <div className="text-6xl mb-6 transform transition-transform group-hover:scale-110 duration-500">{emoji}</div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">{name}</h3>
      <p className="text-slate-500 text-sm font-medium leading-relaxed">{desc}</p>
    </div>
  </div>
);

const FeatureStep = ({ icon: Icon, title, desc, step, gradient, shadow }) => (
  <div className="flex flex-col items-center text-center group">
    <div className={`w-20 h-20 rounded-[2rem] ${gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-2xl ${shadow} text-white`}>
      <Icon className="w-10 h-10" />
    </div>
    <div className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Step {step}</div>
    <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
    <p className="text-slate-500 font-medium max-w-[250px]">{desc}</p>
  </div>
);

export default function LandingPage() {
  const emotions = [
    { 
      name: 'Happy', 
      emoji: '😊', 
      desc: 'Capturing moments of genuine joy and internal contentment.',
      tint: 'bg-yellow-50/60',
      border: 'from-orange-400 to-yellow-400',
      shadow: 'hover:shadow-yellow-500/20'
    },
    { 
      name: 'Sad', 
      emoji: '😢', 
      desc: 'Understanding the depths of loss, empathy, and reflection.',
      tint: 'bg-blue-50/60',
      border: 'from-blue-400 to-cyan-400',
      shadow: 'hover:shadow-blue-500/20'
    },
    { 
      name: 'Stressed', 
      emoji: '😫', 
      desc: 'Identifying pressure points and cognitive overloads.',
      tint: 'bg-red-50/60',
      border: 'from-red-400 to-rose-400',
      shadow: 'hover:shadow-rose-500/20'
    },
    { 
      name: 'Bored', 
      emoji: '🥱', 
      desc: 'Recognizing lack of engagement and needed stimulation.',
      tint: 'bg-purple-50/60',
      border: 'from-purple-400 to-indigo-400',
      shadow: 'hover:shadow-purple-500/20'
    },
    { 
      name: 'Energetic', 
      emoji: '⚡', 
      desc: 'Harnessing peak motivation and physical vitality.',
      tint: 'bg-emerald-50/60',
      border: 'from-emerald-400 to-teal-400',
      shadow: 'hover:shadow-emerald-500/20'
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFF] font-sans selection:bg-blue-200 overflow-x-hidden text-slate-900">
      {/* Mesh Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-white">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/20 rounded-full blur-[128px] animate-blob"></div>
        <div className="absolute top-[10%] right-[-5%] w-[40%] h-[50%] bg-cyan-400/30 rounded-full blur-[128px] animate-blob [animation-delay:2s] mix-blend-multiply opacity-70"></div>
        <div className="absolute bottom-[10%] left-[20%] w-[50%] h-[50%] bg-fuchsia-400/20 rounded-full blur-[128px] animate-blob [animation-delay:4s] mix-blend-multiply opacity-70"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/20 rounded-full blur-[128px] animate-blob"></div>
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full px-6 py-4 lg:px-12 flex justify-between items-center z-50 backdrop-blur-md bg-white/70 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="bg-slate-900 p-2 rounded-xl shadow-lg">
            <img src={Logo} alt="MindAura Logo" className="w-6 h-6 invert" />
          </div>
          <span className="text-xl font-black tracking-tighter text-slate-900">MindAura</span>
        </div>
        <div className="flex items-center space-x-8">
          <div className="hidden md:flex space-x-8 text-sm font-bold text-slate-500">
            <a href="#" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#" className="hover:text-blue-600 transition-colors">How it works</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Science</a>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">Sign In</Link>
            <Link to="/register" className="text-sm font-bold bg-slate-900 text-white px-6 py-3 rounded-full hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 lg:pt-56 lg:pb-40 px-6 lg:px-24">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Column */}
          <div className="flex flex-col items-start text-left space-y-8 animate-in slide-in-from-left-10 duration-1000">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider">Version 1.0 is Live</span>
            </div>
            
            <h1 className="text-5xl lg:text-8xl font-black text-slate-900 tracking-tight leading-[0.95]">
              MindAura: Your <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500">
                AI Mental Wellness
              </span> <br/>
              Companion.
            </h1>
            
            <p className="text-lg lg:text-xl font-medium text-slate-500 max-w-xl leading-relaxed">
              Experience the next generation of emotional intelligence. MindAura uses advanced multi-modal AI to analyze your clinical state through voice, face, and text telemetry.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link 
                to="/register" 
                className="group relative px-10 py-5 rounded-2xl bg-blue-600 text-white font-black text-lg hover:bg-blue-700 transition-all shadow-glow hover:-translate-y-1 flex items-center justify-center overflow-hidden"
              >
                <span className="relative z-10 flex items-center">
                  Get Started for Free
                  <HiChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </Link>
              <button className="px-10 py-5 rounded-2xl bg-white text-slate-800 font-bold text-lg hover:bg-slate-50 transition-all shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-1">
                View Demo
              </button>
            </div>

            <div className="flex items-center space-x-4 pt-4">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold">U{i}</div>
                ))}
              </div>
              <p className="text-sm font-bold text-slate-400">Trusted by 2,000+ early adopters</p>
            </div>
          </div>

          {/* Right Column - CSS Mockup */}
          <div className="relative flex justify-center items-center lg:justify-end animate-in slide-in-from-right-10 duration-1000 delay-200">
            {/* The "Dashboard" Card */}
            <div className="relative w-full max-w-[500px] aspect-[4/3] bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.1)] p-8 animate-float overflow-hidden group">
              <div className="absolute top-0 right-0 p-8">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-ping"></div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="h-2 w-24 bg-blue-200/50 rounded-full"></div>
                  <div className="h-8 w-48 bg-slate-800 rounded-xl"></div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-24 rounded-2xl bg-gradient-to-br from-blue-500/20 to-teal-500/20 border border-white/40 flex items-center justify-center">
                    <HiMicrophone className="w-8 h-8 text-blue-600 opacity-40" />
                  </div>
                  <div className="h-24 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/40 flex items-center justify-center">
                    <HiCamera className="w-8 h-8 text-purple-600 opacity-40" />
                  </div>
                </div>

                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center space-x-3 p-3 rounded-xl bg-white/60">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <HiCheckCircle className="text-emerald-600" />
                      </div>
                      <div className="h-2 w-32 bg-slate-200 rounded-full"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl"></div>
            </div>

            {/* Floating Stats Orbs */}
            <div className="absolute -top-10 -left-10 p-6 bg-white rounded-3xl shadow-2xl border border-slate-50 space-y-2 animate-bounce [animation-duration:4s]">
              <div className="text-xs font-bold text-slate-400">ACCURACY</div>
              <div className="text-2xl font-black text-blue-600">98.2%</div>
            </div>
          </div>

        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 lg:py-32 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-6">How MindAura Works</h2>
            <p className="text-lg font-medium text-slate-500 max-w-2xl mx-auto">
              Our triple-vector analysis system provides the most comprehensive emotional profile ever created by an AI.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-1/4 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-100 to-transparent -z-10"></div>
            
            <FeatureStep 
              step="1"
              icon={HiMicrophone}
              title="Voice Pattern Sync"
              desc="Analysis of vocal jitter, shimmer, and tone to detect underlying stress or fatigue."
              gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
              shadow="shadow-blue-500/30"
            />
            <FeatureStep 
              step="2"
              icon={HiCamera}
              title="Micro-Expression Scan"
              desc="Detecting 42 facial muscle movements that signpost 12 distinct emotional archetypes."
              gradient="bg-gradient-to-br from-fuchsia-500 to-purple-600"
              shadow="shadow-fuchsia-500/30"
            />
            <FeatureStep 
              step="3"
              icon={HiChatBubbleBottomCenterText}
              title="NLP Sentiment Array"
              desc="Deep text analysis using LLM vectors to understand intent and cognitive state."
              gradient="bg-gradient-to-br from-cyan-500 to-blue-500"
              shadow="shadow-cyan-500/30"
            />
          </div>
        </div>
      </section>

      {/* Emotion Matrix Section */}
      <section className="py-24 lg:py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-6">The Emotion 5 Matrix</h2>
              <p className="text-lg font-medium text-slate-500">
                We distill thousands of data points into five core pillars of human experience, providing clarity in complexity.
              </p>
            </div>
            <Link to="/register" className="group flex items-center text-blue-600 font-bold text-lg">
              Explore the Science 
              <HiChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            {emotions.map((emo, index) => (
              <EmotionCard key={index} {...emo} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto rounded-[3rem] bg-slate-900 p-12 lg:p-24 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px]"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px]"></div>
          
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl lg:text-6xl font-black tracking-tight">Ready to understand <br/> your aura?</h2>
            <p className="text-slate-400 text-lg font-medium max-w-2xl mx-auto">
              Join thousands of users who are already improving their mental well-being with data-driven insights.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/register" className="px-10 py-5 rounded-2xl bg-white text-slate-900 font-black text-lg hover:bg-slate-100 transition-all shadow-xl">
                Get Started Now
              </Link>
              <Link to="/login" className="px-10 py-5 rounded-2xl bg-white/10 text-white font-black text-lg border border-white/20 hover:bg-white/20 transition-all">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center space-x-3">
            <div className="bg-slate-900 p-1.5 rounded-lg">
              <img src={Logo} alt="MindAura Logo" className="w-5 h-5 invert" />
            </div>
            <span className="text-lg font-black tracking-tighter text-slate-900">MindAura</span>
          </div>
          <p className="text-slate-400 text-sm font-bold">© 2026 MindAura AI. All rights reserved.</p>
          <div className="flex space-x-6 text-sm font-bold text-slate-500">
            <a href="#" className="hover:text-blue-600 transition-colors">Twitter</a>
            <a href="#" className="hover:text-blue-600 transition-colors">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
