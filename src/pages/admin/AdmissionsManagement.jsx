import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  ChevronDown,
  FileText,
  Video,
  Eye,
  Copy,
  Check,
  Search,
  UserCheck,
  Clock,
  X,
  Key,
  RefreshCw,
  AlertCircle,
  MapPin,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Filter,
  Loader2,
  ExternalLink,
  Users,
  Award
} from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { useAlert } from '../../context/AlertProvider';

const AdmissionsManagement = () => {
  const { showAlert } = useAlert();
  const [admissions, setAdmissions] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending'); // 'pending' | 'approved' | 'all'

  // Modal viewers state
  const [activeMediaModal, setActiveMediaModal] = useState(null); // { type: 'image'|'video', title: string, url: string }

  // Accept & Create User Modal state
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [selectedExamIds, setSelectedExamIds] = useState([]);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [processingUserCreation, setProcessingUserCreation] = useState(false);

  useEffect(() => {
    fetchAdmissions();
    fetchExams();
  }, [statusFilter]);

  const fetchAdmissions = async () => {
    setLoading(true);
    try {
      let query = supabase.from('admissions').select('*').order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAdmissions(data || []);
    } catch (err) {
      console.error('Error fetching admissions:', err);
      showAlert('Failed to load admission applications.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase.from('exams').select('id, title').order('title');
      if (!error && data) {
        setExams(data);
      }
    } catch (err) {
      console.error('Error fetching exams list:', err);
    }
  };

  // Helper to generate a secure random 12-character password
  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let pwd = '';
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  const handleOpenAcceptModal = (admission) => {
    setSelectedAdmission(admission);
    const pwd = generateSecurePassword();
    setGeneratedPassword(pwd);
    setCopiedPassword(false);
    setSelectedExamIds([]);
    setAcceptModalOpen(true);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2500);
  };

  const handleConfirmCreateUser = async () => {
    if (!selectedAdmission) return;

    if (!generatedPassword || !generatedPassword.trim()) {
      showAlert('Please enter or generate a login password.', 'warning');
      return;
    }

    setProcessingUserCreation(true);
    try {
      const primaryExamId = selectedExamIds.length > 0 ? selectedExamIds[0] : null;

      const { data: createdUserId, error } = await supabase.rpc('create_user_from_admission', {
        p_admission_id: selectedAdmission.id,
        p_password: generatedPassword,
        p_exam_id: primaryExamId
      });

      if (error) throw error;

      // Update multi-exam assignments in public.profiles table
      if (selectedExamIds.length > 0 && createdUserId) {
        await supabase
          .from('profiles')
          .update({ allotted_exam_ids: selectedExamIds })
          .eq('id', createdUserId);
      }

      showAlert(
        `Candidate account for "${selectedAdmission.full_name}" created successfully! Password: ${generatedPassword}`,
        'success'
      );
      setAcceptModalOpen(false);
      setSelectedAdmission(null);
      fetchAdmissions();
    } catch (err) {
      console.error('Error executing create_user_from_admission RPC:', err);
      showAlert(err.message || 'Failed to approve candidate and create user account.', 'error');
    } finally {
      setProcessingUserCreation(false);
    }
  };

  // Filtered Admissions List by Search Query
  const filteredAdmissions = admissions.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      (item.full_name && item.full_name.toLowerCase().includes(q)) ||
      (item.email && item.email.toLowerCase().includes(q)) ||
      (item.phone && item.phone.includes(q)) ||
      (item.course_name && item.course_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls Bar */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 font-outfit flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-primary-500" />
            Admissions Management
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Review online candidate admissions, inspect video statements & verification documents, and register candidates.
          </p>
        </div>

        {/* Status Filter Tabs & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Filter Pills */}
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center border border-slate-200">
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'pending'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'approved'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate name, email..."
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 w-full sm:w-56"
            />
          </div>

          <button
            onClick={fetchAdmissions}
            className="p-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all shrink-0 flex items-center justify-center"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="bg-white/60 backdrop-blur-xl border border-slate-100 rounded-3xl p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-semibold">Loading admission applications...</p>
        </div>
      ) : filteredAdmissions.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-xl border border-slate-100 rounded-3xl p-12 text-center">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-slate-800 font-bold text-lg">No admissions found</h3>
          <p className="text-slate-500 text-xs mt-1">
            {statusFilter === 'pending'
              ? 'There are currently no pending candidate applications awaiting approval.'
              : 'No admission applications match your current search criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAdmissions.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between"
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    {item.profile_photo_url ? (
                      <img
                        src={item.profile_photo_url}
                        alt={item.full_name}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-lg border border-primary-100">
                        {item.full_name?.charAt(0) || 'C'}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-snug">{item.full_name}</h3>
                      <p className="text-xs text-primary-600 font-semibold">{item.course_name}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      item.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                {/* Info Fields */}
                <div className="space-y-2 text-xs text-slate-600 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 mb-4">
                  <div className="flex items-center gap-2 truncate">
                    <Eye className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{item.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>+91 {item.phone}</span>
                  </div>
                  {(item.city || item.state) && (
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {[item.city, item.state, item.pincode].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                  {item.ip_address && (
                    <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>IP: {item.ip_address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Applied: {new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Media & Document Action Buttons */}
                <div className="space-y-2 mb-4">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Verification Media
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Live Video Statement Button */}
                    {item.video_url ? (
                      <button
                        onClick={() =>
                          setActiveMediaModal({
                            type: 'video',
                            title: `Video Verification — ${item.full_name}`,
                            url: item.video_url
                          })
                        }
                        className="col-span-2 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-2 rounded-xl text-xs font-bold border border-rose-200 flex items-center justify-center gap-2 transition-all"
                      >
                        <Video className="w-4 h-4 text-rose-600" />
                        <span>Watch Video Statement</span>
                      </button>
                    ) : null}

                    {/* Aadhaar Front */}
                    {item.aadhaar_front_url && (
                      <button
                        onClick={() =>
                          setActiveMediaModal({
                            type: 'image',
                            title: `Aadhaar Front — ${item.full_name}`,
                            url: item.aadhaar_front_url
                          })
                        }
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>Aadhaar (F)</span>
                      </button>
                    )}

                    {/* Aadhaar Back */}
                    {item.aadhaar_back_url && (
                      <button
                        onClick={() =>
                          setActiveMediaModal({
                            type: 'image',
                            title: `Aadhaar Back — ${item.full_name}`,
                            url: item.aadhaar_back_url
                          })
                        }
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>Aadhaar (B)</span>
                      </button>
                    )}

                    {/* PAN Card */}
                    {item.pan_url && (
                      <button
                        onClick={() =>
                          setActiveMediaModal({
                            type: 'image',
                            title: `PAN Card — ${item.full_name}`,
                            url: item.pan_url
                          })
                        }
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>PAN Card</span>
                      </button>
                    )}

                    {/* Digital Signature */}
                    {item.signature_url && (
                      <button
                        onClick={() =>
                          setActiveMediaModal({
                            type: 'image',
                            title: `Signature — ${item.full_name}`,
                            url: item.signature_url
                          })
                        }
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>Signature</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button: Accept & Create User */}
              <div>
                {item.status === 'pending' ? (
                  <button
                    onClick={() => handleOpenAcceptModal(item)}
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-2xl font-bold text-xs shadow-md shadow-primary-500/20 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Accept & Create Candidate Account</span>
                  </button>
                ) : (
                  <div className="w-full bg-emerald-50 text-emerald-700 py-2.5 rounded-2xl text-xs font-bold text-center border border-emerald-200 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Account Created & Approved</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* MEDIA OVERLAY MODAL VIEWER */}
      <AnimatePresence>
        {activeMediaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-900 text-white border border-slate-700 p-6 rounded-3xl max-w-3xl w-full relative shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <h3 className="text-base font-bold flex items-center gap-2">
                  {activeMediaModal.type === 'video' ? (
                    <Video className="w-5 h-5 text-rose-400" />
                  ) : (
                    <FileText className="w-5 h-5 text-primary-400" />
                  )}
                  {activeMediaModal.title}
                </h3>
                <button
                  onClick={() => setActiveMediaModal(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center justify-center max-h-[70vh] overflow-auto bg-black/60 rounded-2xl p-2">
                {activeMediaModal.type === 'video' ? (
                  <video
                    src={activeMediaModal.url}
                    controls
                    autoPlay
                    className="w-full max-h-[65vh] rounded-xl object-contain"
                  />
                ) : (
                  <img
                    src={activeMediaModal.url}
                    alt={activeMediaModal.title}
                    className="max-h-[65vh] w-auto object-contain rounded-xl"
                  />
                )}
              </div>

              <div className="mt-4 flex justify-between items-center text-xs text-slate-400">
                <a
                  href={activeMediaModal.url}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary-400 flex items-center gap-1 underline"
                >
                  <span>Open direct URL</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => setActiveMediaModal(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl font-bold"
                >
                  Close Viewer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ACCEPT & CREATE USER MODAL */}
      <AnimatePresence>
        {acceptModalOpen && selectedAdmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 relative"
            >
              <button
                onClick={() => setAcceptModalOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 p-1 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary-50 rounded-2xl text-primary-600 flex items-center justify-center font-bold">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 font-outfit">Approve & Register User</h3>
                  <p className="text-slate-500 text-xs">Create candidate profile and email identity</p>
                </div>
              </div>

              {/* Candidate Info Summary */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 space-y-1.5 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400">Candidate Name:</span>
                  <span className="font-bold text-slate-900">{selectedAdmission.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Email Address:</span>
                  <span className="font-semibold text-slate-800">{selectedAdmission.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Phone Number:</span>
                  <span className="font-semibold text-slate-800">+91 {selectedAdmission.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Selected Course:</span>
                  <span className="font-semibold text-primary-600">{selectedAdmission.course_name}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/60 pt-1.5 mt-1.5">
                  <span className="text-slate-400">Captured IP Address:</span>
                  <span className="font-mono text-slate-800 font-bold">{selectedAdmission.ip_address || 'Captured'}</span>
                </div>
              </div>

              {/* Multi-Select Exams Assignment Box */}
              <div className="mb-5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-primary-500" />
                    Allotted Exams (Optional Multi-Select)
                  </span>
                  <span className="text-[11px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100">
                    {selectedExamIds.length} Selected
                  </span>
                </label>

                <div className="max-h-36 overflow-y-auto bg-slate-50 border border-slate-200 rounded-2xl p-2.5 space-y-1.5 custom-scrollbar">
                  {exams.length === 0 ? (
                    <p className="text-xs text-slate-400 p-2">No active exams available.</p>
                  ) : (
                    exams.map((exam) => {
                      const isChecked = selectedExamIds.includes(exam.id);
                      return (
                        <label
                          key={exam.id}
                          className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border ${
                            isChecked
                              ? 'bg-white border-primary-500 shadow-sm text-slate-900 font-bold'
                              : 'bg-white/60 border-slate-200/80 hover:bg-white text-slate-700 font-medium'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedExamIds([...selectedExamIds, exam.id]);
                              } else {
                                setSelectedExamIds(selectedExamIds.filter((id) => id !== exam.id));
                              }
                            }}
                            className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300"
                          />
                          <span className="text-xs">{exam.title}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Candidate Login Password Box (Editable + Auto-Regenerate) */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-primary-500" />
                    Candidate Login Password
                  </span>
                  <button
                    type="button"
                    onClick={() => setGeneratedPassword(generateSecurePassword())}
                    className="text-[11px] text-primary-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <RefreshCw className="w-3 h-3" /> Regenerate
                  </button>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={generatedPassword}
                    onChange={(e) => setGeneratedPassword(e.target.value)}
                    placeholder="Enter or generate password..."
                    className="w-full px-4 py-3 bg-white text-slate-900 font-mono font-bold text-sm rounded-2xl border-2 border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 tracking-wider shadow-sm select-all focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className={`px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 ${
                      copiedPassword
                        ? 'bg-emerald-600 text-white'
                        : 'bg-primary-500 hover:bg-primary-600 text-white shadow-md shadow-primary-500/20'
                    }`}
                  >
                    {copiedPassword ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  You can type a custom password manually or click "Regenerate" to auto-generate one.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAcceptModalOpen(false)}
                  disabled={processingUserCreation}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCreateUser}
                  disabled={processingUserCreation}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-primary-500/30 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {processingUserCreation ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Candidate...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Approve & Create Account</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdmissionsManagement;
