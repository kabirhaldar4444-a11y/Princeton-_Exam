import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Clock, 
  Search, 
  History, 
  CheckCircle, 
  ArrowRight,
  LogOut,
  User,
  Lock,
  Edit2,
  FileText,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { useAlert } from '../../context/AlertProvider';
import DisclaimerOverlay from '../../components/DisclaimerOverlay';
import PMISLogo from '../../components/common/PMISLogo';

const CandidateDashboard = () => {
  const { user, profile, logout } = useAuth();
  const { showAlert, confirm } = useAlert();
  const navigate = useNavigate();
  
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.id) fetchDashboardData();

    const profileChannel = supabase
      .channel(`profile_sync_${user?.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user?.id}` }, () => fetchDashboardData())
      .subscribe();

    const submissionChannel = supabase
      .channel(`submission_sync_${user?.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions', filter: `user_id=eq.${user?.id}` }, () => fetchDashboardData())
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(submissionChannel);
    };
  }, [user?.id]);

  const fetchDashboardData = async () => {
    try {
      const { data: profileData } = await supabase.from('profiles').select('allotted_exam_ids').eq('id', user.id).single();
      
      const [examsRes, submissionsRes] = await Promise.all([
        supabase.from('exams').select('*'),
        supabase.from('submissions').select('*').eq('user_id', user.id).order('submitted_at', { ascending: false })
      ]);
      
      setExams(examsRes.data || []);
      setSubmissions(submissionsRes.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    confirm({
      title: 'Confirm Logout',
      message: 'Are you sure you want to end your session?',
      confirmText: 'Sign Out',
      type: 'danger',
      onConfirm: async () => {
        await logout();
        showAlert('Logged out successfully', 'success');
        navigate('/login');
      }
    });
  };

  const allottedExams = exams.filter(e => {
    const allottedIds = Array.isArray(profile?.allotted_exam_ids) ? profile.allotted_exam_ids : [];
    const isAllotted = allottedIds.includes(e.id);
    const isNotSubmitted = !submissions.find(s => s.exam_id === e.id);
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase());
    return isAllotted && isNotSubmitted && matchesSearch;
  });

  const archivedSubmissions = submissions.map(sub => ({
    ...sub,
    exam: exams.find(e => e.id === sub.exam_id)
  }));

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Initialising Portal...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-20 bg-slate-50/50">
      <DisclaimerOverlay user={user} profile={profile} />

      {/* Premium Navbar Match to Screenshot */}
      <nav className="fixed top-8 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl z-[100]">
        <div className="bg-white/80 backdrop-blur-2xl rounded-full px-8 py-3.5 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white">
          <div className="flex items-center">
            <PMISLogo variant="navbar" />
          </div>

          <div className="flex items-center gap-2">
            <button className="bg-blue-600/10 text-blue-600 px-6 py-2 rounded-full text-xs font-black uppercase tracking-tight transition-all">My Exams</button>
            <button onClick={() => navigate('/profile')} className="text-slate-500 hover:bg-slate-50 px-6 py-2 rounded-full text-xs font-black uppercase transition-all">Profile</button>
            <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>
            <button onClick={handleLogout} className="bg-blue-600 text-white px-8 py-2.5 rounded-full text-sm font-black tracking-tight shadow-xl shadow-blue-600/20 hover:scale-[1.03] transition-all active:scale-95">Logout</button>
          </div>
        </div>
      </nav>

      <main className="pt-32 px-6 max-w-6xl mx-auto space-y-12">
        {/* Header Section Match to Screenshot */}
        <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 relative">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-outfit font-black text-[#1e293b] tracking-tight">My Assessments</h1>
            <p className="text-slate-500 font-medium text-base">
              Welcome back, <span className="text-blue-600 font-bold">{profile?.full_name?.split(' ')[0] || 'Candidate'}</span>
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
             <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md border border-slate-200 px-5 py-2.5 rounded-full shadow-sm">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-[11px] font-black text-emerald-600 uppercase tracking-tight">Verified Profile</span>
                </div>
             </div>
             
             <div className="relative w-full md:w-72">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  type="text" 
                  placeholder="Search exams by name..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  className="w-full bg-white border border-slate-200 rounded-full py-3 pl-12 pr-5 text-sm font-medium shadow-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-400 transition-all outline-none" 
                />
             </div>
          </div>
        </header>

        {/* Exams Section Match to Screenshot */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 ml-2">
             <div className="w-8 h-8 bg-blue-600/10 rounded-lg flex items-center justify-center text-blue-600"><BookOpen className="w-4 h-4" /></div>
             <h2 className="text-xl font-outfit font-black text-slate-900 tracking-tight">Available Exams</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allottedExams.length > 0 ? allottedExams.map(exam => (
               <motion.div 
                 key={exam.id} 
                 initial={{ opacity: 0, y: 20 }} 
                 animate={{ opacity: 1, y: 0 }} 
                 className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(59,130,246,0.1)] transition-all duration-500 border border-slate-100 group relative overflow-hidden flex flex-col justify-between"
               >
                 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
                 
                 <div>
                   <div className="flex justify-between items-start mb-6 relative z-10">
                     <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                        <Edit2 className="w-5 h-5" />
                     </div>
                   </div>
                   <h3 className="text-xl font-outfit font-black text-slate-900 mb-4 leading-tight tracking-tight group-hover:text-blue-600 transition-colors uppercase line-clamp-2 relative z-10">{exam.title}</h3>
                   
                   <div className="bg-slate-50/80 rounded-xl p-3 flex items-center gap-3 mb-6 border border-slate-100 group-hover:bg-blue-50 transition-colors relative z-10">
                      <Clock className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight group-hover:text-blue-700">{exam.duration} Min Duration</span>
                   </div>
                 </div>

                 <button 
                   onClick={() => navigate(`/exam/${exam.id}`)}
                   className="w-full py-3.5 bg-blue-600 text-white rounded-[14px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 active:scale-[0.98] relative z-10"
                 >
                   Start Exam <ArrowRight className="w-4 h-4" />
                 </button>
               </motion.div>
            )) : (
              <div className="col-span-full py-20 bg-white/40 border-2 border-dashed border-slate-200 rounded-[2rem] text-center shadow-inner">
                 <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md border border-slate-100">
                    <FileText className="w-8 h-8 text-slate-300" />
                 </div>
                 <h3 className="text-xl font-black text-slate-800 mb-2">No pending exams</h3>
                 <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Check back later or contact your instructor.</p>
              </div>
            )}
          </div>
        </section>

        {/* History Section Match to Screenshot */}
        {archivedSubmissions.length > 0 && (
          <section className="space-y-6 pt-10">
            <div className="flex items-center gap-3 ml-2">
               <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg"><History className="w-5 h-5" /></div>
               <h2 className="text-2xl font-outfit font-black text-slate-900 uppercase tracking-tight">Assessment History</h2>
            </div>
            
            <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm">
               <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-10 py-6 text-[11px] font-black uppercase text-slate-400 tracking-[0.15em]">Examination</th>
                      <th className="px-10 py-6 text-[11px] font-black uppercase text-slate-400 tracking-[0.15em]">Date Completed</th>
                      <th className="px-10 py-6 text-[11px] font-black uppercase text-slate-400 tracking-[0.15em]">Action Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {archivedSubmissions.map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="px-10 py-8">
                           <div className="font-black text-slate-800 text-lg uppercase group-hover:text-blue-600 transition-colors">{sub.exam?.title || 'Unknown Exam'}</div>
                           {sub.is_released && (
                             <div className="mt-1 flex items-center gap-2">
                               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                               <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Score Verified</span>
                             </div>
                           )}
                        </td>
                        <td className="px-10 py-8 text-sm font-bold text-slate-500">{new Date(sub.submitted_at).toLocaleDateString('en-GB')}</td>
                        <td className="px-10 py-8">
                           <div className="flex items-center gap-4">
                              {sub.is_released ? (
                                <div className="flex items-center gap-6">
                                  <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Final Result</span>
                                    <span className="text-2xl font-outfit font-black text-slate-900 leading-none">
                                      {sub.admin_score_override ?? sub.score} <span className="text-slate-300 font-normal">/</span> {sub.total_questions}
                                    </span>
                                  </div>
                                  <div className="bg-blue-50/50 text-blue-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100 flex items-center gap-1.5 shadow-sm">
                                    <CheckCircle className="w-3 h-3" /> Result Verified
                                  </div>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-2.5 bg-slate-50 text-slate-400 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100">
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Awaiting Review
                                </span>
                              )}
                           </div>
                        </td>
                      </tr>
                    ))}
                 </tbody>
               </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default CandidateDashboard;
