import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Sparkles, CheckCircle2, AlertCircle, ArrowRight, Phone } from 'lucide-react';

const marketingQuotes = [
  {
    text: "TezX CRM lets us visual-track lead flows, client milestones, and data pipelines on a fully synchronized Postgres core.",
    author: "Marcus Thorne, CTO @ NexGen",
  },
  {
    text: "The glassmorphic portal interface is incredible. Highly interactive dashboards combined with seamless automations.",
    author: "Clara Vance, Lead Designer @ ApexLabs",
  }
];

function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isSignUp) {
        // Register user
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name || email.split('@')[0],
              phone: phone,
            }
          }
        });

        if (signUpErr) throw signUpErr;

        // If auto-confirm is disabled, user must check email
        if (data?.user && data?.session === null) {
          setSuccessMsg('Account created! Please check your email to verify your account.');
          // Clear inputs
          setEmail('');
          setPassword('');
          setName('');
          setPhone('');
        } else {
          setSuccessMsg('Sign up successful!');
          window.history.pushState({}, '', '/');
          window.dispatchEvent(new Event('popstate'));
        }
      } else {
        // Log in user
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInErr) throw signInErr;

        window.history.pushState({}, '', '/');
        window.dispatchEvent(new Event('popstate'));
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const [quoteIdx, setQuoteIdx] = useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIdx(prev => (prev + 1) % marketingQuotes.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-screen h-screen bg-[#f3f3f5] font-body-md text-[#111111] flex items-center justify-center selection:bg-brand-blue/10 relative overflow-hidden select-none">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#1769ff]/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-brand-purple/10 blur-[130px] pointer-events-none" />
      
      {/* Decorative Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#111111 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* Main Glassmorphic Wrapper */}
      <div className="w-full h-full bg-white/70 backdrop-blur-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
        
        {/* Left Side: Brand Visual Panel (Hidden on mobile) */}
        <div className="lg:col-span-5 bg-gradient-to-tr from-black via-slate-900 to-black p-10 flex flex-col justify-between text-white relative overflow-hidden hidden lg:flex">
          {/* Subtle Abstract Wave Effect */}
          <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-white/5 blur-xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-brand-blue/10 rounded-full blur-2xl pointer-events-none" />

          {/* Logo Section */}
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center shadow-md relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 to-black" />
              <div className="w-3.5 h-3.5 bg-white absolute rotate-12 rounded-sm" />
            </div>
            <span className="text-[28px] font-black tracking-tight font-poppins select-none">
              <span className="text-white">Tez</span><span className="text-[#1769ff]">X</span>
            </span>
          </div>

          {/* Interactive Core Display */}
          <div className="my-auto relative z-10 pr-4">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-full w-fit mb-6 text-[#1769ff] text-[11px] font-extrabold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-white" />
              <span>TezX Sync System</span>
            </div>
            <h2 className="text-[32px] font-black tracking-tight leading-tight">
              Enterprise Grade Client Pipeline
            </h2>
            <p className="text-slate-400 text-[14px] mt-4 leading-relaxed">
              Authenticate securely to enter your personalized dashboard, trace live leads, check active schedules, and interact with company rosters.
            </p>
          </div>

          {/* Rotating Testimonials Footer */}
          <div className="relative z-10 min-h-[90px] border-t border-white/10 pt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={quoteIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
              >
                <p className="text-[13px] text-slate-300 italic leading-relaxed">
                  "{marketingQuotes[quoteIdx].text}"
                </p>
                <p className="text-[11px] text-brand-blue font-bold tracking-wide uppercase mt-2">
                  — {marketingQuotes[quoteIdx].author}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side: Auth Inputs Panel */}
        <div className="lg:col-span-7 p-8 md:p-12 flex flex-col justify-center bg-white text-left">
          
          {/* Top Panel Brand Logo for Mobile only */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center shadow-md relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 to-black" />
              <div className="w-3.5 h-3.5 bg-white absolute rotate-12 rounded-sm" />
            </div>
            <span className="text-[28px] font-black tracking-tight font-poppins flex items-center select-none">
              <span className="text-black">Tez</span><span className="text-[#1769ff]">X</span>
            </span>
          </div>

          {/* Tab Selection */}
          <div className="flex bg-[#f3f3f5] rounded-xl p-1 w-fit mb-8 select-none border border-[#ececec]/60">
            <button
              onClick={() => {
                setIsSignUp(false);
                setError(null);
                setSuccessMsg(null);
                setPhone('');
              }}
              className={`px-6 py-2.5 rounded-lg text-[13px] font-black transition-all flex items-center gap-1.5 ${!isSignUp
                ? 'bg-white text-black shadow-sm'
                : 'text-[#8f8f95] hover:text-black hover:bg-black/5'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsSignUp(true);
                setError(null);
                setSuccessMsg(null);
                setPhone('');
              }}
              className={`px-6 py-2.5 rounded-lg text-[13px] font-black transition-all flex items-center gap-1.5 ${isSignUp
                ? 'bg-white text-black shadow-sm'
                : 'text-[#8f8f95] hover:text-black hover:bg-black/5'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form Header */}
          <div className="mb-6">
            <h1 className="text-[26px] font-black text-black tracking-tight leading-none">
              {isSignUp ? 'Create your Account' : 'Welcome Back'}
            </h1>
            <p className="text-[13px] text-[#8f8f95] mt-2 font-medium">
              {isSignUp ? 'Get started with TezX pipelines today.' : 'Sign in to access your secure client desk.'}
            </p>
          </div>

          {/* Alerts */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-red-50 border border-[#fca5a5]/30 text-[#ba1a1a] rounded-xl p-3.5 mb-6 flex items-start gap-2.5 text-[12px] font-semibold"
              >
                <AlertCircle className="w-[18px] h-[18px] flex-shrink-0 text-red-500 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-emerald-50 border border-[#6ee7b7]/30 text-[#107c41] rounded-xl p-3.5 mb-6 flex items-start gap-2.5 text-[12px] font-semibold"
              >
                <CheckCircle2 className="w-[18px] h-[18px] flex-shrink-0 text-[#107c41] mt-0.5" />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Credentials Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            
            {/* Full Name (Sign Up Only) */}
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-[#8f8f95] uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#8f8f95] pointer-events-none">
                    <User className="w-[18px] h-[18px]" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Alex Rivers"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 pl-11 pr-4 bg-[#f3f3f5]/50 border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/15 focus:border-[#1769ff] focus:bg-white transition-all font-body-sm text-[13px]"
                  />
                </div>
              </div>
            )}

            {/* Phone Number (Sign Up Only) */}
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-[#8f8f95] uppercase tracking-wider">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#8f8f95] pointer-events-none">
                    <Phone className="w-[18px] h-[18px]" />
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-11 pl-11 pr-4 bg-[#f3f3f5]/50 border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/15 focus:border-[#1769ff] focus:bg-white transition-all font-body-sm text-[13px]"
                  />
                </div>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-[#8f8f95] uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#8f8f95] pointer-events-none">
                  <Mail className="w-[18px] h-[18px]" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="alex@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 bg-[#f3f3f5]/50 border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/15 focus:border-[#1769ff] focus:bg-white transition-all font-body-sm text-[13px]"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-black text-[#8f8f95] uppercase tracking-wider">
                  Password
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!email) {
                        setError('Please enter your email address to reset your password.');
                        return;
                      }
                      setLoading(true);
                      supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: window.location.origin
                      })
                      .then(({ error: resetErr }) => {
                        if (resetErr) throw resetErr;
                        setSuccessMsg('Password reset link sent to your email.');
                      })
                      .catch(err => setError(err.message))
                      .finally(() => setLoading(false));
                    }}
                    className="text-[11px] font-bold text-[#1769ff] hover:underline bg-transparent border-none cursor-pointer p-0"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#8f8f95] pointer-events-none">
                  <Lock className="w-[18px] h-[18px]" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-11 pr-11 bg-[#f3f3f5]/50 border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/15 focus:border-[#1769ff] focus:bg-white transition-all font-body-sm text-[13px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#8f8f95] hover:text-[#111111] bg-transparent border-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            {/* Submission Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-black hover:bg-black/95 text-white font-extrabold text-[13px] rounded-xl transition-all active:scale-[0.99] mt-6 shadow-lg shadow-black/5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer border-none"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? 'Sign Up' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
          
          {/* Footer Terms */}
          <div className="mt-8 text-center text-[11px] text-[#8f8f95] font-bold select-none tracking-wide">
            Protected by TezX Key Cryptography and Supabase Auth.
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;
