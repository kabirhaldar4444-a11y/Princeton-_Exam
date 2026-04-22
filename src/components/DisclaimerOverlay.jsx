import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CheckCircle } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useAlert } from '../context/AlertProvider';

const DisclaimerOverlay = ({ user, profile, onAccepted }) => {
  const { showAlert } = useAlert();
  const [disclaimerCheckbox, setDisclaimerCheckbox] = useState(false);
  const [loading, setLoading] = useState(false);

  // Smart Logic: Force showing every time before registration is complete (Session-based)
  const isSessionAccepted = typeof window !== 'undefined' && sessionStorage.getItem(`disclaimer_accepted_${user?.id}`);
  
  if (!profile) return null;
  
  // Rule: Only hide if (DB flag is true AND profile is complete) OR its already accepted in THIS session
  if ((profile.disclaimer_accepted === true && profile.profile_completed === true) || isSessionAccepted) {
    return null;
  }

  const handleAcceptDisclaimer = async () => {
    if (!disclaimerCheckbox) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ disclaimer_accepted: true })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Save to session to allow this registration session to proceed
      sessionStorage.setItem(`disclaimer_accepted_${user?.id}`, 'true');
      
      if (onAccepted) onAccepted();
      showAlert('Terms accepted successfully', 'success');
      
      // Force an immediate refresh to sync database state with UI
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err) {
      showAlert(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="bg-white/95 backdrop-blur-3xl border border-white/50 w-full max-w-[960px] rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-primary-50/50 to-transparent">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary-600/20">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Princeton Policies</h3>
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-[0.2em] mt-1">Review our service delivery and privacy standards</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
            <div className="max-w-[850px] mx-auto space-y-12">
              
              {/* 1. Service Delivery / Platform */}
              <section className="space-y-6">
                <h4 className="text-[26px] font-bold text-slate-900 border-l-4 border-primary-500 pl-5">1. Service Delivery / Platform</h4>
                <div className="bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100/80">
                  <ul className="space-y-4">
                    <li className="flex items-start gap-4 text-[16px] leading-[1.7] text-slate-600">
                      <div className="w-2 h-2 rounded-full bg-primary-500 mt-[9px] shrink-0 shadow-sm shadow-primary-500/20" />
                      <span>One attempt allowed for Pre-Board and Final exams</span>
                    </li>
                    <li className="flex items-start gap-4 text-[16px] leading-[1.7] text-slate-600">
                      <div className="w-2 h-2 rounded-full bg-primary-500 mt-[9px] shrink-0 shadow-sm shadow-primary-500/20" />
                      <span>Soft copy certificate issued within 15 days after final exam</span>
                    </li>
                    <li className="flex items-start gap-4 text-[16px] leading-[1.7] text-slate-600">
                      <div className="w-2 h-2 rounded-full bg-primary-500 mt-[9px] shrink-0 shadow-sm shadow-primary-500/20" />
                      <span>No physical certificate (only digital)</span>
                    </li>
                  </ul>

                  <div className="mt-10 pt-8 border-t border-slate-200/60">
                    <h5 className="text-[20px] font-semibold text-slate-800 mb-6 px-1">Pre-Exam Reward System:</h5>
                    <ul className="space-y-4">
                      {[
                        '80%+ score = eligible for rewards',
                        '5+ gift options (₹50K–₹1L range)',
                        'Delivery in 45–60 days',
                        'Tracking shared via email',
                        'OTP required for delivery',
                        'Company may use student photos for promotion'
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-4 text-[16px] leading-[1.7] text-slate-600">
                          <span className="text-primary-500 font-bold mt-[-2px]">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              {/* 2. Privacy Policy */}
              <section className="space-y-6">
                <h4 className="text-[26px] font-bold text-slate-900 border-l-4 border-primary-500 pl-5">2. Privacy Policy</h4>
                <div className="bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100/80">
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                    {[
                      'Data used for enrollment, payments, exams, communication, and improvement',
                      'Data is NOT sold or shared commercially',
                      'Stored securely with encryption and limited access',
                      'Payment data handled securely',
                      'Cookies used for login and analytics',
                      'Data retained only as needed',
                      'Users can access, correct, or delete their data',
                      'Policy updates may occur anytime'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-4 text-[15px] leading-[1.6] text-slate-600">
                        <div className="w-2 h-2 rounded-full bg-primary-500 mt-[8px] shrink-0 shadow-sm shadow-primary-500/20" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* 3. Terms & Conditions */}
              <section className="space-y-6">
                <h4 className="text-[26px] font-bold text-slate-900 border-l-4 border-primary-500 pl-5">3. Terms & Conditions</h4>
                <div className="bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100/80">
                  <ul className="space-y-4">
                    {[
                      'One attempt allowed for exams',
                      'Certificate issued after final exam',
                      'Refund rules apply (see below)',
                      'Reward system based on performance (80%+)'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-4 text-[16px] leading-[1.7] text-slate-600">
                        <div className="w-2 h-2 rounded-full bg-primary-500 mt-[9px] shrink-0 shadow-sm shadow-primary-500/20" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* 4. Refund Policy */}
              <section className="space-y-6">
                <h4 className="text-[26px] font-bold text-slate-900 border-l-4 border-primary-500 pl-5">4. Refund Policy</h4>
                <div className="bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100/80">
                  <ul className="space-y-4">
                    {[
                      'No refund after exam attempt or content access',
                      'Refund allowed only within 24 hours of payment',
                      '90% refund (10% deduction mandatory)',
                      'Processing time: 5–7 working days (+7 days bank time)',
                      'Request must include name, email, course, receipt, and reason',
                      'No 100% refund under any condition'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-4 text-[16px] leading-[1.7] text-slate-600">
                        <div className="w-2 h-2 rounded-full bg-primary-500 mt-[9px] shrink-0 shadow-sm shadow-primary-500/20" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* Final Key Points */}
              <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 blur-[100px] rounded-full -mr-32 -mt-32" />
                <div className="relative z-10">
                  <h4 className="text-[24px] font-bold mb-8 flex items-center gap-3">
                    <CheckCircle className="w-7 h-7 text-primary-400" />
                    Final Key Points
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      'Strict no-refund after usage',
                      'Short refund window (24 hours)',
                      'Digital-only system',
                      'Performance-based rewards',
                      'Strong data protection policies'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-4 text-[16px] font-medium text-slate-300 leading-relaxed">
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                        </div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>
          </div>

          <div className="p-10 bg-slate-50/80 border-t border-slate-100 flex flex-col gap-6">
            <label className="flex items-center gap-4 cursor-pointer group">
              <div className="relative">
                <input 
                  type="checkbox" 
                  id="disclaimer-check"
                  className="peer sr-only" 
                  checked={disclaimerCheckbox}
                  onChange={() => setDisclaimerCheckbox(!disclaimerCheckbox)}
                />
                <div className="w-6 h-6 border-2 border-slate-200 rounded-lg group-hover:border-primary-500 transition-all peer-checked:bg-primary-500 peer-checked:border-primary-500" />
                <CheckCircle className="absolute inset-0 w-6 h-6 text-white scale-0 peer-checked:scale-75 transition-transform" />
              </div>
              <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">I agree and continue to the platform</span>
            </label>

            <button 
              onClick={handleAcceptDisclaimer}
              disabled={!disclaimerCheckbox || loading}
              className="w-full btn-premium !py-5 !rounded-2xl !text-base shadow-xl hover:shadow-primary-500/25 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
            >
              Continue to Platform
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DisclaimerOverlay;
