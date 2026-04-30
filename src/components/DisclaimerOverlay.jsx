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
              
              {/* 1. Service Delivery */}
              <section className="space-y-6">
                <h4 className="text-[26px] font-bold text-slate-900 border-l-4 border-primary-500 pl-5">1. Service Delivery</h4>
                <div className="bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100/80 space-y-8">
                  <div>
                    <h5 className="text-[18px] font-semibold text-slate-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" />Enrollment Process</h5>
                    <ul className="space-y-3 pl-4 border-l-2 border-slate-200 ml-1">
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Customers visit the Princeton Professional website and fill out the Enrollment Form.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">After form submission, Our team connects with the customer.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">A detailed email is shared explaining the complete process flow and fee structure. Payments may also be accepted directly through an authorized professional expert trainer account, where applicable.</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-[18px] font-semibold text-slate-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" />Process Explanation & Confirmation</h5>
                    <ul className="space-y-3 pl-4 border-l-2 border-slate-200 ml-1">
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">During the call, the team explains the course structure, learning journey, and assessment-to-certification flow.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">The customer then confirms their participation in the program.</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-[18px] font-semibold text-slate-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" />Fee Payment</h5>
                    <ul className="space-y-3 pl-4 border-l-2 border-slate-200 ml-1">
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Upon successful completion of the fee payment, a GST-compliant invoice is issued within 6 hours.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Pre-examination study materials are shared with the learner within 24 hours.</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-[18px] font-semibold text-slate-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" />Pre-Exam</h5>
                    <ul className="space-y-3 pl-4 border-l-2 border-slate-200 ml-1">
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">A Pre-Exam is conducted within 24–48 hours of fee payment.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">This exam assesses the customer’s initial understanding of the selected domain.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Before the exam, the Guidance Team connects to explain the exam process.</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-[18px] font-semibold text-slate-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" />Pre-Exam Result & Pre-Board Professional Certificate</h5>
                    <ul className="space-y-3 pl-4 border-l-2 border-slate-200 ml-1">
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Results are shared within 24–48 hours via email.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">A Pre-Board Professional Certificate is issued with "Under Training" mentioned.</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-[18px] font-semibold text-slate-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" />Reward Eligibility</h5>
                    <ul className="space-y-3 pl-4 border-l-2 border-slate-200 ml-1">
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Customers scoring above 80% become eligible for a gift.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">One gift can be selected from four available options, which will be delivered accordingly.</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-[18px] font-semibold text-slate-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" />Self-Paced Training</h5>
                    <ul className="space-y-3 pl-4 border-l-2 border-slate-200 ml-1">
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Access to recorded video lectures is shared within 15 days on payment.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Training duration is 90–120 days.</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-[18px] font-semibold text-slate-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" />Final Exam & Certificate</h5>
                    <ul className="space-y-3 pl-4 border-l-2 border-slate-200 ml-1">
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">A Final Exam is conducted between 90-120 days.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Upon successful completion of all requirements, the Final Certificate is issued.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">The certificate will clearly state the status as "Certified."</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-[18px] font-semibold text-slate-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" />Continuous Support</h5>
                    <p className="text-[15px] leading-[1.6] text-slate-600 pl-6">Throughout the entire journey, the Princeton Professional team remains in contact for guidance and support.</p>
                  </div>
                </div>
              </section>

              {/* 2. Terms & Conditions */}
              <section className="space-y-6">
                <h4 className="text-[26px] font-bold text-slate-900 border-l-4 border-primary-500 pl-5">2. Terms & Conditions</h4>
                <div className="bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100/80 space-y-8">
                  <div>
                    <h5 className="text-[18px] font-semibold text-slate-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" />Course Duration and Delivery</h5>
                    <ul className="space-y-3 pl-4 border-l-2 border-slate-200 ml-1">
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">The complete course will be delivered within 90 to 120 days from the date of enrollment.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">After enrollment, learners will receive an Invoice, Study Materials and video lectures within 10 working days of making the payment.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">A Pre-Board Exam will be scheduled 24 to 48 hours after payment, accessible via the official Princeton Professional exam portal. An Initial PC Softcopy (indicating "Under Training" and course details), will be provided after going through the pre-board exam within 48 to 72 hours.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">The final online exam must be attended between 90 to 120 days after enrollment.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Upon successful exam completion, the Final PC Softcopy will be emailed to the candidate, indicating "Successfully Certified".</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-[18px] font-semibold text-slate-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" />Training Format</h5>
                    <ul className="space-y-3 pl-4 border-l-2 border-slate-200 ml-1">
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">No live training sessions will be provided.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Study material and training videos will be shared once only via email after the enrollment.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Training videos and study materials are non-transferable and intended solely for enrolled candidates.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Upon successful completion of the program, the certificate will be released with an abbreviation format. For an example if the course you have enrolled in "Resilience Coach Training", then "RCT" will appear on your certificate, similarly if the course name is Decision Making Mastery Training, on the certificate it will show "DMMT"</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-[18px] font-semibold text-slate-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" />Exam Policy</h5>
                    <ul className="space-y-3 pl-4 border-l-2 border-slate-200 ml-1">
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Multiple exam attempts are not permitted, for pre- board as well as final exam.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">The Final PC Softcopy will be issued within 15 days after the final exam attempt.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">No hard copy certificates will be delivered; all documents will be sent in digital format only.</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-[18px] font-semibold text-slate-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" />Refund Policy</h5>
                    <ul className="space-y-3 pl-4 border-l-2 border-slate-200 ml-1">
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">No refund will be applicable after attempting any exam (Pre-Board or Final).</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">A 90% refund is applicable before attempting any exam.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">There is no 100% refund policy.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">A 10% deduction will apply to all refunds to cover the cost of digital study materials and content access.</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-[18px] font-semibold text-slate-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" />Pre-Examination Reward Policy</h5>
                    <ul className="space-y-3 pl-4 border-l-2 border-slate-200 ml-1">
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Candidates who secure 80% or above in the designated pre-examination will be eligible to receive a complimentary gift.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Eligible candidates will be provided with 5+ options for gift items worth upto 50k-100k. The final gift selection will be subject to availability and company discretion.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">By qualifying for the reward, candidates consent to the use and display of their photograph on the company’s official website and promotional platforms.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Gift items will be dispatched within 45 to 60 days from the date of result declaration.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">All gifts will be accompanied by the manufacturer’s warranty, where applicable.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Courier tracking details will be shared via registered email once the item has been dispatched.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">For delivery verification, a one-time password (OTP) required by the courier partner will be shared with the recipient by the company.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">The company reserves the right to modify, substitute, or discontinue the reward offer at any time without prior notice, in accordance with applicable laws and operational requirements.</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-[18px] font-semibold text-slate-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" />General Terms</h5>
                    <ul className="space-y-3 pl-4 border-l-2 border-slate-200 ml-1">
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">All timelines mentioned are approximate and subject to variation depending on course type and customer engagement.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Study materials and videos are shared once and cannot be reissued.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">By enrolling, candidates agree to comply with the above terms and conditions.</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* 3. Privacy Policy */}
              <section className="space-y-6">
                <h4 className="text-[26px] font-bold text-slate-900 border-l-4 border-primary-500 pl-5">3. Privacy Policy</h4>
                <div className="bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100/80 space-y-8">
                  <div>
                    <h5 className="text-[18px] font-semibold text-slate-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" />Information We Collect</h5>
                    <p className="text-[15px] leading-[1.6] text-slate-600 mb-4 pl-6">We collect the following types of information to ensure smooth operation of our services:</p>
                    <ul className="space-y-3 pl-4 border-l-2 border-slate-200 ml-1">
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full"><strong className="text-slate-800">Personal Information:</strong> Your name, email address, contact number, and country of residence collected during registration or inquiries.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full"><strong className="text-slate-800">Payment Information:</strong> Transaction details (amount, date, and payment method). We do not store complete payment card or crypto wallet details.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full"><strong className="text-slate-800">Course and Usage Data:</strong> Information about the courses you enroll in, your progress, assessments, and interactions with our online learning platform.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full"><strong className="text-slate-800">Technical Information:</strong> Device type, IP address, browser version, and cookies to improve website performance and user experience.</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-[18px] font-semibold text-slate-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" />How We Use Your Information</h5>
                    <p className="text-[15px] leading-[1.6] text-slate-600 mb-4 pl-6">We use your information to:</p>
                    <ul className="space-y-3 pl-4 border-l-2 border-slate-200 ml-1">
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Process your course enrollment and payments.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Provide access to study materials, exams, and course completion certificates.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Communicate important updates, reminders, and support-related information.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Improve course quality, website functionality, and user experience.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Maintain compliance with our internal policies and applicable laws.</li>
                    </ul>
                    <p className="text-[15px] leading-[1.6] text-slate-600 mt-4 pl-6">We do not sell, trade, or rent your personal information to any third party.</p>
                  </div>

                  <div>
                    <h5 className="text-[18px] font-semibold text-slate-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" />Data Storage and Security & Payment & Financial Data</h5>
                    <ul className="space-y-3 pl-4 border-l-2 border-slate-200 ml-1">
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">All personal data is stored securely in encrypted databases.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Only authorized Princeton Professional personnel have access to user data.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">We regularly update our systems and employ security measures such as SSL encryption to protect against unauthorized access, alteration, or disclosure.</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-[18px] font-semibold text-slate-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" />Use of Cookies</h5>
                    <p className="text-[15px] leading-[1.6] text-slate-600 mb-4 pl-6">Our website uses cookies to:</p>
                    <ul className="space-y-3 pl-4 border-l-2 border-slate-200 ml-1">
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Enhance your browsing experience.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Save login preferences.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Analyze site traffic and improve user experience.</li>
                    </ul>
                    <p className="text-[15px] leading-[1.6] text-slate-600 mt-4 pl-6">You can choose to disable cookies from your browser settings; however, some website features may not function properly as a result.</p>
                  </div>

                  <div>
                    <h5 className="text-[18px] font-semibold text-slate-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" />Data Retention</h5>
                    <p className="text-[15px] leading-[1.6] text-slate-600 pl-6">We retain your personal information for as long as necessary to fulfill course delivery and legal obligations. Once no longer needed, your data will be securely deleted or anonymized.</p>
                  </div>

                  <div>
                    <h5 className="text-[18px] font-semibold text-slate-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" />Third-Party Links</h5>
                    <p className="text-[15px] leading-[1.6] text-slate-600 pl-6">Our website may contain links to third-party websites (e.g., payment gateways or educational partners). Princeton Professional is not responsible for the privacy practices or content of these external sites.</p>
                  </div>

                  <div>
                    <h5 className="text-[18px] font-semibold text-slate-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" />Your Rights</h5>
                    <p className="text-[15px] leading-[1.6] text-slate-600 mb-4 pl-6">You have the right to:</p>
                    <ul className="space-y-3 pl-4 border-l-2 border-slate-200 ml-1">
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Access the information we hold about you.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Request correction or deletion of inaccurate data.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Withdraw consent for marketing communications at any time.</li>
                    </ul>
                    <p className="text-[15px] leading-[1.6] text-slate-600 mt-4 pl-6">To exercise these rights, please contact our support team at support@princetonprofessional.com.</p>
                  </div>

                  <div>
                    <h5 className="text-[18px] font-semibold text-slate-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" />Policy Updates</h5>
                    <p className="text-[15px] leading-[1.6] text-slate-600 pl-6">Princeton Professional and PayG, reserves the right to update or modify this Privacy Policy at any time without prior notice. The revised version will be posted on our website with an updated effective date.</p>
                  </div>
                </div>
              </section>

              {/* 4. Refund Policy */}
              <section className="space-y-6">
                <h4 className="text-[26px] font-bold text-slate-900 border-l-4 border-primary-500 pl-5">4. Refund Policy</h4>
                <div className="bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100/80 space-y-8">
                  <div>
                    <h5 className="text-[18px] font-semibold text-slate-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" />No Refund After Exam Attempt</h5>
                    <ul className="space-y-3 pl-4 border-l-2 border-slate-200 ml-1">
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Once a candidate has attempted any exam — whether it is the Pre-Board Exam or the Final Exam — no refund will be applicable under any circumstances.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">This policy ensures the integrity of our course access and examination system, as study materials and evaluations are already utilized at that stage.</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-[18px] font-semibold text-slate-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" />90% Refund Before Exam Attempt</h5>
                    <ul className="space-y-3 pl-4 border-l-2 border-slate-200 ml-1">
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">If a candidate wishes to cancel their enrollment before attempting the pre-exam, they are eligible for a 90% refund of the total course fee.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Refund will be only be provided if the customer raised the request within 24 hours of making the payment and they must not attend the exam otherwise no refund will be initiated to them.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">The refund request must be raised in writing via email to the official Princeton Professional support team.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Refund processing time is 5-7 working days once the refund request is approved it may take an additional 7 working days to get credited into the customer's bank account from which payment was made.</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-[18px] font-semibold text-slate-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" />No 100% Refund Policy</h5>
                    <ul className="space-y-3 pl-4 border-l-2 border-slate-200 ml-1">
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Please note that Princeton Professional does not offer a 100% refund under any condition.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">This is due to administrative, processing, and content access costs incurred upon enrollment.</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-[18px] font-semibold text-slate-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" />Refund Request Procedure</h5>
                    <ul className="space-y-3 pl-4 border-l-2 border-slate-200 ml-1">
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">To request a refund, the candidate must email support@princetonprofessional.com with their full name, registered email ID, course name, payment receipt, and reason for cancellation.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Requests without complete details may face delays in processing.</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-[18px] font-semibold text-slate-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" />10% Deduction on All Refunds</h5>
                    <ul className="space-y-3 pl-4 border-l-2 border-slate-200 ml-1">
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">All approved refunds will include a 10% deduction to cover costs associated with digital content delivery, study materials, and platform usage.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">This deduction applies uniformly to all refund cases.</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-[18px] font-semibold text-slate-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" />Special Note</h5>
                    <p className="text-[15px] leading-[1.6] text-slate-600 mb-4 pl-6">Refunds are not applicable in the following cases:</p>
                    <ul className="space-y-3 pl-4 border-l-2 border-slate-200 ml-1">
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full"><strong className="text-slate-800">Partial Course Completion:</strong> If a candidate has completed only a portion of the course, no refund will be issued for the remaining content.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full"><strong className="text-slate-800">Delayed Course Progress:</strong> Refunds will not be provided due to delays in completing the course at the candidate’s own pace.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full"><strong className="text-slate-800">Accessed Content:</strong> Once study materials, training videos, or pre-board assessments have been accessed, refunds will not be applicable.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full"><strong className="text-slate-800">Dissatisfaction with Course Content:</strong> Refunds cannot be claimed solely based on personal preferences, expectations, or dissatisfaction with the course material.</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-[18px] font-semibold text-slate-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" />Agreement to Policies</h5>
                    <ul className="space-y-3 pl-4 border-l-2 border-slate-200 ml-1">
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">By enrolling in any course offered by Princeton Professional Education, candidates acknowledge and agree to comply with all policies, terms of service, and refund rules.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Enrolling confirms that the candidate has read, understood, and accepted the terms outlined in the policies, including payment, course access, exam schedules, and refund rules.</li>
                      <li className="text-[15px] leading-[1.6] text-slate-600 pl-4 relative before:absolute before:left-[-21px] before:top-2 before:w-2 before:h-2 before:bg-white before:border-2 before:border-primary-400 before:rounded-full">Candidates are responsible for reviewing these policies prior to enrollment, as continued use of the course materials implies acceptance of all terms.</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-[18px] font-semibold text-slate-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" />Independent Organization</h5>
                    <p className="text-[15px] leading-[1.6] text-slate-600 pl-6">Princeton Professional is an independent training and service provider. We are not affiliated, associated, authorized, endorsed by, or in any way officially connected with any other institute, organization, or governing body. All rights related to our services, content, and training materials are solely reserved by Princeton Professional.</p>
                  </div>

                  <div>
                    <h5 className="text-[18px] font-semibold text-slate-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" />No Guarantee of Employment or Monetary Benefit</h5>
                    <p className="text-[15px] leading-[1.6] text-slate-600 pl-6">Our programs are designed for skill development and professional enhancement only. We do not guarantee any monetary benefit, job placement, promotion, or financial gain as a result of completing our training or certification programs.</p>
                  </div>

                  <div>
                    <h5 className="text-[18px] font-semibold text-slate-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" />Third-Party Recommendations</h5>
                    <p className="text-[15px] leading-[1.6] text-slate-600 pl-6">Princeton Professional shall not be held responsible for any financial, personal, or professional loss incurred by customers who enroll in our services based on third-party recommendations, promotions, or representations. Any such engagement is strictly at the discretion and responsibility of the individual.</p>
                  </div>
                </div>
              </section>

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
