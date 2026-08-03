import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff, Smartphone, Laptop, Watch, Headphones } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertProvider';

import PMISLogo from '../components/common/PMISLogo';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const isMasterEmail = 
    email.toLowerCase() === 'admin@princeton.com' || 
    email.toLowerCase() === 'support@princeton.com' ||
    email.toLowerCase() === 'kabirhaldar4444@gmail.com' ||
    email.toLowerCase() === 'karthikriyan7@gmail.com';

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await login(email, password);
      
      // Fetch profile for role-based redirection
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, profile_completed, full_name, allotted_exam_ids')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      showAlert('Verification successful. Welcome back!', 'success');
      
      // Multi-Role Redirection Logic
      setTimeout(() => {
        if (profile.role === 'admin') {
          navigate('/admin');
        } else if (profile.role === 'super_admin') {
          navigate('/super-admin');
        } else {
          navigate(profile.profile_completed ? '/' : '/complete-profile');
        }
      }, 800);

    } catch (error) {
      if (error.message?.toLowerCase().includes('email not confirmed')) {
        showAlert('Email not confirmed! Please check your inbox.', 'warning');
      } else {
        showAlert(error.message || 'Login failed. Please check credentials.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden font-outfit">
      {/* Background Elements - Multi-color Ethereal Aesthetic */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="bubble w-40 h-40 top-[15%] left-[5%]" style={{ animation: 'bubble-drift-right 50s infinite linear' }}>
          <div className="bubble-glow bg-blue-400/10" />
        </div>
        <div className="bubble w-32 h-32 bottom-[20%] right-[5%]" style={{ animation: 'bubble-drift-left 45s infinite linear' }}>
          <div className="bubble-glow bg-indigo-400/10" />
        </div>
        <div className="bubble w-48 h-48 top-[40%] right-[10%]" style={{ animation: 'bubble-drift-left 55s infinite linear', animationDelay: '-12s' }}>
          <div className="bubble-glow bg-emerald-400/10" />
        </div>
        <div className="bubble w-36 h-36 bottom-[10%] left-[15%]" style={{ animation: 'bubble-drift-right 48s infinite linear', animationDelay: '-5s' }}>
          <div className="bubble-glow bg-amber-400/10" />
        </div>
        <div className="bubble w-28 h-28 top-[5%] right-[30%]" style={{ animation: 'bubble-drift-left 42s infinite linear', animationDelay: '-20s' }}>
          <div className="bubble-glow bg-rose-400/10" />
        </div>
      </div>

      <div className="relative z-10 w-full px-6 flex flex-col items-center justify-center">
        {/* Aggressively Tightened Logo & Form Integration */}
        <motion.div 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-2 transform-gpu scale-75 sm:scale-[0.85] max-w-[280px] mx-auto"
        >
           <PMISLogo variant="login" />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full max-w-[320px] mx-auto"
        >
          <form onSubmit={handleLogin} className="space-y-0">
            <div className="space-y-0">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 block mb-0 leading-none">
                Authorized Email
              </label>
              <div className="relative group">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 transition-colors duration-300 group-focus-within:text-primary-500 text-slate-300">
                  <Mail className="w-4 h-4" />
                </div>
                <input 
                  type="email" 
                  required
                  className="w-full pl-7 pr-4 py-2 bg-transparent border-b border-slate-200 text-slate-800 text-base placeholder:text-slate-300 focus:outline-none focus:border-primary-500 transition-all font-medium" 
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-6 space-y-0 text-left">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 block mb-0 leading-none">
                Secure Password
              </label>
              <div className="relative group">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 transition-colors duration-300 group-focus-within:text-primary-500 text-slate-300">
                  <Lock className="w-4 h-4" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-7 pr-12 py-2 bg-transparent border-b border-slate-200 text-slate-800 text-base placeholder:text-slate-300 focus:outline-none focus:border-primary-500 transition-all font-medium" 
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-300 hover:text-slate-900 transition-all"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-6">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 group overflow-hidden relative text-xs uppercase tracking-[0.2em]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Access Portal <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" /></>}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] transition-transform" />
              </button>
            </div>

            <div className="pt-3 text-center">
              <button
                type="button"
                onClick={() => navigate('/admission')}
                className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors flex items-center justify-center gap-1.5 mx-auto"
              >
                <span>New Candidate? Submit Online Admission</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          <footer className="mt-6 pt-4 border-t border-slate-200/50 flex flex-col items-center gap-0">
            <AnimatePresence>
              {isMasterEmail && (
                <motion.button 
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  type="button"
                  onClick={() => navigate('/master-recovery')}
                  className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-rose-700 transition-colors cursor-pointer overflow-hidden"
                >
                  Master Recovery Portal
                </motion.button>
              )}
            </AnimatePresence>
            <p className="text-slate-300 text-[9px] font-black uppercase tracking-[0.6em] opacity-30 mt-1">
              Princeton Ecosystem
            </p>
          </footer>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;

