import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, ShieldAlert, CheckCircle2, User, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../context/AlertProvider';
import PMISLogo from '../components/common/PMISLogo';

const MasterRecovery = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const handleRecoveryRequest = async (e) => {
    e.preventDefault();
    
    // Security check: Only allow recovery for the Super Admin Master Email
    if (
      email.toLowerCase() !== 'admin@princeton.com' && 
      email.toLowerCase() !== 'support@princeton.com' &&
      email.toLowerCase() !== 'kabirhaldar4444@gmail.com' &&
      email.toLowerCase() !== 'karthikriyan7@gmail.com'
    ) {
      showAlert('Unauthorized recovery request. This event has been logged.', 'error');
      return;
    }

    setLoading(true);

    try {
      // 1. Trigger Supabase Password Reset to route ONLY to the owner's email
      const { error } = await supabase.auth.resetPasswordForEmail('karthikriyan7@gmail.com', {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      // The actual reset link is handled securely by Supabase.
      // We removed Web3Forms here so you don't get duplicate emails without links,
      // and to remove the "Visitor IP" / "Powered by Web3Forms" branding.

      setSubmitted(true);
      showAlert('Master recovery link dispatched successfully.', 'success');
    } catch (err) {
      showAlert(err.message || 'Recovery failed. System offline.', 'error');
    } finally {
      setLoading(false);
    }
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
           <PMISLogo size={100} />
        </div>
        <h1 className="text-2xl font-black text-[#1A2B3B] tracking-tight uppercase">Master Recovery</h1>
        <p className="text-[10px] font-black text-rose-600 uppercase tracking-[0.3em] mt-1">Administrative Access Restoration</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="w-full max-w-[420px] px-6 mt-4"
      >
        <div className="relative">
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleRecoveryRequest} 
                className="space-y-6"
              >
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-4">
                    Master Admin Email
                  </label>
                  <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1A2B3B] transition-colors z-10">
                      <User className="w-5 h-5" />
                    </div>
                    <input 
                      type="email" 
                      required
                      className="w-full pl-14 pr-6 py-5 bg-white/60 backdrop-blur-xl border-2 border-white shadow-xl shadow-slate-200/40 rounded-[2rem] text-slate-800 text-base placeholder:text-slate-400 focus:outline-none focus:border-[#1A2B3B]/20 focus:bg-white focus:shadow-[#1A2B3B]/10 transition-all font-medium"
                      placeholder="Enter Master Admin Email only"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#1A2B3B] to-[#2A4464] hover:from-[#2A4464] hover:to-[#3A5D8A] text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-blue-900/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.2em]"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Verify Identity <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 bg-white/60 backdrop-blur-xl border-2 border-white shadow-xl shadow-slate-200/40 rounded-[2.5rem]"
              >
                <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-emerald-100">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Link Dispatched</h3>
                <p className="text-slate-500 text-sm leading-relaxed px-8">
                  A secure recovery link has been sent to the primary admin email. A secondary security alert was also sent to your verification ID.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-12 text-center">
            <button 
              onClick={() => navigate('/login')}
              className="text-[10px] font-black text-slate-400 hover:text-rose-700 uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              Return to Login Portal
            </button>
          </div>
        </div>
      </motion.div>

      <footer className="mt-12 text-center opacity-30">
         <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-400">Princeton Ecosystem</p>
      </footer>
    </div>
  );
};

export default MasterRecovery;

