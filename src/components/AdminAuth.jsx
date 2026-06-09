import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ShieldAlert, AlertTriangle, ArrowRight, ShieldCheck, LogOut, ArrowLeft } from 'lucide-react';

function AdminAuth({ session }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInErr) throw signInErr;

      // Check if logged-in user is an admin
      const loggedUser = data?.user;
      const isAdmin = loggedUser && (
        loggedUser.email?.toLowerCase().includes('admin') || 
        loggedUser.email?.toLowerCase() === 'admin@tezx.com' ||
        loggedUser.email?.toLowerCase() === 'r@gmail.com'
      );

      if (!isAdmin) {
        // If not admin, we trigger signout to prevent session retention, or let the session prop check handle it.
        // For standard flow, we will let the prop trigger the Access Denied screen.
        // We will throw a custom error to block login if needed, or simply let the app re-render with the new session
        // and show the Access Denied state.
        // Let's sign out immediately to be secure, but show access denied.
        await supabase.auth.signOut();
        throw new Error('Access Denied: The credentials provided do not have administrative privileges.');
      }

      // If admin, update URL to admin view and dispatch route
      window.history.pushState({}, '', '#/admin');
      window.dispatchEvent(new Event('popstate'));
    } catch (err) {
      console.error('Admin Auth Error:', err);
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new Event('popstate'));
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setLoading(false);
    }
  };

  const goBackToUserPortal = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new Event('popstate'));
  };

  // If a session exists but is not an admin session (i.e. user is currently a normal user)
  const isNonAdminSession = session && !(
    session.user.email?.toLowerCase().includes('admin') || 
    session.user.email?.toLowerCase() === 'admin@tezx.com' ||
    session.user.email?.toLowerCase() === 'r@gmail.com'
  );

  return (
    <div className="w-screen h-screen bg-[#070b13] font-body-md text-white flex items-center justify-center selection:bg-brand-blue/30 relative overflow-hidden select-none">
      {/* High Fidelity Cybernetic Background Glows */}
      <div className="absolute top-[-25%] right-[-10%] w-[700px] h-[700px] rounded-full bg-[#1769ff]/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-25%] left-[-10%] w-[700px] h-[700px] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none" />
      <div className="absolute top-[30%] left-[20%] w-[300px] h-[300px] rounded-full bg-cyan-500/5 blur-[100px] pointer-events-none" />

      {/* Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <div className="w-full max-w-lg p-4 z-10">
        <AnimatePresence mode="wait">
          {isNonAdminSession ? (
            /* ACCESS DENIED VIEW */
            <motion.div
              key="access-denied"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-slate-950/70 border border-red-500/20 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center relative overflow-hidden"
            >
              {/* Top Warning Accents */}
              <div className="absolute top-0 left-0 w-full h-[3px] bg-red-600" />
              
              <div className="w-16 h-16 bg-red-950/60 border border-red-500/30 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                <ShieldAlert className="w-[32px] h-[32px] animate-pulse" />
              </div>

              <span className="text-[10px] font-black text-red-500 tracking-[0.2em] uppercase bg-red-950/40 border border-red-900/50 px-3 py-1 rounded-md mb-3 inline-block">
                Security Alert // Access Restrained
              </span>

              <h2 className="text-[22px] font-black tracking-tight mb-3">Administrator Privileges Required</h2>
              
              <p className="text-[13px] text-slate-400 leading-relaxed max-w-sm mx-auto mb-8">
                Your current active session (<span className="text-white font-bold">{session.user.email}</span>) does not have authorization to access the admin portal.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSignOut}
                  disabled={loading}
                  className="w-full py-3.5 px-6 bg-red-600 hover:bg-red-700 text-white font-extrabold text-[13px] rounded-xl transition-all shadow-md flex items-center justify-center gap-2 border-none cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out current account</span>
                </button>
                
                <button
                  onClick={goBackToUserPortal}
                  className="w-full py-3.5 px-6 bg-slate-900 hover:bg-slate-800 text-slate-300 font-extrabold text-[13px] rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-800 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to User Desk</span>
                </button>
              </div>
            </motion.div>
          ) : (
            /* ADMIN LOGIN FORM VIEW */
            <motion.div
              key="admin-login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-slate-950/80 border border-slate-800/80 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative overflow-hidden"
            >
              {/* Top Accent Bar */}
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600" />

              {/* Console Info Header */}
              <div className="flex justify-between items-center text-slate-500 text-[9px] font-mono tracking-widest uppercase mb-6 pb-4 border-b border-slate-900/60">
                <span>Console v4.2</span>
                <span className="flex items-center gap-1 text-blue-400">
                  <ShieldCheck className="w-3 h-3" />
                  SSL Secured
                </span>
              </div>

              {/* Shield Logo */}
              <div className="w-14 h-14 bg-blue-950/40 border border-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(59,130,246,0.05)]">
                <ShieldCheck className="w-[28px] h-[28px]" />
              </div>

              {/* Form Titles */}
              <div className="mb-6">
                <h1 className="text-[24px] font-black tracking-tight leading-none text-white">
                  TezX Admin Console
                </h1>
                <p className="text-[13px] text-slate-400 mt-2 font-medium">
                  Enter authorized administrator credentials to establish session shell.
                </p>
              </div>

              {/* Error Alert */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="bg-red-950/30 border border-red-500/30 text-red-400 rounded-xl p-3.5 mb-6 flex items-start gap-2.5 text-[12px] font-medium"
                  >
                    <AlertTriangle className="w-[18px] h-[18px] flex-shrink-0 text-red-500 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form Inputs */}
              <form onSubmit={handleLogin} className="space-y-4">
                
                {/* Email Address */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    Console Identity (Email)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 pointer-events-none">
                      <Mail className="w-[18px] h-[18px]" />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="admin@tezx.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-11 pl-11 pr-4 bg-slate-900/60 border border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 transition-all font-body-sm text-[13px] text-white"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    Security Passcode
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 pointer-events-none">
                      <Lock className="w-[18px] h-[18px]" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 pl-11 pr-11 bg-slate-900/60 border border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 transition-all font-body-sm text-[13px] text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 hover:text-white bg-transparent border-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                    </button>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[13px] rounded-xl transition-all active:scale-[0.99] mt-6 shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer border-none"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In to Terminal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Navigation Helper */}
              <div className="mt-6 pt-4 border-t border-slate-900/50 flex justify-center">
                <button
                  onClick={goBackToUserPortal}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-300 flex items-center gap-1 bg-transparent border-none cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Go back to User Portal</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


export default AdminAuth;
