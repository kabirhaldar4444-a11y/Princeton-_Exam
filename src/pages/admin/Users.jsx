import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../utils/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Shield, Eye, Edit2, Trash2, Lock, Unlock, X, 
  Loader2, Mail, User, Key, CheckCircle, FileText, Download, UploadCloud, MapPin, Phone,
  RotateCw, ArrowLeft, Send, EyeOff
} from 'lucide-react';
import { useAlert } from '../../context/AlertProvider';
import { useAuth } from '../../context/AuthContext';

const Users = () => {
  const { showAlert } = useAlert();
  const { profile } = useAuth();
  
  // Super Admin Check
  const isSuperAdmin = profile?.role === 'super_admin' || profile?.email === 'admin@princeton.com' || profile?.email === 'kabirhaldar4444@gmail.com';
  const [activeTab, setActiveTab] = useState('candidates'); // 'candidates', 'admins'
  const [users, setUsers] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  
  const handleViewUser = async (u) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', u.id).single();
      setViewingUser(data || u);
    } catch(e) {
      setViewingUser(u);
    }
  };

  const handleEditUser = async (u) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', u.id).single();
      setEditingUser(data || u);
    } catch(e) {
      setEditingUser(u);
    }
  };

  // Global View Document overlay state
  const [globalViewingDoc, setGlobalViewingDoc] = useState(null);

  // Form State
  const [newUser, setNewUser] = useState({ email: '', password: '', fullName: '', allottedExamId: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
    // Safety check: If a normal admin somehow gets to 'admins' tab, force back to 'candidates'
    if (!isSuperAdmin && activeTab === 'admins') {
      setActiveTab('candidates');
    }
  }, [isSuperAdmin, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: profilesData }, { data: examsData }] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('exams').select('*').order('title')
      ]);
      setUsers(profilesData || []);
      setExams(examsData || []);
    } catch (error) {
      showAlert('Failed to fetch platform data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { data: newUserId, error } = await supabase.rpc('create_candidate', {
        p_email: newUser.email,
        p_password: newUser.password,
        p_full_name: newUser.fullName,
        p_exam_id: newUser.allottedExamId || null
      });

      if (error) {
        if (error.code === 'P0001' || error.message.includes('does not exist')) {
           throw new Error('Database Function Missing.');
        }
        throw error;
      };

      if (activeTab === 'admins') {
        const { error: roleError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', newUserId);
        
        if (roleError) throw roleError;
      }

      await fetchData(); 
      showAlert(`${activeTab === 'admins' ? 'Admin' : 'Candidate'} account created successfully!`, 'success');
      setIsCreateModalOpen(false);
      setNewUser({ email: '', password: '', fullName: '', allottedExamId: '' });
      setCreating(false);
    } catch (error) {
       showAlert(error.message, 'error');
       setCreating(false);
    }
  };

  const handleUpdateProfile = async (updatedData) => {
    try {
      const { password, ...profileFields } = updatedData;
      
      // ROBUST CLEANUP: Explicitly only send columns that exist in the profiles table
      const allowedProfileColumns = [
        'full_name', 'phone', 'address', 'state', 'city', 
        'role', 'profile_completed', 'disclaimer_accepted', 
        'allotted_exam_ids', 'is_exam_locked', 'can_register',
        'profile_photo_url', 'live_photo_url', 'aadhaar_front_url', 
        'aadhaar_back_url', 'pan_card_url', 'signature_url'
      ];
      
      const cleanProfileData = {};
      allowedProfileColumns.forEach(col => {
        if (profileFields[col] !== undefined) {
          cleanProfileData[col] = profileFields[col];
        }
      });

      // Ensure allotted_exam_ids is a valid array (Supabase UUID[] requirements)
      if (cleanProfileData.allotted_exam_ids && !Array.isArray(cleanProfileData.allotted_exam_ids)) {
        cleanProfileData.allotted_exam_ids = [];
      }

      const { data, error, status } = await supabase
        .from('profiles')
        .update(cleanProfileData)
        .eq('id', editingUser.id)
        .select();

      if (error) throw error;
      
      // Handle Submission Overrides if any
      if (updatedData.submissionChanges && Object.keys(updatedData.submissionChanges).length > 0) {
        const changes = updatedData.submissionChanges;
        for (const subId in changes) {
          // Only send specific allowed columns for submissions
          const subUpdate = {};
          if (changes[subId].admin_score_override !== undefined) subUpdate.admin_score_override = changes[subId].admin_score_override;
          if (changes[subId].is_released !== undefined) subUpdate.is_released = changes[subId].is_released;

          const { error: subError } = await supabase
            .from('submissions')
            .update(subUpdate)
            .eq('id', subId);
          
          if (subError) {
            console.error('Submission update error:', subError);
            throw new Error(`Failed to update results: ${subError.message}. You may need to update your database security policies.`);
          }
        }
      }

      if (status === 200 && (!data || data.length === 0)) {
        throw new Error('Update failed: You may not have permission to modify this profile.');
      }

      showAlert('Profile updated successfully', 'success');
      setEditingUser(null);
      fetchData();
    } catch (error) {
      showAlert(error.message, 'error');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    // Authorization Check to be doubly sure
    if (userToDelete.role === 'admin' && !isSuperAdmin) {
       showAlert('Access Denied: Only Super Admins can delete administrative accounts.', 'error');
       setUserToDelete(null);
       return;
    }

    try {
      // Call RPC function to cleanly delete both profile and auth records
      const { error } = await supabase.rpc('delete_user', { p_user_id: userToDelete.id });
      
      if (error) throw error;
      
      // Remove from UI state to instantly reflect success
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      showAlert('User account deleted successfully.', 'success');
    } catch (e) {
      showAlert(`Error processing deletion: ${e.message || e}`, 'error');
    } finally {
      setUserToDelete(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const searchLower = (searchTerm || '').toLowerCase();
    const matchesSearch = (u.full_name || '').toLowerCase().includes(searchLower) || 
                          (u.email || '').toLowerCase().includes(searchLower);
    const matchesTab = activeTab === 'candidates' ? u.role === 'candidate' : u.role === 'admin';
    return matchesSearch && matchesTab;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.role === 'candidate').length,
    admins: users.filter(u => u.role === 'admin').length
  };

  return (
    <div className="space-y-10 animate-fade-in relative">
      {/* Header & Search */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-outfit font-black text-slate-900 mb-2">Platform Management</h2>
          <p className="text-slate-500 font-medium">Manage administrative staff and student access</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="relative hidden md:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              placeholder="Search by name or email..." 
              className="input-premium lg:w-72 !py-3 !pl-12 !bg-white/60 backdrop-blur-md"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          {/* Only show "New Admin" button in header if Super Admin */}
          {(!(activeTab === 'admins' && !isSuperAdmin)) && (
            <button 
              onClick={() => {
                if (activeTab === 'admins' && !isSuperAdmin) {
                  showAlert('Only Super Admins can create new admin accounts.', 'error');
                  return;
                }
                setIsCreateModalOpen(true);
              }}
              className="btn-premium !py-3 !px-6 h-[48px] shadow-lg shadow-primary-500/20"
            >
              <Plus className="w-5 h-5" /> New {activeTab === 'candidates' ? 'Candidate' : 'Admin'}
            </button>
          )}
        </div>
      </header>

      {/* Super Admin Dashboard Notice */}
      {!isSuperAdmin && activeTab === 'admins' && (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl flex items-center gap-4 animate-fade-in shadow-sm">
           <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
             <Shield className="w-6 h-6" />
           </div>
           <div>
             <h4 className="font-black text-amber-900 text-sm">Restricted Control</h4>
             <p className="text-amber-700/80 text-[11px] font-bold uppercase tracking-wider mt-0.5">Contact the Super Admin (admin@princeton.com) for administrative account creation.</p>
           </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-slate-100/50 p-1 rounded-full w-max backdrop-blur-md border border-white/40 shadow-inner">
        <button 
          onClick={() => setActiveTab('candidates')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${activeTab === 'candidates' ? 'bg-white text-primary-600 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <User className="w-4 h-4" /> Candidates
        </button>
        {isSuperAdmin && (
          <button 
            onClick={() => setActiveTab('admins')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${activeTab === 'admins' ? 'bg-secondary-50 text-secondary-600 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.2)] ring-1 ring-secondary-200/50' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Shield className="w-4 h-4" /> Admin Roles
          </button>
        )}
      </div>

      {activeTab === 'candidates' ? (
        <>
          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6">
            <StatBox label="TOTAL USERS" value={stats.total} />
            <StatBox label="ACTIVE ACCESS" value={stats.active} />
            <StatBox label="STAFF ADMINS" value={stats.admins} />
          </div>

          {/* Candidates Grid */}
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredUsers.map((u) => (
                <CandidateCard 
                  key={u.id} 
                  user={u} 
                  canView={true}
                  canManage={true}
                  onView={() => handleViewUser(u)}
                  onEdit={() => handleEditUser(u)}
                  onDelete={() => setUserToDelete(u)}
                />
              ))}
            </AnimatePresence>
          </div>
        </>
      ) : (
        <AdminAccessControl 
          users={users} 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
          onAddAdmin={() => setIsCreateModalOpen(true)}
          onView={(u) => handleViewUser(u)}
          onEdit={(u) => handleEditUser(u)}
          onDelete={(u) => setUserToDelete(u)}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {/* Modals & Drawers */}
      <CreateUserModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        newUser={newUser} 
        setNewUser={setNewUser} 
        handleCreateUser={handleCreateUser} 
        creating={creating} 
        exams={exams} 
        isAdmin={activeTab === 'admins'}
      />

      <EditCandidateModal 
        user={editingUser} 
        exams={exams} 
        onClose={() => setEditingUser(null)} 
        onSave={handleUpdateProfile} 
        isSuperAdmin={isSuperAdmin}
      />

      <ViewCandidateDrawer 
        user={viewingUser} 
        onClose={() => setViewingUser(null)} 
        onViewDoc={setGlobalViewingDoc}
        isSuperAdmin={isSuperAdmin}
      />

      <DeleteConfirmModal 
        user={userToDelete} 
        onClose={() => setUserToDelete(null)} 
        onConfirm={handleDeleteUser} 
      />

      <DocumentViewerOverlay 
         doc={globalViewingDoc} 
         onClose={() => setGlobalViewingDoc(null)} 
      />
    </div>
  );
};

// ----------------------------------------------------
// SUB COMPONENTS
// ----------------------------------------------------

const StatBox = ({ label, value }) => (
  <div className="bg-white/60 backdrop-blur-xl border border-white/40 p-8 rounded-[2rem] flex flex-col justify-between h-36 shadow-sm hover:shadow-md transition-shadow">
    <span className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</span>
    <span className="text-5xl font-outfit font-black text-slate-800 leading-none">{value}</span>
  </div>
);

const CandidateCard = ({ user, onView, onEdit, onDelete, canManage, canView }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="bg-white/60 backdrop-blur-xl border border-white/60 p-6 rounded-3xl flex flex-col gap-5 hover:shadow-bloom transition-all ring-1 ring-slate-100 group"
  >
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center text-white text-xl font-bold shadow-lg">
        {user.profile_photo_url ? <img src={user.profile_photo_url} className="w-full h-full object-cover" /> : user.full_name?.charAt(0) || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-outfit font-bold text-lg text-slate-800 truncate">{user.full_name || 'Incomplete Profile'}</h4>
        <p className="text-sm text-slate-500 truncate">{user.email}</p>
      </div>
    </div>

    <div className="flex flex-wrap gap-2">
      <div className="px-4 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100/50">
        {user.allotted_exam_ids?.length || 0} ASSIGNMENTS
      </div>
      {user.is_exam_locked && (
        <div className="px-4 py-1.5 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-rose-100/50">
          LOCKED
        </div>
      )}
    </div>

    <div className="flex items-center justify-between pt-4 border-t border-slate-100 border-dashed mt-1 relative z-10">
      <div className="flex gap-2">
        {canView && (
          <button onClick={onView} className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-slate-100 hover:border-blue-100 group/icon" title="View Details">
            <Eye className="w-4 h-4 group-hover/icon:scale-110 transition-transform" />
          </button>
        )}
        {canManage && (
          <>
            <button onClick={onEdit} className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all border border-slate-100 hover:border-emerald-100 group/icon" title="Edit User">
              <Edit2 className="w-4 h-4 group-hover/icon:scale-110 transition-transform" />
            </button>
            <button onClick={onDelete} className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all border border-slate-100 hover:border-rose-100 group/icon" title="Delete User">
              <Trash2 className="w-4 h-4 group-hover/icon:scale-110 transition-transform" />
            </button>
          </>
        )}
      </div>
      {canManage && (
        <button className={`p-2 rounded-xl border transition-all ${user.is_exam_locked ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-slate-50 text-slate-300 border-slate-100 hover:bg-slate-100'}`} title={user.is_exam_locked ? "Account Locked" : "Account Active"}>
          {user.is_exam_locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
        </button>
      )}
    </div>
  </motion.div>
);

const AdminAccessControl = ({ users, searchTerm, setSearchTerm, onAddAdmin, onView, onEdit, onDelete, isSuperAdmin }) => {
  const staffAdmins = users.filter(u => u.role === 'admin');
  const candidates = users.filter(u => u.role === 'candidate');

  const filteredAdmins = staffAdmins.filter(u => {
    const searchLower = (searchTerm || '').toLowerCase();
    return (u.full_name || '').toLowerCase().includes(searchLower) || 
           (u.email || '').toLowerCase().includes(searchLower);
  });

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="bg-white/60 backdrop-blur-xl border border-white/60 p-8 rounded-[2rem] flex flex-col md:flex-row items-center gap-8 ring-1 ring-slate-100 shadow-sm relative overflow-hidden">
        {/* Soft decorative glow */}
        <div className="absolute -left-20 -top-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 border border-purple-100 relative z-10 shrink-0">
          <Shield className="w-8 h-8" />
        </div>
        <div className="flex-1 relative z-10">
          <h3 className="text-2xl font-black text-slate-900 mb-1">Admin Access Control</h3>
          <p className="text-slate-500 text-sm font-medium max-w-md">
            {isSuperAdmin 
              ? 'Manage administrative privileges and staff accounts. System-wide changes require confirmation.' 
              : 'View administrative staff roles. Privilege management is restricted to Super Admin.'}
          </p>
        </div>
        
        <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
          <div className="flex-1 md:flex-none px-6 py-4 bg-purple-50 rounded-2xl border border-purple-100 text-center ring-2 ring-purple-500/10 backdrop-blur-sm">
            <span className="block text-2xl font-black text-purple-600 leading-none">{staffAdmins.length}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-600/60 mt-1 block">Staff Admins</span>
          </div>
          <div className="flex-1 md:flex-none px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
            <span className="block text-2xl font-black text-slate-600 leading-none">{candidates.length}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 block">Candidates</span>
          </div>
        </div>
        
        {isSuperAdmin && (
          <button onClick={onAddAdmin} className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 px-6 rounded-2xl shadow-xl shadow-purple-500/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 relative z-10">
            <Plus className="w-5 h-5" /> Add New Admin
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input 
          placeholder="Search admins by name or email..." 
          className="input-premium w-full !pl-14 !py-4" 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredAdmins.map(admin => (
          <div key={admin.id} className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-md transition-shadow group">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 border border-purple-200/50 flex items-center justify-center text-purple-600 font-bold overflow-hidden shadow-inner">
                {admin.profile_photo_url ? <img src={admin.profile_photo_url} className="w-full h-full object-cover" /> : admin.full_name?.charAt(0) || 'A'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                   <h4 className="font-bold text-slate-800 leading-tight">{admin.full_name}</h4>
                   {admin.email === 'admin@princeton.com' && (
                     <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-tighter rounded-md border border-amber-200 animate-pulse">
                        <Shield className="w-2.5 h-2.5" /> SUPER ADMIN
                     </div>
                   )}
                </div>
                <p className="text-sm text-slate-500">{admin.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
              <div className="px-4 py-1.5 bg-purple-50 text-purple-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-purple-100 flex items-center gap-1.5">
                <Shield className="w-3 h-3" /> ADMIN
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-slate-500 hidden sm:block">Admin Access</span>
                <button 
                  disabled={!isSuperAdmin}
                  className={`w-12 h-6 rounded-full relative p-0.5 shadow-inner transition-colors focus:outline-none ring-2 ring-transparent ${isSuperAdmin ? 'bg-purple-500 cursor-pointer focus:ring-purple-200' : 'bg-slate-300 cursor-not-allowed'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${isSuperAdmin ? 'right-0.5' : 'left-0.5'}`}></div>
                </button>
              </div>

              <div className="flex items-center gap-2 pl-4 border-l border-slate-100">
                <button onClick={() => onView(admin)} className="p-2 rounded-xl text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-all group/icon">
                  <Eye className="w-4 h-4 group-hover/icon:scale-110" />
                </button>
                {isSuperAdmin && (
                  <>
                    <button onClick={() => onEdit(admin)} className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all group/icon">
                      <Edit2 className="w-4 h-4 group-hover/icon:scale-110" />
                    </button>
                    <button onClick={() => onDelete(admin)} className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all group/icon">
                      <Trash2 className="w-4 h-4 group-hover/icon:scale-110" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


// ----------------------------------------------------
// MODALS & DRAWERS
// ----------------------------------------------------

const CreateUserModal = ({ isOpen, onClose, newUser, setNewUser, handleCreateUser, creating, exams, isAdmin }) => {
  const [showPassword, setShowPassword] = useState(false);

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewUser(prev => ({ ...prev, password }));
    setShowPassword(true);
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white max-w-[440px] w-full max-h-[90vh] rounded-[1.5rem] shadow-2xl relative z-10 flex flex-col overflow-hidden border border-white/20"
          >
            {/* Header Section Matches Screenshot */}
            <div className={`p-6 flex justify-between items-start shrink-0 ${isAdmin ? 'bg-gradient-to-r from-purple-500 to-indigo-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`}>
              <div className="flex gap-3 items-center">
                <div className="bg-white/20 p-2.5 rounded-[10px] backdrop-blur-md">
                  {isAdmin ? <Shield className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg leading-tight">Create {isAdmin ? 'Staff Admin' : 'Candidate'}</h3>
                  <p className="text-white/80 text-[11px] font-medium mt-0.5">{isAdmin ? 'New account will have full admin privileges' : 'Register a new candidate access login'}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors flex shrink-0 mt-1">
                <X className="w-4 h-4"/>
              </button>
            </div>

            <div className="bg-slate-50 flex-1 relative overflow-hidden flex flex-col min-h-0">
               {/* Body is now scrollable */}
               <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative z-10">
                  {/* Decorative faint background icon */}
                  <User className="absolute right-8 top-8 w-40 h-40 text-slate-200/50 -rotate-12 pointer-events-none" strokeWidth={-1} fill="currentColor" />

                  <div className="text-center mb-10 relative z-10">
                    <h3 className="text-[28px] font-black text-[#1a202c] mb-1 tracking-tight">Create {isAdmin ? 'Staff' : 'Candidate'} Access</h3>
                    <p className="text-slate-500 text-sm font-medium">Register a new {isAdmin ? 'administrative staff member' : 'student taking an examination'}.</p>
                  </div>

                  <form id="create-user-form" onSubmit={handleCreateUser} className="space-y-6 relative z-10">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-[#6b7280] ml-2">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-500" />
                          <input 
                            type="email" required placeholder="user@elitetoolistic.com" 
                            className="w-full pl-[50px] pr-4 py-3.5 bg-slate-100/80 border border-slate-200 text-slate-800 rounded-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all text-[15px] font-medium placeholder:font-normal placeholder:text-slate-400"
                            value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-[#6b7280] ml-2">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-500" />
                          <input 
                            type="text" required placeholder="e.g. John Doe" 
                            className="w-full pl-[50px] pr-4 py-3.5 bg-slate-100/80 border border-slate-200 text-slate-800 rounded-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all text-[15px] font-medium placeholder:font-normal placeholder:text-slate-400"
                            value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-[#6b7280] ml-2">Account Password</label>
                        <div className="relative">
                          <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-500" />
                          <input 
                            type="password" required placeholder="Generate a secure password..." 
                            {...(showPassword ? { type: "text" } : {})}
                            className="w-full pl-[50px] pr-[85px] py-3.5 bg-slate-100/80 border border-slate-200 text-slate-800 rounded-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all text-[15px] font-medium placeholder:font-normal placeholder:text-slate-400"
                            value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2.5 text-slate-500">
                              <button type="button" onClick={generatePassword} className="hover:text-indigo-600 transition-colors p-1"><RotateCw className="w-4 h-4" strokeWidth={2.5} /></button>
                               <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-indigo-600 transition-colors p-1">
                                {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={2.5} /> : <Eye className="w-4 h-4" strokeWidth={2.5} />}
                              </button>
                          </div>
                        </div>
                      </div>

                      {!isAdmin && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-wider text-[#6b7280] ml-2">Initial Allotted Exam (Optional)</label>
                          <div className="relative">
                            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-500" />
                            <select 
                              className="w-full pl-[50px] pr-4 py-3.5 bg-slate-100/80 border border-slate-200 text-slate-800 rounded-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all text-[15px] font-medium appearance-none cursor-pointer"
                              value={newUser.allottedExamId} 
                              onChange={e => setNewUser({...newUser, allottedExamId: e.target.value})}
                            >
                              <option value="">No exam initially assigned</option>
                              {exams.map(ex => (
                                <option key={ex.id} value={ex.id}>{ex.title}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                  </form>
               </div>

               {/* Footer is now fixed at bottom of modal */}
               <div className="px-8 py-6 bg-white border-t border-slate-100 shrink-0">
                  <button 
                    form="create-user-form"
                    disabled={creating} 
                    className={`w-full py-4 rounded-[14px] font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-2 ${isAdmin ? 'bg-indigo-500 shadow-indigo-500/30' : 'bg-blue-500 shadow-blue-500/30'}`}
                  >
                    {creating ? <Loader2 className="animate-spin w-5 h-5" /> : `Create ${isAdmin ? 'Staff' : 'Candidate'} Account`}
                  </button>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};


const EditCandidateModal = ({ user, exams, onClose, onSave, isSuperAdmin }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    allotted_exam_ids: [],
    password: ''
  });
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [submissionChanges, setSubmissionChanges] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showExamDropdown, setShowExamDropdown] = useState(false);
  const [examSearch, setExamSearch] = useState('');
  const examDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (examDropdownRef.current && !examDropdownRef.current.contains(event.target)) {
        setShowExamDropdown(false);
      }
    };
    if (showExamDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExamDropdown]);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        allotted_exam_ids: user.allotted_exam_ids || [],
        password: ''
      });
      setSubmissionChanges({});
      setShowPassword(false);
      fetchSubmissions();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [user]);

  const fetchSubmissions = async () => {
    setLoadingSubs(true);
    try {
      const { data } = await supabase
        .from('submissions')
        .select('*, exams(title, duration)')
        .eq('user_id', user.id);
      setSubmissions(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSubs(false);
    }
  };

  const updateSubChange = (subId, field, value) => {
    setSubmissionChanges(prev => ({
      ...prev,
      [subId]: {
        ...(prev[subId] || {}),
        [field]: value
      }
    }));
  };

  const getSubValue = (sub, field) => {
    return submissionChanges[sub.id]?.[field] ?? sub[field];
  };

  const handleAdjustMark = (sub, amount) => {
    const currentPrice = getSubValue(sub, 'admin_score_override') ?? sub.score;
    const nextValue = Math.max(0, Math.min(sub.total_questions, currentPrice + amount));
    updateSubChange(sub.id, 'admin_score_override', nextValue);
  };

  if (!user) return null;

  const toggleExam = (id) => {
    setFormData(prev => ({
      ...prev,
      allotted_exam_ids: prev.allotted_exam_ids.includes(id)
        ? prev.allotted_exam_ids.filter(eid => eid !== id)
        : [...prev.allotted_exam_ids, id]
    }));
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
    setShowPassword(true);
  };

  const handleSave = () => {
    onSave({
      ...formData,
      submissionChanges
    });
  };

  return createPortal(
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.98 }}
        className="fixed inset-0 z-[200] bg-slate-900/20 backdrop-blur-2xl overflow-y-auto custom-scrollbar flex flex-col items-center py-6 sm:py-10"
      >
        <div className="w-full max-w-5xl px-4 sm:px-6 flex flex-col">
          <div className="mb-6">
            <button onClick={onClose} className="inline-flex items-center gap-2 bg-white border border-slate-200 shadow-sm hover:shadow-md text-slate-600 hover:text-blue-600 font-bold px-6 py-3 rounded-full transition-all group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Candidates
            </button>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-6 sm:p-10 md:p-14 mb-20 relative overflow-hidden flex-1">
            {/* Subtle decorative glow */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

            <div className="mb-12 relative z-10 border-b border-slate-100 pb-10">
              <h2 className="text-4xl font-black text-slate-800 mb-3">Update User Profile</h2>
              <p className="text-slate-500 font-medium">Modify candidate details and examination permissions</p>
            </div>

            <div className="space-y-12 relative z-10">
              {/* Main Info */}
              <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100 space-y-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3 ml-2">Candidate Email</label>
                    <input className="input-premium w-full !bg-white opacity-70 cursor-not-allowed shadow-sm" value={user.email} disabled />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3 ml-2">Full Name</label>
                    <input 
                      className="input-premium w-full !bg-white shadow-sm" 
                      value={formData.full_name} 
                      onChange={e => setFormData({...formData, full_name: e.target.value})}
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3 ml-2">New Password <span className="normal-case opacity-60">(leave blank to keep current)</span></label>
                  <div className="relative">
                    <input 
                      className="input-premium w-full !bg-white shadow-sm" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Set a new password..." 
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-4 text-slate-400">
                       <button onClick={generatePassword} type="button" className="hover:text-blue-500 transition-colors p-1" title="Generate Random Password"><RotateCw className="w-5 h-5" /></button>
                       <div className="w-px h-5 bg-slate-200"></div>
                       <button onClick={() => setShowPassword(!showPassword)} type="button" className="hover:text-blue-500 transition-colors p-1" title="Toggle Visibility">
                          {showPassword ? <X className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                       </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Identity Verification */}
              <div className="mt-12">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100"><Shield className="w-5 h-5" /></div>
                  <h3 className="text-2xl font-black text-slate-800">Identity Verification</h3>
                </div>

                {isSuperAdmin ? (
                  <div className="grid md:grid-cols-3 gap-6">
                    <VerificationCard label="PROFILE PHOTO" url={user.live_photo_url || user.profile_photo_url} onView={() => setGlobalViewingDoc({ label: "PROFILE PHOTO", url: user.live_photo_url || user.profile_photo_url })} />
                    <VerificationCard label="AADHAAR FRONT" url={user.aadhaar_front_url} onView={() => setGlobalViewingDoc({ label: "AADHAAR FRONT", url: user.aadhaar_front_url })} />
                    <VerificationCard label="AADHAAR BACK" url={user.aadhaar_back_url} onView={() => setGlobalViewingDoc({ label: "AADHAAR BACK", url: user.aadhaar_back_url })} />
                    <VerificationCard label="PAN CARD" url={user.pan_card_url} onView={() => setGlobalViewingDoc({ label: "PAN CARD", url: user.pan_card_url })} />
                    <VerificationCard label="SIGNATURE" url={user.signature_url} onView={() => setGlobalViewingDoc({ label: "SIGNATURE", url: user.signature_url })} />
                  </div>
                ) : (
                  <div className="bg-slate-50/50 backdrop-blur-sm p-12 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center gap-5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-20 h-20 bg-white text-blue-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-500/10 border border-slate-100 relative z-10 transition-transform group-hover:scale-110">
                      <Lock className="w-10 h-10" />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-2xl font-black text-slate-800 mb-2">Privacy Shield Active</h3>
                    </div>
                  </div>
                )}
              </div>

              {/* Allotted Exams - Smart Search Dropdown */}
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100"><FileText className="w-5 h-5" /></div>
                  <h3 className="text-2xl font-black text-slate-800">Exam Allotment</h3>
                </div>
                
                <div className="relative max-w-2xl" ref={examDropdownRef}>
                  <div className={`bg-slate-50/80 border rounded-[1.5rem] p-4 min-h-[70px] transition-all relative z-[110] ${showExamDropdown ? 'ring-2 ring-blue-500/20 border-blue-400 bg-white shadow-md' : 'border-slate-200'}`}>
                    <div className="flex flex-wrap gap-2 mb-2">
                       {formData.allotted_exam_ids.map(id => {
                          const ex = exams.find(e => e.id === id);
                          if (!ex) return null;
                          return (
                            <motion.div 
                              layout
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              key={id} 
                              className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-full text-xs font-black shadow-lg shadow-blue-600/20 group/tag"
                            >
                               {ex.title}
                               <button 
                                 onClick={(e) => { e.stopPropagation(); toggleExam(id); }}
                                 className="hover:bg-white/20 p-0.5 rounded-full transition-colors"
                               >
                                 <X className="w-3 h-3" />
                               </button>
                            </motion.div>
                          );
                       })}
                    </div>
                    
                    <div className="relative">
                       <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                       <input 
                         type="text"
                         autoComplete="off"
                         placeholder={formData.allotted_exam_ids.length > 0 ? "Add more exams..." : "Search and select examinations..."}
                         className="w-full pl-10 pr-4 py-2 bg-transparent text-slate-800 font-bold focus:outline-none placeholder:text-slate-400"
                         value={examSearch}
                         onChange={(e) => {
                            setExamSearch(e.target.value);
                            setShowExamDropdown(true);
                         }}
                         onFocus={() => setShowExamDropdown(true)}
                       />
                    </div>
                  </div>

                  {/* Dropdown Menu - Animated & Aesthetic */}
                  <AnimatePresence>
                    {showExamDropdown && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-100 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden z-[120] max-h-64 overflow-y-auto custom-scrollbar border-t-4 border-t-blue-500 origin-top"
                      >
                        <div className="p-3 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 flex justify-between items-center">
                           Available Question Papers
                        </div>
                        {exams.filter(e => !formData.allotted_exam_ids.includes(e.id) && e.title.toLowerCase().includes(examSearch.toLowerCase())).length === 0 ? (
                           <div className="p-10 text-center text-slate-400 text-sm font-bold italic">
                             {examSearch ? 'No matches found.' : 'All exams already allotted.'}
                           </div>
                        ) : (
                          exams.filter(e => !formData.allotted_exam_ids.includes(e.id) && e.title.toLowerCase().includes(examSearch.toLowerCase())).map(exam => (
                            <div 
                              key={exam.id}
                              onClick={() => {
                                toggleExam(exam.id);
                                setExamSearch('');
                              }}
                              className="flex items-center justify-between p-4 hover:bg-blue-50 cursor-pointer transition-all border-b border-slate-50 last:border-0 group/item"
                            >
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/item:bg-white group-hover/item:text-blue-500 transition-all border border-slate-100">
                                    <FileText className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-slate-800 text-[15px]">{exam.title}</h4>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{exam.duration} Minutes • {exam.total_marks || '50'} Marks</p>
                                  </div>
                               </div>
                               <Plus className="w-5 h-5 text-slate-200 group-hover/item:text-blue-500 transition-colors" />
                            </div>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="mt-6 flex items-center gap-4">
                  <button 
                    onClick={handleSave}
                    className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-900/20 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                  >
                    Confirm Allotment
                  </button>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Changes to exam permissions require manual confirmation.</p>
                </div>
              </div>

              {/* Performance & Mark Release */}
              <div>
                <h3 className="text-2xl font-black text-slate-800 mb-8 mt-16">Performance & Mark Release</h3>
                
                {loadingSubs ? (
                  <div className="bg-slate-50 p-10 flex flex-col items-center justify-center gap-4 rounded-3xl border border-slate-100">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <span className="text-sm font-bold text-slate-400">Loading assessments...</span>
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="bg-slate-50 p-10 text-slate-400 text-sm font-medium rounded-3xl border border-slate-100 text-center italic">
                    No assessments completed yet.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {submissions.map(sub => {
                      const currentScore = getSubValue(sub, 'admin_score_override') ?? sub.score;
                      const isCurrentlyReleased = getSubValue(sub, 'is_released');
                      const hasChanges = (getSubValue(sub, 'admin_score_override') !== sub.score && getSubValue(sub, 'admin_score_override') !== undefined) || 
                                        (getSubValue(sub, 'is_released') !== sub.is_released);

                      return (
                        <div key={sub.id} className="bg-white p-8 rounded-3xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                               <CheckCircle className="w-6 h-6" />
                            </div>
                            <div>
                               <div className="flex items-center gap-3 mb-1">
                                 <h4 className="font-black text-xl text-slate-800 leading-none">{sub.exams?.title || 'Examination'}</h4>
                                 {hasChanges && <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-[10px] font-black uppercase rounded shadow-sm">PENDING SAVE</span>}
                               </div>
                               <p className="text-xs text-slate-500 font-medium tracking-tight">
                                  Original System Score: <strong className="text-slate-800">{sub.score} / {sub.total_questions}</strong>
                               </p>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center gap-6 md:pl-8 md:border-l border-slate-100 w-full md:w-auto">
                            <div className="flex flex-col items-center">
                               <div className="flex items-center gap-6 mb-2">
                                  <div className="text-center">
                                     <label className="text-[10px] font-black uppercase tracking-widest text-blue-500 block mb-1">FINAL MARKS</label>
                                     <div className="flex items-center bg-slate-50 rounded-full border-2 border-slate-100 p-1 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400/50 transition-all">
                                       <button onClick={() => handleAdjustMark(sub, -1)} className="w-8 h-8 rounded-full hover:bg-white hover:text-blue-600 hover:shadow-sm flex items-center justify-center text-slate-500 transition-all font-black text-lg">-</button>
                                       <input 
                                         type="number" 
                                         className="w-16 text-center bg-transparent font-black text-xl text-slate-800 focus:outline-none placeholder:text-slate-300"
                                         placeholder="0"
                                         value={currentScore === 0 ? '0' : (currentScore || '')}
                                         onChange={(e) => {
                                           const val = e.target.value;
                                           if (val === '') {
                                             updateSubChange(sub.id, 'admin_score_override', 0);
                                           } else {
                                             const num = parseInt(val);
                                             if (!isNaN(num)) {
                                               updateSubChange(sub.id, 'admin_score_override', Math.max(0, Math.min(sub.total_questions, num)));
                                             }
                                           }
                                         }}
                                       />
                                       <button onClick={() => handleAdjustMark(sub, 1)} className="w-8 h-8 rounded-full hover:bg-white hover:text-blue-600 hover:shadow-sm flex items-center justify-center text-slate-500 transition-all font-black text-lg">+</button>
                                     </div>
                                  </div>
                                  {hasChanges && (
                                    <button onClick={() => {
                                      updateSubChange(sub.id, 'admin_score_override', sub.score);
                                      updateSubChange(sub.id, 'is_released', sub.is_released);
                                    }} className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] hover:text-blue-500 transition-all mt-2 underline underline-offset-4">Reset Changes</button>
                                  )}
                               </div>
                            </div>
                            
                            <div className="flex flex-col gap-2 w-full sm:w-80">
                               <button className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-2xl border border-slate-200 transition-all text-xs flex items-center justify-center gap-2 group">
                                  <Eye className="w-4 h-4 group-hover:text-blue-500 transition-colors" /> Question Breakdowns
                               </button>
                               <button 
                                 onClick={() => updateSubChange(sub.id, 'is_released', !isCurrentlyReleased)}
                                 className={`px-6 py-3 font-black rounded-2xl transition-all text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
                                   isCurrentlyReleased 
                                     ? 'bg-emerald-500 text-white shadow-emerald-500/30 hover:bg-emerald-600 ring-2 ring-emerald-500/20' 
                                     : 'bg-slate-900 text-white shadow-slate-900/30 hover:bg-slate-800'
                                 }`}
                               >
                                  {isCurrentlyReleased ? (
                                    <><CheckCircle className="w-4 h-4" /> Result Live</>
                                  ) : (
                                    <><Send className="w-4 h-4" /> Publish Result</>
                                  )}
                               </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

             <div className="mt-16 pt-10 border-t border-slate-100 flex justify-center relative z-10">
               <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 px-14 rounded-full shadow-xl shadow-blue-600/30 transition-all hover:-translate-y-1 text-lg">
                  Save Profile Changes
               </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

const VerificationCard = ({ label, url, onView }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4 group">
    <span className="text-[10px] font-black uppercase tracking-widest text-[#666666]">{label}</span>
    <div className="bg-black rounded-xl aspect-[1.5] overflow-hidden flex items-center justify-center relative cursor-pointer" onClick={() => url && onView && onView()}>
      {url ? (
        <img src={url} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
      ) : (
         <Shield className="w-8 h-8 text-slate-700" />
      )}
      {url && (
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Eye className="w-6 h-6 text-white" />
        </div>
      )}
    </div>
  </div>
);


const DeleteConfirmModal = ({ user, onClose, onConfirm }) => {
  return createPortal(
    <AnimatePresence>
      {user && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white max-w-sm w-full p-8 rounded-[2rem] shadow-2xl relative z-10 text-center"
          >
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">Delete User?</h3>
            <p className="text-slate-500 text-sm mb-8">Are you sure you want to remove <strong className="text-slate-800">{user.full_name || user.email}</strong>? This action cannot be undone.</p>
            
            <div className="flex gap-4">
              <button onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={onConfirm} className="flex-1 py-3 bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-colors">Delete</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// Side Drawer Modal for robust View Profile
const ViewCandidateDrawer = ({ user, onClose, onViewDoc, isSuperAdmin }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [subChanges, setSubChanges] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      document.body.style.overflow = 'hidden';
      fetchSubmissions();
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; }
  }, [user]);

  const fetchSubmissions = async () => {
    setLoadingSubs(true);
    try {
      const { data } = await supabase
        .from('submissions')
        .select('*, exams(title)')
        .eq('user_id', user.id);
      setSubmissions(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingSubs(false);
    }
  };

  const updateSubChange = (subId, field, value) => {
    setSubChanges(prev => ({
      ...prev,
      [subId]: { ...(prev[subId] || {}), [field]: value }
    }));
  };

  const getSubValue = (sub, field) => {
    return subChanges[sub.id]?.[field] ?? sub[field];
  };

  const handleAdjustMark = (sub, delta) => {
    const current = getSubValue(sub, 'admin_score_override') ?? sub.score;
    const next = Math.max(0, Math.min(sub.total_questions, current + delta));
    updateSubChange(sub.id, 'admin_score_override', next);
  };

  const handlePublish = async (sub) => {
    setSaving(true);
    try {
      const currentScore = getSubValue(sub, 'admin_score_override') ?? sub.score;
      const isReleased = !getSubValue(sub, 'is_released'); // Toggle
      
      const { error } = await supabase
        .from('submissions')
        .update({ 
          admin_score_override: currentScore,
          is_released: isReleased 
        })
        .eq('id', sub.id);

      if (error) throw error;
      
      // Update local state
      setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, admin_score_override: currentScore, is_released: isReleased } : s));
      // Clear changes for this sub
      const newChanges = { ...subChanges };
      delete newChanges[sub.id];
      setSubChanges(newChanges);
      
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-slate-50 w-full max-w-3xl max-h-[90vh] shadow-2xl relative z-10 flex flex-col overflow-hidden rounded-[2rem] border border-white"
        >
          {/* Drawer Header Styled accurately to the screenshot */}
          <div className="p-6 md:p-8 bg-white border-b border-slate-100 flex items-center justify-between shadow-sm z-20">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center text-white text-xl font-bold shadow-lg">
                {user.profile_photo_url ? <img src={user.profile_photo_url} className="w-full h-full object-cover" /> : user.full_name?.charAt(0) || '?'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 leading-none mb-1">{user.full_name || 'Incomplete Profile'}</h2>
                <div className="flex items-center gap-2 text-sm text-blue-500 font-medium">
                  {user.email}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-800 rounded-2xl transition-colors border border-slate-100 hover:border-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10 custom-scrollbar">
             
             {/* Personal Details Card */}
             <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full text-xs font-bold tracking-wider uppercase text-slate-600 mb-6 border border-slate-200">
                   <User className="w-3.5 h-3.5" /> PERSONAL DETAILS
                </div>
                
                <h3 className="text-3xl font-black text-slate-800 mb-6">{user.full_name || '--'}</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-blue-500 font-medium">
                     <Mail className="w-4 h-4" /> {user.email}
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 font-medium">
                     <Phone className="w-4 h-4 text-blue-500" /> 
                     {isSuperAdmin ? (user.phone || '+91 - Not Provided') : (
                       <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-400 font-bold uppercase tracking-tighter flex items-center gap-1.5 border border-slate-200">
                         <Lock className="w-2.5 h-2.5" /> SECURE DATA
                       </span>
                     )}
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 font-medium">
                     <MapPin className="w-4 h-4 text-blue-500" /> 
                     {isSuperAdmin ? (user.address || 'Location Not Provided') : (
                       <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-400 font-bold uppercase tracking-tighter flex items-center gap-1.5 border border-slate-200">
                         <Lock className="w-2.5 h-2.5" /> PROTECTED LOCATION
                       </span>
                     )}
                  </div>
                </div>

                {/* Decorative avatar watermark */}
                <div className="absolute -right-10 -bottom-10 w-48 h-48 opacity-[0.03] text-slate-900 pointer-events-none">
                  <User className="w-full h-full" />
                </div>
             </div>

             {/* Documents Section */}
             <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100"><FileText className="w-5 h-5" /></div>
                  <h3 className="text-2xl font-black text-slate-800">Documents</h3>
                </div>
                
                {isSuperAdmin ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                     <DocumentWidget label="Aadhar Card (Front)" url={user.aadhaar_front_url} onView={() => onViewDoc({ label: "Aadhar Card (Front)", url: user.aadhaar_front_url })} />
                     <DocumentWidget label="Aadhar Card (Back)" url={user.aadhaar_back_url} onView={() => onViewDoc({ label: "Aadhar Card (Back)", url: user.aadhaar_back_url })} />
                     <DocumentWidget label="PAN Card" url={user.pan_card_url} onView={() => onViewDoc({ label: "PAN Card", url: user.pan_card_url })} />
                     <DocumentWidget label="Signature" url={user.signature_url} onView={() => onViewDoc({ label: "Signature", url: user.signature_url })} />
                  </div>
                ) : (
                  <div className="bg-white/50 backdrop-blur-sm p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden group">
                     <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                     <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 shadow-inner relative z-10">
                        <Lock className="w-8 h-8" />
                     </div>
                     <div className="relative z-10">
                        <h4 className="font-black text-slate-800 text-lg mb-1">Access Restricted</h4>
                     </div>
                  </div>
                )}
             </div>

             {/* Exam Results Section */}
             <div>
               <h3 className="text-2xl font-black text-slate-800 mb-6 mt-12">Exam Results</h3>
               
               {loadingSubs ? (
                 <div className="p-10 text-center text-slate-400 bg-white rounded-3xl border border-slate-100 flex flex-col items-center gap-3">
                   <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                   Fetching examination data...
                 </div>
               ) : submissions.length === 0 ? (
                 <div className="p-10 text-center text-slate-400 bg-white rounded-3xl border border-slate-100">
                   No exam assessments completed by this candidate yet.
                 </div>
                ) : (
                  <div className="space-y-4">
                     {submissions.map(sub => (
                        <InteractiveResultCard 
                          key={sub.id} 
                          submission={sub} 
                          currentScore={getSubValue(sub, 'admin_score_override') ?? sub.score}
                          isReleased={getSubValue(sub, 'is_released')}
                          onAdjust={(d) => handleAdjustMark(sub, d)}
                          onType={(val) => updateSubChange(sub.id, 'admin_score_override', val)}
                          onPublish={() => handlePublish(sub)}
                          isSaving={saving}
                          hasChanges={!!subChanges[sub.id]}
                        />
                     ))}
                  </div>
                )}
             </div>

             {/* Close Profile Footer */}
             <div className="pt-10 pb-6 flex justify-center">
                <button onClick={onClose} className="px-8 py-3 bg-white text-slate-500 font-bold rounded-full border border-slate-200 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm flex items-center gap-2">
                  <X className="w-4 h-4" /> Close Profile
                </button>
             </div>
          </div>



        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

const DocumentViewerOverlay = ({ doc, onClose }) => {
  return createPortal(
    <AnimatePresence>
      {doc && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-slate-900 p-2 rounded-3xl shadow-2xl relative z-10 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="flex justify-between items-center p-5 border-b border-white/10 shrink-0">
              <h4 className="text-white font-bold">{doc.label}</h4>
              <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto rounded-2xl bg-black/50 m-2 flex justify-center items-center">
               <img src={doc.url} alt={doc.label} className="max-w-full max-h-full object-contain p-2" />
            </div>
            <div className="p-4 flex justify-end border-t border-white/10 shrink-0">
              <a href={doc.url} download target="_blank" rel="noreferrer" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors flex items-center gap-2 text-sm">
                 <Download className="w-4 h-4" /> Open Original
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

const DocumentWidget = ({ label, url, onView }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 group hover:shadow-md transition-shadow cursor-default">
    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200 shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
       {url ? <FileText className="w-5 h-5" /> : <X className="w-5 h-5 text-slate-300" />}
    </div>
    <div className="flex-1 min-w-0">
      <h5 className="font-bold text-slate-800 text-sm truncate">{label}</h5>
      <p className="text-xs text-slate-400 truncate">{url ? 'Document uploaded' : 'none'}</p>
    </div>
    {url ? (
      <button onClick={onView} className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors font-bold text-xs shrink-0 flex items-center gap-1 group/btn">
         <Eye className="w-3.5 h-3.5" /> View
      </button>
    ) : (
      <div className="px-3 py-1 bg-rose-50 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-full shrink-0">
        MISSING
      </div>
    )}
  </div>
);

// Interactive Result Card for View Drawer
const InteractiveResultCard = ({ submission, currentScore, isReleased, onAdjust, onType, onPublish, isSaving, hasChanges }) => {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm hover:border-blue-100 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isReleased ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
          <CheckCircle className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-black text-lg text-slate-800 leading-tight">{submission.exams?.title || 'Unknown Exam'}</h4>
            {hasChanges && <span className="text-[9px] font-black bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded uppercase">Modified</span>}
          </div>
          <p className="text-sm text-slate-500 font-medium mt-1">
             Original System Score: <strong className="text-slate-800">{submission.score} / {submission.total_questions}</strong>
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 md:pl-6 md:border-l border-slate-100 w-full md:w-auto">
        <div className="flex flex-col items-center">
           <label className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">FINAL MARKS</label>
           <div className="flex items-center bg-slate-50 rounded-full border-2 border-slate-100 shadow-inner p-1 group focus-within:border-blue-400/50 transition-all">
             <button onClick={() => onAdjust(-1)} className="w-8 h-8 rounded-full hover:bg-white hover:text-blue-600 flex items-center justify-center text-slate-400 transition-all font-black">-</button>
             <input 
               type="number"
               className="w-12 text-center bg-transparent font-black text-xl text-slate-800 focus:outline-none"
               value={currentScore}
               onChange={(e) => {
                 const val = parseInt(e.target.value);
                 if (!isNaN(val)) onType(Math.max(0, Math.min(submission.total_questions, val)));
               }}
             />
             <button onClick={() => onAdjust(1)} className="w-8 h-8 rounded-full hover:bg-white hover:text-blue-600 flex items-center justify-center text-slate-400 transition-all font-black">+</button>
           </div>
        </div>
        <div className="flex flex-col gap-2 w-full sm:w-auto min-w-[140px]">
          <button 
            disabled={isSaving}
            onClick={onPublish}
            className={`px-6 py-2.5 font-black rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 ${
              isReleased 
                ? 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600' 
                : 'bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700'
            } active:scale-95 disabled:opacity-50`}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              isReleased ? <><CheckCircle className="w-4 h-4" /> Published</> : <><Send className="w-4 h-4" /> Publish Score</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Users;
