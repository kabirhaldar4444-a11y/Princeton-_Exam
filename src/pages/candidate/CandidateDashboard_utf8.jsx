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
  ShieldAlert
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
    <div className="flex items-center justify-center bg-white">
      <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
    </div>
  );

  return (
    <div className="pb-10 page-transition bg-slate-50/30">


      <DisclaimerOverlay user={user} profile={profile} />

      {/* Premium Navbar */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl z-50">
        <div className="glass-navbar rounded-full px-8 py-3 flex items-center justify-between shadow-2xl">
          <div className="flex items-center">
            <PMISLogo variant="navbar" />
          </div>

          <div className="flex items-center gap-1 sm:gap-4">
            <button className="bg-primary-500/10 text-primary-500 px-4 py-2 rounded-full text-sm font-bold">My Exams</button>
            <button onClick={() => navigate('/complete-profile')} className="text-slate-500 hover:bg-slate-100 px-4 py-2 rounded-full text-sm font-bold transition-all">Profile</button>
            <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>
            <button onClick={handleLogout} className="bg-primary-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg shadow-primary-500/30 hover:scale-[1.03] transition-all">Logout</button>
          </div>
        </div>
      </nav>

      <main className="pt-32 px-6 max-w-5xl mx-auto space-y-8">



        <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-5xl font-outfit font-black text-slate-900">My Assessments</h1>
            <p className="text-slate-500 font-medium text-lg">Welcome back, <span className="text-primary-500 font-bold">{profile?.full_name?.split(' ')[0] || 'Candidate'}</span></p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search exams..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-sm font-medium shadow-sm focus:ring-2 focus:ring-primary-500/20" />
          </div>
        </header>

        <section className="space-y-6">

          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center text-green-600"><BookOpen className="w-5 h-5" /></div>
             <h2 className="text-xl font-outfit font-black text-slate-900">Allotted Examinations</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {allottedExams.length > 0 ? allottedExams.map(exam => (
               <motion.div key={exam.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card-saas p-8 group hover:shadow-2xl transition-all cursor-pointer border border-transparent hover:border-primary-500/20" onClick={() => navigate(`/exam/${exam.id}`)}>
                 <div className="flex justify-between items-start mb-6">
                   <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-all"><BookOpen className="w-6 h-6" /></div>
                   <div className="flex flex-col items-end">
                     <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{exam.duration} Min Session</span>
                     <span className="text-emerald-500 font-black text-xs uppercase tracking-tighter mt-1">Status: Active</span>
                   </div>
                 </div>
                 <h3 className="text-2xl font-outfit font-bold text-slate-900 mb-2 group-hover:text-primary-600 transition-colors uppercase">{exam.title}</h3>
                 <p className="text-sm text-slate-500 leading-relaxed mb-8">{exam.description || 'Proctored certification examination. Please ensure stable internet.'}</p>
                 <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 group-hover:bg-primary-500 transition-all shadow-xl shadow-slate-900/10 group-hover:shadow-primary-500/30">Begin Assessment <ArrowRight className="w-5 h-5" /></button>
               </motion.div>
            )) : (
              <div className="col-span-full py-20 bg-white/50 border-2 border-dashed border-slate-200 rounded-[3rem] text-center">
                 <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No active exams allotted to your account</p>
              </div>
            )}
          </div>
        </section>

        {archivedSubmissions.length > 0 && (
          <section className="space-y-5 pt-6">

            <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white"><History className="w-5 h-5" /></div>
               <h2 className="text-xl font-outfit font-black text-slate-900 uppercase">Assessment History</h2>
            </div>
            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
               <table className="w-full text-left">
                 <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Examination</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Date Completed</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {archivedSubmissions.map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-50/50">
                        <td className="px-8 py-6 font-bold text-slate-900">{sub.exam?.title || 'Unknown Exam'}</td>
                        <td className="px-8 py-6 text-sm text-slate-500">{new Date(sub.submitted_at).toLocaleDateString()}</td>
                        <td className="px-8 py-6">
                           <span className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest"><CheckCircle className="w-3 h-3" /> Submitted</span>
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
