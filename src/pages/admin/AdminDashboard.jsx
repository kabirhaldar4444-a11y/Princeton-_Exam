import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  BookOpen, 
  Plus, 
  Search, 
  LogOut, 
  LayoutDashboard,
  Bell,
  Settings,
  MoreVertical,
  Activity,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertProvider';
import PMISLogo from '../../components/common/PMISLogo';

// Import sub-components
import UsersManagement from './Users';
import ExamsManagement from './ManageQuestions';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { showAlert, confirm } = useAlert();
  const [activeTab, setActiveTab] = useState('exams');
  const [stats, setStats] = useState({ users: 0, exams: 0, admins: 0 });
  const [loading, setLoading] = useState(true);
  const [isSubView, setIsSubView] = useState(false);

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  const fetchGlobalStats = async () => {
    try {
      const [uCount, eCount, aCount] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'candidate'),
        supabase.from('exams').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
      ]);
      setStats({ users: uCount.count || 0, exams: eCount.count || 0, admins: aCount.count || 0 });
    } catch (error) {
      console.error('Stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    confirm({
      title: 'Confirm Logout',
      message: 'Are you sure you want to sign out of the administrator portal?',
      confirmText: 'Sign Out',
      type: 'danger',
      onConfirm: () => {
        logout();
        showAlert('Logged out successfully', 'success');
      }
    });
  };

  return (
    <div className="pb-10 bg-slate-50/30">


      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl z-50">
        <div className="glass-navbar rounded-full px-8 py-3 flex items-center justify-between shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center">
            <PMISLogo variant="navbar" />
          </div>
          <div className="flex items-center gap-1 sm:gap-4">
            <button onClick={() => setActiveTab('students')} className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'students' ? 'bg-primary-500/10 text-primary-500' : 'text-slate-500 hover:bg-slate-100'}`}>Users</button>
            <button onClick={() => setActiveTab('exams')} className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'exams' ? 'bg-primary-500/10 text-primary-500' : 'text-slate-500 hover:bg-slate-100'}`}>Exams</button>
            <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>
            <button onClick={handleLogout} className="bg-primary-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg shadow-primary-500/30 hover:scale-[1.03] transition-all">Logout</button>
          </div>
        </div>
      </nav>

      <main className={`px-6 max-w-7xl mx-auto page-transition ${isSubView ? 'pt-20' : 'pt-32'}`}>



        {!isSubView && (
          <>
            <header className="mb-4">


              <h1 className="text-4xl font-outfit font-black text-slate-900 mb-2">Admin Dashboard</h1>
              <p className="text-slate-500 font-medium">Manage exams and candidate accounts from here.</p>
            </header>
            <div className="flex justify-center mb-6">


              <div className="bg-white/60 backdrop-blur-xl p-1.5 flex gap-1 rounded-2xl shadow-sm border border-slate-100/50">
                <TabButton active={activeTab === 'exams'} onClick={() => setActiveTab('exams')} icon={BookOpen} label="Exam Management" />
                <TabButton active={activeTab === 'students'} onClick={() => setActiveTab('students')} icon={Users} label="User & Access Management" />
              </div>
            </div>
          </>
        )}

        <div className="w-full">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full">
              {activeTab === 'exams' && <ExamsManagement onSubViewChange={setIsSubView} />}
              {activeTab === 'students' && <UsersManagement />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${active ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-black/5'}`}>
    <Icon className={`w-4 h-4 ${active ? 'text-primary-500' : ''}`} />
    {label}
  </button>
);

export default AdminDashboard;
