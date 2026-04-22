import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Send, 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  X, 
  Layout, 
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useAlert } from '../../context/AlertProvider';
import PMISLogo from '../../components/common/PMISLogo';

const ExamPortal = () => {
  const { id: examId } = useParams();
  const { user } = useAuth();
  const { showAlert, confirm } = useAlert();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [hasAcceptedDeclaration, setHasAcceptedDeclaration] = useState(false);
  const [acceptedCheckbox, setAcceptedCheckbox] = useState(false);

  // Refs for persistence to avoid dependency loops in interval
  const answersRef = useRef({});
  const indexRef = useRef(0);
  const timeRef = useRef(null);

  // 1. Initial Load
  useEffect(() => {
    const initExam = async () => {
      try {
        const { data: examData } = await supabase.from('exams').select('*').eq('id', examId).single();
        const { data: qData } = await supabase.from('questions').select('*').eq('exam_id', examId);
        
        if (!examData) throw new Error('Exam not found');
        setExam(examData);
        setQuestions(qData || []);
        
        // Load local progress
        const saved = localStorage.getItem(`exam_sync_${examId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          setAnswers(parsed.answers || {});
          setCurrentIdx(parsed.index || 0);
          setTimeLeft(parsed.timeLeft !== undefined ? parsed.timeLeft : examData.duration * 60);
          
          answersRef.current = parsed.answers || {};
          indexRef.current = parsed.index || 0;
          timeRef.current = parsed.timeLeft !== undefined ? parsed.timeLeft : examData.duration * 60;
        } else {
          const initialTime = examData.duration * 60;
          setTimeLeft(initialTime);
          timeRef.current = initialTime;
        }
      } catch (err) {
        showAlert(err.message, 'error');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    initExam();
  }, [examId]);

  // 2. Strict 1-Second Persistence Interval
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (timeLeft !== null && timeLeft > 0 && !submitting && hasAcceptedDeclaration) {
        // Decrease timer
        setTimeLeft(prev => {
          const next = prev - 1;
          timeRef.current = next;
          return next;
        });

        // Sync to LocalStorage
        const stateToSave = {
          answers: answersRef.current,
          index: indexRef.current,
          timeLeft: timeRef.current
        };
        localStorage.setItem(`exam_sync_${examId}`, JSON.stringify(stateToSave));
      }

      if (timeLeft === 0 && !submitting && hasAcceptedDeclaration) {
        handleAutoSubmit();
      }
    }, 1000);

    return () => clearInterval(syncInterval);
  }, [examId, timeLeft, submitting, hasAcceptedDeclaration]);

  // Sync state to refs whenever state changes (for the interval to use)
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { indexRef.current = currentIdx; }, [currentIdx]);

  const handleAnswer = (optionIdx) => {
    setAnswers(prev => ({ ...prev, [currentIdx]: optionIdx }));
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correct_option) score++;
    });
    return score;
  };

  const handleSubmit = async (isAuto = false) => {
    if (!isAuto) {
      return confirm({
        title: 'Submit Examination?',
        message: 'Are you sure you want to finish the exam? This action cannot be undone.',
        confirmText: 'Submit Now',
        type: 'info',
        onConfirm: processSubmit
      });
    }
    processSubmit();
  };

  const processSubmit = async () => {
    setSubmitting(true);
    try {
      const finalScore = calculateScore();
      const { error } = await supabase.from('submissions').insert({
        user_id: user.id,
        exam_id: examId,
        score: finalScore,
        total_questions: questions.length,
        answers: answersRef.current,
        is_released: false,
        submitted_at: new Date().toISOString()
      });

      if (error) throw error;

      showAlert('Exam submitted successfully!', 'success');
      localStorage.removeItem(`exam_sync_${examId}`);
      navigate('/');
    } catch (err) {
      showAlert(err.message, 'error');
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = useCallback(() => {
    showAlert('Time is up! Submitting automatically...', 'warning');
    processSubmit();
  }, []);

  const formatTime = (seconds) => {
    if (seconds === null) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return (
    <div className="flex items-center justify-center bg-slate-50 py-20">

      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Synchronizing Exam Data...</p>
      </div>
    </div>
  );

  const currentQuestion = questions[currentIdx];
  const progressPercent = questions.length > 0 ? ((Object.keys(answers).length) / questions.length) * 100 : 0;

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center bg-slate-50 py-20">

        <div className="glass-panel p-10 text-center max-w-md space-y-6">

          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">No Questions Found</h2>
          <p className="text-slate-500 text-sm">This examination does not have any questions assigned to it yet. Please contact your administrator.</p>
          <button onClick={() => navigate('/')} className="btn-premium w-full">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  if (!hasAcceptedDeclaration) {
    return (
      <div className="bg-[#f8fafc] flex items-center justify-center p-6 selection:bg-primary-500/10">

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-3xl border border-white w-full max-w-3xl rounded-[3rem] shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col relative"
        >
          {/* Header Strip */}
          <div className="bg-gradient-to-r from-primary-600 to-indigo-600 px-12 py-10 text-white relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-3xl font-outfit font-black tracking-tight">{exam?.title}</h2>
                <p className="text-white/70 text-sm font-bold uppercase tracking-widest mt-1">Examination Declaration</p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-10 space-y-8">

            {/* Exam Format Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <SummaryItem icon={<Layout className="w-4 h-4" />} label="Questions" value="40 Total" />
               <SummaryItem icon={<CheckCircle className="w-4 h-4" />} label="Marks" value="200 (5/ea)" />
               <SummaryItem icon={<Clock className="w-4 h-4" />} label="Duration" value="120 Mins" />
               <SummaryItem icon={<AlertTriangle className="w-4 h-4" />} label="Negative" value="None" />
            </div>

            {/* Declaration Text Container */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-[2rem] p-8 space-y-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-500">Conduct & behavior rules</h4>
                <p className="text-slate-600 font-medium leading-relaxed text-[15px]">
                  <span className="text-slate-900 font-bold block mb-2">Zero Tolerance Policy</span>
                  Use of unfair means, including external aids, mobile phones, or unauthorized browser switching, is strictly prohibited. Your session is being monitored through advanced automated proctoring logic.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-8 pt-4 border-t border-slate-200/50">
                <div className="space-y-2">
                   <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Integrity Policy</h5>
                   <p className="text-sm font-bold text-slate-800">Any suspicious activity will result in immediate disqualification.</p>
                </div>
                <div className="space-y-2 text-right">
                   <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Behavioral Integrity</h5>
                   <p className="text-sm font-bold text-slate-800">Avoid lip-syncing or leaving camera view.</p>
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-4">
               <label className="flex items-center gap-4 cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="peer sr-only" 
                      checked={acceptedCheckbox}
                      onChange={() => setAcceptedCheckbox(!acceptedCheckbox)}
                    />
                    <div className="w-7 h-7 border-2 border-slate-200 rounded-xl group-hover:border-primary-500 transition-all peer-checked:bg-primary-500 peer-checked:border-primary-500" />
                    <CheckCircle className="absolute inset-0 w-7 h-7 text-white scale-0 peer-checked:scale-75 transition-transform" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">I have read and agree to follow all instructions & rules.</span>
               </label>

               <AnimatePresence>
                 {acceptedCheckbox && (
                    <motion.button 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      onClick={() => setHasAcceptedDeclaration(true)}
                      className="w-full btn-premium !py-5 !rounded-2xl !text-base shadow-2xl shadow-primary-500/20"
                    >
                      Start Examination <ArrowRight className="w-5 h-5" />
                    </motion.button>
                 )}
               </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-slate-50 select-none page-transition">

      {/* Slim Top Navigation Strip */}
      <header className="fixed top-0 left-0 right-0 z-[100] px-4 py-3">
        <div className="max-w-7xl mx-auto bg-white/80 backdrop-blur-2xl border border-white/50 rounded-full px-6 py-2 flex items-center justify-between shadow-xl">
          <div className="flex items-center">
            <PMISLogo variant="navbar" />
          </div>

          <button 
            onClick={() => handleSubmit()}
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-full text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {submitting ? 'Syncing...' : 'Submit Exam'} <CheckCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Sub-Header HUD - Tightened */}
      <div className="mt-24 px-8 max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-6 mb-6">

        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Secure Session</span>
          </div>
          <h2 className="text-3xl font-outfit font-black text-slate-900 leading-tight tracking-tight">{exam?.title}</h2>
        </div>

        <div className="flex items-center gap-10">
          <div className="bg-white/60 backdrop-blur-md border border-slate-200 rounded-3xl px-8 py-3 shadow-sm flex items-center gap-6">
            <div className="text-center md:text-right">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Time Remaining</span>
              <div className={`flex items-center gap-3 font-mono text-2xl font-black ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-slate-900'}`}>
                 <Clock className={`w-5 h-5 ${timeLeft < 300 ? 'text-red-500' : 'text-blue-500'}`} />
                 {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress & Nav Bar */}
      <div className="px-8 max-w-7xl mx-auto w-full mb-8">

        <div className="bg-white border border-slate-200 p-4 flex items-center justify-between rounded-[2rem] shadow-sm">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsMapOpen(true)}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary-600 transition-all shadow-lg shadow-slate-900/10"
            >
              <Layout className="w-4 h-4" /> View All Questions
            </button>
            <div className="h-4 w-[1px] bg-slate-200" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Question <span className="text-slate-900 font-black">{currentIdx + 1}</span> <span className="text-slate-300 mx-1">/</span> {questions.length}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-4 flex-1 max-w-xs ml-auto">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${progressPercent}%` }}
                 className="h-full bg-primary-500"
               />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{Math.round(progressPercent)}% Clear</span>
          </div>
        </div>
      </div>

      {/* Main Question Surface */}
      <main className="flex-1 px-8 max-w-7xl mx-auto w-full pb-32">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <h3 className="text-3xl md:text-5xl font-outfit font-bold text-slate-900 leading-[1.2] tracking-tight">
              {currentQuestion?.question_text}
            </h3>

            <div className="grid gap-4">
              {currentQuestion?.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  className={`
                    w-full text-left p-6 md:p-8 rounded-[2rem] border-2 transition-all duration-300 flex items-center gap-6 group relative overflow-hidden
                    ${answers[currentIdx] === idx 
                      ? 'border-primary-500 bg-primary-50/50 shadow-lg shadow-primary-500/5' 
                      : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-md'}
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-black transition-all duration-300
                    ${answers[currentIdx] === idx ? 'bg-primary-500 border-primary-500 text-white' : 'border-slate-200 text-slate-300 group-hover:border-slate-400'}
                  `}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className={`text-xl font-semibold transition-colors duration-300 ${answers[currentIdx] === idx ? 'text-slate-900' : 'text-slate-500'}`}>
                    {option}
                  </span>
                  
                  {answers[currentIdx] === idx && (
                    <div className="ml-auto w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-white">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Floating Navigation - Glassy */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 z-50 pointer-events-none">
        <div className="max-w-7xl mx-auto flex justify-between items-center pointer-events-auto">
          <button 
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx(prev => prev - 1)}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black uppercase tracking-widest text-[10px] bg-white shadow-lg px-6 py-3 rounded-2xl border border-slate-100 disabled:opacity-30 transition-all"
          >
            <ChevronLeft className="w-5 h-5" /> Previous
          </button>

          <button 
            onClick={() => {
              if (currentIdx < questions.length - 1) setCurrentIdx(prev => prev + 1);
              else showAlert('All questions attempted. Review your answers or submit.', 'info');
            }}
            className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-2xl shadow-blue-600/30"
          >
            Save & Next <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </footer>

      {/* Right Question Map Drawer */}
      <AnimatePresence>
        {isMapOpen && (
          <div className="fixed inset-0 z-[200]">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMapOpen(false)}
              className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl flex flex-col"
            >
              <div className="p-8 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-3">
                   <Layout className="w-6 h-6 text-primary-500" />
                   <h3 className="text-xl font-black text-slate-900 tracking-tight">QUESTION MAP</h3>
                </div>
                <button onClick={() => setIsMapOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="p-8 flex-1 overflow-y-auto">
                <div className="grid grid-cols-5 gap-3">
                  {questions.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentIdx(idx);
                        setIsMapOpen(false);
                      }}
                      className={`
                        aspect-square rounded-xl font-black text-sm flex items-center justify-center transition-all
                        ${currentIdx === idx ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20 scale-110' : ''}
                        ${currentIdx !== idx && answers[idx] !== undefined ? 'bg-primary-500/10 text-primary-600' : ''}
                        ${currentIdx !== idx && answers[idx] === undefined ? 'bg-slate-100 text-slate-400 hover:bg-slate-200' : ''}
                      `}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 flex flex-col gap-4">
                 <div className="flex items-center gap-3">
                   <div className="w-4 h-4 rounded bg-primary-500/10 border border-primary-500/20" />
                   <span className="text-xs font-bold text-slate-500">Answered</span>
                   <span className="ml-auto text-sm font-black text-slate-900">{Object.keys(answers).length}</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="w-4 h-4 rounded bg-slate-100" />
                   <span className="text-xs font-bold text-slate-500">Unanswered</span>
                   <span className="ml-auto text-sm font-black text-slate-900">{questions.length - Object.keys(answers).length}</span>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SummaryItem = ({ icon, label, value }) => (
  <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-primary-500 shadow-sm border border-slate-100">
      {icon}
    </div>
    <div>
      <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      <span className="text-[11px] font-black text-slate-900">{value}</span>
    </div>
  </div>
);

const ArrowRight = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

export default ExamPortal;
