import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ArrowLeft,
  ShieldCheck,
  Building
} from 'lucide-react';
import PMISLogo from '../../components/common/PMISLogo';

const Profile = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Extract address parts if possible
  const addressParts = profile?.address?.split(', ') || [];
  const city = profile?.city || addressParts[addressParts.length - 2] || 'Not Set';
  const state = profile?.state || addressParts[addressParts.length - 1] || 'Not Set';

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Navigation */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-black uppercase tracking-widest text-[10px] bg-white shadow-xl px-6 py-3 rounded-full border border-slate-100 mb-10 transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Exams
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden"
        >
          {/* Header Section */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10 text-center md:text-left">
              <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl relative">
                {profile?.profile_photo_url ? (
                  <img src={profile.profile_photo_url} className="w-full h-full object-cover rounded-3xl" alt="Profile" />
                ) : (
                  <User className="w-10 h-10 text-white" />
                )}
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-slate-900 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-4xl font-outfit font-black tracking-tight">{profile?.full_name}</h1>
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Verified Candidate</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Minimal Info Grid as per User Request */}
          <div className="p-12 space-y-10">
            <div className="grid md:grid-cols-2 gap-10">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Email Address</label>
                 <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center gap-4 group hover:bg-white hover:border-blue-100 transition-all">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                      <Mail className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-700">{profile?.email || 'Not Provided'}</span>
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Contact Number</label>
                 <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center gap-4 group hover:bg-white hover:border-blue-100 transition-all">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                      <Phone className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-700">+91 {profile?.phone || 'Not Provided'}</span>
                 </div>
              </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Registered Address & Location</label>
               <div className="bg-slate-50 border border-slate-100 p-5 rounded-3xl flex items-start gap-4 group hover:bg-white hover:border-blue-100 transition-all">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="space-y-4">
                    <p className="font-bold text-slate-700 leading-relaxed text-lg">{profile?.address || 'Complete address not found'}</p>
                    <div className="flex gap-10 pt-4 border-t border-slate-200/50">
                      <div>
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">City</span>
                        <div className="flex items-center gap-2">
                          <Building className="w-3.5 h-3.5 text-blue-500" />
                          <span className="font-black text-slate-800 text-sm uppercase">{city}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">State</span>
                        <span className="font-black text-slate-800 text-sm uppercase">{state}</span>
                      </div>
                    </div>
                  </div>
               </div>
            </div>

            {/* Subtle Footer branding */}
            <div className="pt-10 flex items-center justify-center gap-4 opacity-30">
               <PMISLogo size={40} />
               <div className="w-px h-6 bg-slate-400" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em]">Official Candidate Record</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
