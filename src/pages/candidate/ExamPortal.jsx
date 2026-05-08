import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Send, 
  Menu, 
  X, 
  Layout, 
  ShieldCheck, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  Bookmark, 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical, 
  Flag, 
  Circle 
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
  const [isMapOpen, setIsMapOpen] = useState(true); 
  const [hasAcceptedDeclaration, setHasAcceptedDeclaration] = useState(false);
  const [acceptedCheckbox, setAcceptedCheckbox] = useState(false);
  const [reviewStatus, setReviewStatus] = useState({}); 
  const [visited, setVisited] = useState({ 0: true }); // Track visited questions

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
  useEffect(() => { indexRef.current = currentIdx; setVisited(prev => ({ ...prev, [currentIdx]: true })); }, [currentIdx]);

  const handleAnswer = (optionIdx) => {
    setAnswers(prev => ({ ...prev, [currentIdx]: optionIdx }));
  };

  const toggleReview = () => {
    setReviewStatus(prev => ({ ...prev, [currentIdx]: !prev[currentIdx] }));
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
    <div className="h-screen w-full flex flex-col bg-[#fcfdfe] select-none font-inter overflow-hidden relative">
      
      {/* MODERN HEADER - FIXED HEIGHT */}
      <header className="h-20 shrink-0 bg-white border-b border-slate-100 flex items-center px-8 z-[100] shadow-sm">
        <div className="flex items-center gap-6">
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
             <PMISLogo variant="navbar" />
          </div>
          <div className="h-8 w-[1px] bg-slate-100" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Live Assessment</p>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">{exam?.title || 'Loading Exam...'}</h1>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-8">
           <button 
              onClick={() => handleSubmit()} 
              disabled={submitting}
              className="bg-[#19a5c8] hover:bg-[#1589a7] text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
           >
              {submitting ? 'Syncing...' : 'Submit Exam'} <CheckCircle className="w-4 h-4" />
           </button>

           <div className="flex items-center gap-4 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Time Left</span>
              <div className={`flex items-center gap-2 font-mono text-xl font-black ${timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-slate-900'}`}>
                <Clock className="w-5 h-5 opacity-40" />
                {formatTime(timeLeft)}
              </div>
           </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT: MAIN QUESTION AREA */}
        <main className="flex-1 relative flex flex-col overflow-hidden">
           {/* Question Indicator */}
           <div className="px-16 pt-8 pb-4 flex items-center gap-3 shrink-0">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Question</span>
              <div className="bg-[#0f172a] text-white w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shadow-xl shadow-slate-900/20">
                {currentIdx + 1}
              </div>
              <span className="text-slate-300 font-bold">/ {questions.length}</span>
              <div className="h-0.5 flex-1 bg-slate-100 mx-10 rounded-full overflow-hidden">
                <motion.div initial={{width:0}} animate={{width:`${progressPercent}%`}} className="h-full bg-cyan-500" />
              </div>
           </div>

           <div className="flex-1 px-16 py-6 overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="wait">
                 <motion.div 
                    key={currentIdx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-10 max-w-5xl"
                 >
                    <div className="flex gap-6">
                       <div className="w-1 h-10 bg-[#0f172a] rounded-full shrink-0 mt-1" />
                       <h2 className="text-[34px] font-bold text-[#0f172a] leading-[1.3] tracking-tight">
                         {currentQuestion?.question_text}
                       </h2>
                    </div>

                    <div className="grid gap-3.5 pl-7">
                       {currentQuestion?.options.map((option, idx) => (
                          <button 
                             key={idx}
                             onClick={() => handleAnswer(idx)}
                             className={`
                               group flex items-center gap-6 p-6 rounded-3xl border-2 transition-all duration-200 text-left
                               ${answers[currentIdx] === idx 
                                 ? 'bg-blue-50/40 border-blue-500 shadow-md shadow-blue-500/5' 
                                 : 'bg-white border-transparent hover:border-slate-100 hover:shadow-sm'}
                             `}
                          >
                             <div className={`
                                w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-colors
                                ${answers[currentIdx] === idx ? 'bg-blue-500 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}
                             `}>
                                {String.fromCharCode(65 + idx)}
                             </div>
                             <span className={`text-[19px] font-semibold transition-colors ${answers[currentIdx] === idx ? 'text-slate-900' : 'text-slate-500'}`}>
                                {option}
                             </span>
                          </button>
                       ))}
                    </div>
                 </motion.div>
              </AnimatePresence>
           </div>

           {/* FOOTER ACTIONS - STABLE PILL DESIGN */}
           <footer className="h-24 shrink-0 border-t border-slate-50 flex items-center justify-between px-16 bg-white/50 backdrop-blur-sm">
              <button 
                 disabled={currentIdx === 0}
                 onClick={() => setCurrentIdx(prev => prev - 1)}
                 className="flex items-center gap-3 text-[#94a3b8] hover:text-[#0f172a] font-black uppercase tracking-widest text-[11px] transition-all disabled:opacity-20"
              >
                 <ChevronLeft className="w-4 h-4" /> Prev
              </button>

              <button 
                 onClick={toggleReview}
                 className={`flex items-center gap-3 px-10 py-3.5 rounded-full border-2 transition-all text-[11px] font-black uppercase tracking-widest ${reviewStatus[currentIdx] ? 'bg-[#f59e0b] border-[#f59e0b] text-white shadow-lg shadow-amber-500/20' : 'bg-white border-slate-100 text-[#64748b] hover:border-slate-300'}`}
              >
                 <Bookmark className={`w-4 h-4 ${reviewStatus[currentIdx] ? 'fill-white' : ''}`} /> 
                 {reviewStatus[currentIdx] ? 'Marked' : 'Mark for Review'}
              </button>

              <button 
                 onClick={() => {
                   if (currentIdx < questions.length - 1) setCurrentIdx(prev => prev + 1);
                   else showAlert('All questions reached. Review map or submit.', 'info');
                 }}
                 className="bg-[#0f172a] hover:bg-[#1e293b] text-white px-12 py-4 rounded-3xl text-xs font-black uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-slate-900/20 transition-all active:scale-95"
              >
                 {currentIdx === questions.length - 1 ? 'Review' : 'Next'} <ChevronRight className="w-4 h-4" />
              </button>
           </footer>
        </main>

        {/* RIGHT: QUESTION MAP SIDEBAR */}
        <aside className="w-80 shrink-0 bg-white border-l border-slate-100 flex flex-col p-8 z-[90]">
           <div className="flex items-center gap-3 mb-8">
              <Menu className="w-5 h-5 text-slate-400" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Map</h3>
           </div>

           <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-4 gap-3.5">
                 {questions.map((_, idx) => {
                    const isCurrent = currentIdx === idx;
                    const isAnswered = answers[idx] !== undefined;
                    const isReviewed = reviewStatus[idx];
                    const isVisited = visited[idx];

                    let shapeClass = "rounded-xl";
                    let clipStyle = {};
                    let colorClass = "bg-slate-50 text-slate-300 border border-slate-100/50 hover:border-slate-200";

                    if (isCurrent) {
                       colorClass = "bg-[#0f172a] text-white shadow-xl shadow-slate-900/30 scale-110 z-10";
                       clipStyle = { clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' };
                    } else if (isReviewed) {
                       colorClass = "bg-[#6366f1] text-white";
                       shapeClass = "rounded-full";
                    } else if (isAnswered) {
                       colorClass = "bg-[#10b981] text-white";
                       clipStyle = { clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' };
                    } else if (isVisited) {
                       colorClass = "bg-[#f59e0b] text-white";
                       clipStyle = { clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' };
                    }

                    return (
                       <button 
                          key={idx}
                          onClick={() => setCurrentIdx(idx)}
                          className={`relative aspect-square text-[13px] font-black transition-all flex items-center justify-center ${shapeClass} ${colorClass}`}
                          style={clipStyle}
                       >
                          {idx + 1}
                       </button>
                    );
                 })}
              </div>
           </div>

           {/* LEGEND */}
           <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
              <LegendItem 
                shape="rounded-md border-2 border-slate-100" 
                label="Not Visited" 
                count={questions.length - Object.keys(visited).length} 
              />
              <LegendItem 
                shape="bg-[#f59e0b]" 
                clipPath="polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"
                label="Not Answered" 
                count={Object.keys(visited).filter(idx => answers[idx] === undefined && !reviewStatus[idx]).length} 
              />
              <LegendItem 
                shape="bg-[#10b981]" 
                clipPath="polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)"
                label="Answered" 
                count={Object.keys(answers).filter(idx => !reviewStatus[idx]).length} 
              />
              <LegendItem 
                shape="bg-[#6366f1] rounded-full" 
                label="Reviewed" 
                count={Object.keys(reviewStatus).filter(k => reviewStatus[k]).length} 
              />
           </div>
        </aside>
      </div>
    </div>
  );
};

const LegendItem = ({ shape, clipPath, label, count }) => (
  <div className="flex items-center gap-4">
    <div 
      className={`w-5 h-5 shrink-0 ${shape}`} 
      style={clipPath ? { clipPath } : {}}
    />
    <span className="text-[11px] font-black text-[#94a3b8] uppercase tracking-wider leading-none">{label}</span>
    <span className="ml-auto text-xs font-black text-[#0f172a]">{Math.max(0, count)}</span>
  </div>
);

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
