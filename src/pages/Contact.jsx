import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, User, MessageSquare, Send, CheckCircle, Loader2, ArrowLeft, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PMISLogo from '../components/common/PMISLogo';

const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY;

const Contact = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!WEB3FORMS_KEY) {
      setError('Web3Forms API key is not configured. Please add VITE_WEB3FORMS_KEY to your .env file.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          name: form.name,
          email: form.email,
          subject: `[Princeton Exam Portal] ${form.subject}`,
          message: form.message,
          from_name: 'Princeton Exam Portal',
        }),
      });

      const data = await response.json();
      console.log('Contact form response:', data);
      if (data.success) {
        setSuccess(true);
        setForm({ name: '', email: '', subject: '', message: '' });
      } else {
        setError(data.message || 'Failed to send. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden font-outfit py-10 px-4">

      {/* Ambient background bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="bubble w-40 h-40 top-[10%] left-[5%]" style={{ animation: 'bubble-drift-right 50s infinite linear' }}>
          <div className="bubble-glow bg-blue-400/10" />
        </div>
        <div className="bubble w-36 h-36 bottom-[15%] right-[6%]" style={{ animation: 'bubble-drift-left 45s infinite linear' }}>
          <div className="bubble-glow bg-indigo-400/10" />
        </div>
        <div className="bubble w-52 h-52 top-[45%] right-[8%]" style={{ animation: 'bubble-drift-left 55s infinite linear', animationDelay: '-12s' }}>
          <div className="bubble-glow bg-emerald-400/10" />
        </div>
        <div className="bubble w-32 h-32 bottom-[8%] left-[18%]" style={{ animation: 'bubble-drift-right 48s infinite linear', animationDelay: '-5s' }}>
          <div className="bubble-glow bg-amber-400/10" />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-lg">

        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-slate-400 hover:text-slate-700 text-xs font-bold uppercase tracking-widest transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </motion.button>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex justify-center"
        >
          <PMISLogo variant="login" />
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-100 p-8"
        >

          <AnimatePresence mode="wait">
            {success ? (
              /* ── Success State ── */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center text-center py-8 gap-5"
              >
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-200">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 mb-2">Message Sent!</h2>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Your message has been delivered. We'll get back to you as soon as possible.
                  </p>
                </div>
                <button
                  onClick={() => setSuccess(false)}
                  className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-700 transition-colors"
                >
                  Send Another
                </button>
              </motion.div>
            ) : (
              /* ── Form State ── */
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="mb-7">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Support</p>
                  <h1 className="text-2xl font-black text-slate-900">Contact Us</h1>
                  <p className="text-slate-400 text-sm mt-1">We typically respond within 24 hours.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* Name */}
                  <div className="space-y-0">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 block mb-1 leading-none">
                      Full Name
                    </label>
                    <div className="relative group">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        name="name"
                        required
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        className="w-full pl-7 pr-4 py-2 bg-transparent border-b border-slate-200 text-slate-800 text-sm placeholder:text-slate-300 focus:outline-none focus:border-primary-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-0">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 block mb-1 leading-none">
                      Email Address
                    </label>
                    <div className="relative group">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        placeholder="name@company.com"
                        className="w-full pl-7 pr-4 py-2 bg-transparent border-b border-slate-200 text-slate-800 text-sm placeholder:text-slate-300 focus:outline-none focus:border-primary-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-0">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 block mb-1 leading-none">
                      Subject
                    </label>
                    <div className="relative group">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        name="subject"
                        required
                        value={form.subject}
                        onChange={handleChange}
                        placeholder="How can we help?"
                        className="w-full pl-7 pr-4 py-2 bg-transparent border-b border-slate-200 text-slate-800 text-sm placeholder:text-slate-300 focus:outline-none focus:border-primary-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-0">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 block mb-1 leading-none">
                      Message
                    </label>
                    <textarea
                      name="message"
                      required
                      rows={4}
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Describe your issue or question in detail..."
                      className="w-full px-0 py-2 bg-transparent border-b border-slate-200 text-slate-800 text-sm placeholder:text-slate-300 focus:outline-none focus:border-primary-500 transition-all font-medium resize-none"
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-xs font-semibold bg-red-50 border border-red-100 rounded-lg px-3 py-2"
                    >
                      {error}
                    </motion.p>
                  )}

                  {/* Submit */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 group overflow-hidden relative text-xs uppercase tracking-[0.2em]"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        {loading
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                          : <><Send className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" /> Send Message</>
                        }
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] transition-transform" />
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <footer className="mt-8 flex flex-col items-center">
          <p className="text-slate-300 text-[9px] font-black uppercase tracking-[0.6em] opacity-30">
            Princeton Ecosystem
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Contact;
