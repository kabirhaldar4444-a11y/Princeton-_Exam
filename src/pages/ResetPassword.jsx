import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { motion } from 'framer-motion';
import { Lock, Loader2, CheckCircle2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useAlert } from '../context/AlertProvider';

import PMISLogo from '../components/common/PMISLogo';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  useEffect(() => {
    // Check if the user is here with a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showAlert('Invalid or expired recovery link.', 'error');
        navigate('/login');
      }
    };
    checkSession();
  }, [navigate, showAlert]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showAlert('Passwords do not match.', 'error');
      return;
    }
    if (password.length < 8) {
      showAlert('Password must be at least 8 characters.', 'warning');
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    
    if (error) {
      showAlert(error.message, 'error');
    } else {
      setSuccess(true);
      showAlert('Master password updated successfully.', 'success');
      
      // Secondary Alert to Owner
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: '33b16dfe-bac0-40f9-8137-1c00c3b758f8',
          subject: `✅ MASTER PASSWORD UPDATED`,
          from_name: 'Princeton Security System',
          message: `
MASTER PASSWORD SUCCESSFULLY CHANGED
======================================
Status    : SECURED
Timestamp : ${new Date().toLocaleString()}

The master password for the admin account has been updated.
If this wasn't you, please intervene immediately.
          `.trim(),
        }),
      });

      // Force sign out and redirect
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/login');
      }, 3000);
    }
    setLoading(false);
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-[#FDFBF9] relative overflow-hidden font-outfit">
      {/* Soft Ethereal Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-amber-50 rounded-full blur-[120px] opacity-40" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] bg-blue-50 rounded-full blur-[100px] opacity-30" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8 flex flex-col items-center"
      >
        <div className="mb-6 scale-90 sm:scale-100">
           <PMISLogo variant="login" />
        </div>
        <h1 className="text-2xl font-black text-[#1A2B3B] tracking-tight uppercase">Master Recovery</h1>
        <p className="text-[10px] font-black text-rose-600 uppercase tracking-[0.3em] mt-1">Access Credential Restoration</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="w-full max-w-[420px] px-6 mt-4"
      >
        <div className="relative">
          {!success ? (
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-4">
                  Enter New Password
                </label>
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1A2B3B] transition-colors z-10">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full pl-14 pr-12 py-5 bg-white/60 backdrop-blur-xl border-2 border-white shadow-xl shadow-slate-200/40 rounded-[2rem] text-slate-800 text-base placeholder:text-slate-400 focus:outline-none focus:border-[#1A2B3B]/20 focus:bg-white focus:shadow-[#1A2B3B]/10 transition-all font-medium"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-[#1A2B3B] transition-colors z-10"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-4">
                  Confirm New Password
                </label>
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1A2B3B] transition-colors z-10">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full pl-14 pr-6 py-5 bg-white/60 backdrop-blur-xl border-2 border-white shadow-xl shadow-slate-200/40 rounded-[2rem] text-slate-800 text-base placeholder:text-slate-400 focus:outline-none focus:border-[#1A2B3B]/20 focus:bg-white focus:shadow-[#1A2B3B]/10 transition-all font-medium"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#1A2B3B] to-[#2A4464] hover:from-[#2A4464] hover:to-[#3A5D8A] text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-blue-900/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.2em] mt-8"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Apply Master Reset'}
              </button>
            </form>
          ) : (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-10 bg-white/60 backdrop-blur-xl border-2 border-white shadow-xl shadow-slate-200/40 rounded-[2.5rem]"
            >
              <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-emerald-100">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Access Restored</h2>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed px-8">
                The master password has been successfully updated. You are being securely redirected...
              </p>
              <Loader2 className="w-6 h-6 animate-spin text-slate-300 mx-auto" />
            </motion.div>
          )}
        </div>
      </motion.div>

      <footer className="mt-12 text-center opacity-30">
         <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-400">Princeton Ecosystem</p>
      </footer>
    </div>
  );
};

export default ResetPassword;
