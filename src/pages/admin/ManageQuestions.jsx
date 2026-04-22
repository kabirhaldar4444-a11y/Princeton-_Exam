import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  Clock, 
  ArrowLeft, 
  Loader2, 
  Settings,
  X,
  Upload,
  AlertCircle,
  FileText,
  BookOpen,
  Layout
} from 'lucide-react';
import { useAlert } from '../../context/AlertProvider';
import * as XLSX from 'xlsx';

const ManageQuestions = ({ examId: initialExamId, onBack, onSubViewChange }) => {
  const { showAlert, confirm } = useAlert();
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // New Exam Local State
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamDuration, setNewExamDuration] = useState('');

  // Add Question Local State
  const [newQuestion, setNewQuestion] = useState({ 
    question_text: '', 
    options: ['', '', '', ''], 
    correct_option: 0,
    explanation: ''
  });

  // Excel Upload State
  const [isExcelPreviewOpen, setIsExcelPreviewOpen] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setExams(data || []);
      
      if (initialExamId && !selectedExam) {
        const exam = data.find(e => e.id === initialExamId);
        if (exam) handleSelectExam(exam);
      }
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = async () => {
    if (!newExamTitle.trim() || !newExamDuration) {
       showAlert('Please provide both title and duration.', 'error');
       return;
    }
    setProcessing(true);
    try {
      const { error } = await supabase.from('exams').insert({
        title: newExamTitle.trim(),
        duration: parseInt(newExamDuration)
      });
      if (error) throw error;
      showAlert('New exam created effectively.', 'success');
      setNewExamTitle('');
      setNewExamDuration('');
      fetchExams();
    } catch (e) {
      showAlert(e.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteExam = (examId) => {
    confirm({
       title: 'Delete Exam?',
       message: 'Are you sure you want to delete this exam and all its questions? This action is permanent.',
       type: 'danger',
       confirmText: 'Delete Exam',
       onConfirm: async () => {
         const { error } = await supabase.from('exams').delete().eq('id', examId);
         if (error) showAlert(error.message, 'error');
         else {
           showAlert('Exam deleted successfully.', 'success');
           fetchExams();
         }
       }
    });
  };

  const handleSelectExam = async (exam) => {
    setSelectedExam(exam);
    onSubViewChange?.(true); // Tell parent to hide its header/tabs
    setLoading(true);
    try {
      const { data, error } = await supabase.from('questions').select('*').eq('exam_id', exam.id);
      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToExams = () => {
    setSelectedExam(null);
    onSubViewChange?.(false); // Restore parent header/tabs
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.question_text.trim() || newQuestion.options.some(o => !o.trim())) {
      showAlert('Please fill all question fields and options.', 'error');
      return;
    }
    setProcessing(true);
    try {
      const { error } = await supabase.from('questions').insert({ 
        ...newQuestion, 
        exam_id: selectedExam.id 
      });
      if (error) throw error;
      showAlert('Question added successfully!', 'success');
      
      // Reset form
      setNewQuestion({ question_text: '', options: ['', '', '', ''], correct_option: 0, explanation: '' });
      handleSelectExam(selectedExam);
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteQuestion = async (id) => {
     try {
       const { error } = await supabase.from('questions').delete().eq('id', id);
       if (error) throw error;
       setQuestions(prev => prev.filter(q => q.id !== id));
       showAlert('Question removed.', 'success');
     } catch (e) {
       showAlert(e.message, 'error');
     }
  };

  // --- EXCEL PARSING & DRAG/DROP LOGIC ---
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
       processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
       processFile(e.target.files[0]);
    }
    e.target.value = null; // reset
  };

  const processFile = (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(ws);
        
        parseExcelData(jsonData);
      } catch (err) {
        console.error(err);
        showAlert('Failed to parse file. Please ensure it is a valid .xlsx or .csv format.', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const parseExcelData = (rows) => {
    let parsed = [];
    let validCount = 0;
    
    rows.forEach((row, i) => {
      // Find properties with case insensitive logic to support both Format 1 and Format 2
      const keys = Object.keys(row);
      const getVal = (possible) => {
        const match = keys.find(k => possible.includes(k.toLowerCase().trim()));
        return match ? row[match] : '';
      };

      const qText = getVal(['question', 'question text']);
      const o1 = getVal(['opt1', 'option a', 'option 1', 'optiona']);
      const o2 = getVal(['opt2', 'option b', 'option 2', 'optionb']);
      const o3 = getVal(['opt3', 'option c', 'option 3', 'optionc']);
      const o4 = getVal(['opt4', 'option d', 'option 4', 'optiond']);
      const rawAns = getVal(['correct_option', 'answer', 'correct option', 'correct answer']);
      const exp = getVal(['description', 'explanation', 'desc']);

      const optsFull = [o1, o2, o3, o4].filter(v => v !== undefined && v !== null && String(v).trim() !== '');
      const opts = [o1||'', o2||'', o3||'', o4||''];

      let cidx = -1;
      let error = '';

      if (!qText) {
         error = 'Missing Question text.';
      } else if (optsFull.length < 4) {
         error = 'Must provide all 4 options.';
      } else if (rawAns === undefined || rawAns === '') {
         error = 'Missing Correct Answer.';
      } else {
        let ansStr = String(rawAns).trim().toLowerCase();
        // Option 1: Index based (0, 1, 2, 3)
        if (['0','1','2','3'].includes(ansStr)) {
           cidx = parseInt(ansStr);
        }
        // Option 2: Alpha based (a, b, c, d)
        else if (['a','b','c','d'].includes(ansStr)) {
           cidx = ['a','b','c','d'].indexOf(ansStr);
        }
        // Option 3: Exact String Match
        else {
           const exactIdx = opts.findIndex(opt => String(opt).trim().toLowerCase() === ansStr);
           if (exactIdx !== -1) {
             cidx = exactIdx;
           } else {
             error = `Invalid Answer value: "${rawAns}". Does not match A-D or exact text.`;
           }
        }
      }

      parsed.push({
        _internal_id: i, // key 
        rowNum: i + 2, // Accounting for header
        question_text: String(qText || ''),
        options: opts.map(String),
        correct_option: cidx !== -1 ? cidx : 0,
        explanation: String(exp || ''),
        valid: error === '',
        error_msg: error
      });
      
      if (error === '') validCount++;
    });

    setParsedData({ rows: parsed, validCount, total: parsed.length });
    setIsExcelPreviewOpen(true);
  };

  const handleSaveBulkUpload = async () => {
    if (!parsedData) return;
    
    // Only save valid rows
    let rowsToSave = parsedData.rows.filter(r => r.valid).map(r => ({
       exam_id: selectedExam.id,
       question_text: r.question_text,
       options: [...r.options],
       correct_option: r.correct_option,
       explanation: r.explanation
    }));

    // Randomization Flags
    if (shuffleOptions) {
        rowsToSave = rowsToSave.map(row => {
            const tempOpts = row.options.map((text, idx) => ({ text, isCorrect: idx === row.correct_option }));
            tempOpts.sort(() => Math.random() - 0.5);
            return {
                ...row,
                options: tempOpts.map(o => o.text),
                correct_option: tempOpts.findIndex(o => o.isCorrect)
            };
        });
    }

    if (shuffleQuestions) {
        rowsToSave.sort(() => Math.random() - 0.5);
    }

    setProcessing(true);
    try {
      const { error } = await supabase.from('questions').insert(rowsToSave);
      if (error) throw error;
      
      showAlert(`Successfully imported ${rowsToSave.length} questions.`, 'success');
      setIsExcelPreviewOpen(false);
      setParsedData(null);
      handleSelectExam(selectedExam);
    } catch (e) {
      showAlert(e.message, 'error');
    } finally {
      setProcessing(false);
    }
  };


  // --- VIEWS ---

  if (selectedExam) {
    return (
      <div 
        className={`space-y-8 animate-fade-in pb-20 relative transition-colors ${isDragging ? 'bg-indigo-50/30' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
         {isDragging && (
           <div className="absolute inset-0 z-50 border-4 border-dashed border-indigo-500 bg-indigo-50/80 rounded-[3rem] flex items-center justify-center backdrop-blur-sm pointer-events-none">
              <div className="flex flex-col items-center justify-center text-indigo-600 bg-white p-10 rounded-3xl shadow-2xl">
                 <Upload className="w-16 h-16 mb-4 animate-bounce" />
                 <h2 className="text-3xl font-black tracking-tight">Drop Excel File Here</h2>
                 <p className="text-indigo-400 font-bold mt-2">Automatically mapping columns & answers...</p>
              </div>
           </div>
         )}
         
         {/* HEADER */}
         <div className="flex items-center gap-4 relative z-10">
            <button onClick={handleBackToExams} className="flex items-center gap-2 text-indigo-500 font-bold hover:text-indigo-700 transition-colors bg-indigo-50 px-4 py-2 rounded-full text-sm">
               <ArrowLeft className="w-4 h-4"/> Back to Exams
            </button>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">{selectedExam.title} <span className="text-slate-400 font-medium ml-1">Questions</span></h2>
            
            <div className="ml-auto">
               <label className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/30 transition-all active:scale-95">
                 <Upload className="w-4 h-4"/> Upload Excel
                 <input type="file" accept=".xlsx" onChange={handleFileUpload} className="hidden" />
               </label>
            </div>
         </div>

         <div className="grid lg:grid-cols-12 gap-8">
            {/* LEFT COLUMN: Single Question Form */}
            <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="bg-white p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                   <div className="flex items-center gap-2 mb-6">
                      <div className="bg-slate-100 p-1.5 rounded text-blue-500 font-bold"><Plus className="w-4 h-4"/></div>
                      <h3 className="font-bold text-lg text-slate-800 tracking-tight">Add Single Question</h3>
                   </div>
                   
                   <form onSubmit={handleAddQuestion} className="space-y-5">
                      <div>
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2 mb-1 block">Question Text</label>
                         <textarea 
                           className="input-premium w-full !bg-slate-50 min-h-[100px] leading-relaxed resize-none" 
                           placeholder="Enter question text here..."
                           value={newQuestion.question_text}
                           onChange={e => setNewQuestion({...newQuestion, question_text: e.target.value})}
                         />
                      </div>
                      
                      <div className="space-y-3">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2 block">Options</label>
                         {newQuestion.options.map((opt, i) => (
                           <div className="relative flex items-center" key={i}>
                              <div className="absolute left-4 font-bold text-slate-400">{String.fromCharCode(65+i)}</div>
                              <input 
                                className="input-premium w-full !pl-10 !bg-slate-50" 
                                placeholder={`Option ${String.fromCharCode(65+i)}`}
                                value={opt}
                                onChange={e => {
                                  const n = [...newQuestion.options];
                                  n[i] = e.target.value;
                                  setNewQuestion({...newQuestion, options: n});
                                }}
                              />
                           </div>
                         ))}
                      </div>

                      <div>
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2 mb-1 block">Correct Option</label>
                         <div className="relative">
                           <select 
                             className="input-premium w-full !bg-slate-50 appearance-none font-medium"
                             value={newQuestion.correct_option}
                             onChange={e => setNewQuestion({...newQuestion, correct_option: parseInt(e.target.value)})}
                           >
                              {newQuestion.options.map((_, i) => (
                                 <option key={i} value={i}>Option {String.fromCharCode(65+i)}</option>
                              ))}
                           </select>
                         </div>
                      </div>

                      <div>
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2 mb-1 block">Explanation (Optional)</label>
                         <textarea 
                           className="input-premium w-full !bg-slate-50 min-h-[80px] resize-none" 
                           placeholder="Optional explanation for the correct answer..."
                           value={newQuestion.explanation || ''}
                           onChange={e => setNewQuestion({...newQuestion, explanation: e.target.value})}
                         />
                      </div>

                      <button disabled={processing} className="w-full bg-[#825dfa] hover:bg-[#6c48e8] text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-500/20 transition-all">
                        {processing ? <Loader2 className="animate-spin w-5 h-5 mx-auto"/> : 'Add Question +'}
                      </button>
                   </form>
                </div>

                {/* Info Card mimicking screenshot helper bounds */}
                <div className="bg-[#f8fafc] border border-slate-200 rounded-[20px] p-6 text-sm">
                   <h4 className="font-bold flex items-center gap-2 text-blue-600 mb-4 tracking-tight"><FileText className="w-4 h-4"/> Excel Format (.xlsx)</h4>
                   <p className="text-slate-500 text-xs mb-3 font-medium">Supported Column Headers (Any of these sets):</p>
                   <div className="flex gap-2 mb-3">
                      <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-blue-600">question</span>
                      <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-blue-600">opt1</span>
                      <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-blue-600">opt2</span>
                      <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-blue-600">correct_option</span>
                   </div>
                   <div className="flex gap-2 mb-4">
                      <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-emerald-600">Question</span>
                      <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-emerald-600">Option A</span>
                      <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-emerald-600">Option B</span>
                      <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-emerald-600">Answer</span>
                   </div>
                   <p className="text-xs text-slate-400 italic font-medium">* Answer can be A/B/C/D, 0-3, or exact option text.</p>
                </div>
            </div>

            {/* RIGHT COLUMN: Question List */}
            <div className="lg:col-span-7 flex flex-col pt-1">
               <div className="flex justify-between items-center mb-5 pl-2">
                  <h3 className="font-black text-slate-800">Existing Questions</h3>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold ring-1 ring-indigo-500/20">{questions.length} Added</span>
               </div>
               
               <div className="bg-slate-50/50 flex-1 rounded-[24px] border border-slate-100 p-6 flex flex-col gap-4 relative">
                  {loading ? (
                     <div className="m-auto flex flex-col justify-center items-center py-20 opacity-70">
                         <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                         <p className="font-bold text-slate-500">Syncing Question Bank...</p>
                     </div>
                  ) : questions.length === 0 ? (
                     <div className="m-auto text-center flex flex-col items-center opacity-60 py-20">
                        <div className="w-16 h-16 bg-white border border-slate-200 rounded-[20px] flex items-center justify-center mb-4 shadow-sm">
                           <Layout className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-600 font-bold mb-1">No questions added for this exam yet.</p>
                        <p className="text-sm text-slate-400 font-medium">Use the left form or drag & drop an Excel file.</p>
                     </div>
                  ) : (
                     questions.map((q, idx) => (
                        <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-5 hover:shadow-md transition-shadow relative group">
                           <button onClick={() => handleDeleteQuestion(q.id)} className="absolute right-4 top-4 p-2 text-rose-300 hover:text-white hover:bg-rose-500 bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                              <Trash2 className="w-4 h-4" />
                           </button>
                           
                           <div className="pr-10">
                              <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider mb-2 block">Question {idx + 1}</span>
                              <h4 className="font-bold text-slate-800 leading-relaxed text-sm">{q.question_text}</h4>
                           </div>
                           
                           <div className="space-y-2">
                              {q.options.map((o, oIdx) => (
                                 <div key={oIdx} className={`p-3 rounded-xl border flex gap-3 text-sm transition-colors ${q.correct_option === oIdx ? 'bg-indigo-500/5 border-indigo-200 font-medium text-indigo-900' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                                    <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 font-bold text-[10px] border ${q.correct_option === oIdx ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white border-slate-300'}`}>
                                       {String.fromCharCode(65+oIdx)}
                                    </div>
                                    <span>{o}</span>
                                 </div>
                              ))}
                           </div>
                           {q.explanation && (
                              <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg flex gap-2"><CheckCircle className="w-4 h-4 shrink-0 text-emerald-500"/> {q.explanation}</p>
                           )}
                        </div>
                     ))
                  )}
               </div>
            </div>
         </div>

         {/* EXCEL PREVIEW MODAL */}
         <AnimatePresence>
            {isExcelPreviewOpen && parsedData && (
              <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setIsExcelPreviewOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm shadow-2xl" />
                
                <motion.div initial={{scale:0.95, y:20, opacity:0}} animate={{scale:1, y:0, opacity:1}} exit={{scale:0.95, y:20, opacity:0}} transition={{ duration: 0.15, ease: 'easeOut' }} className="bg-white max-w-5xl w-full h-[85vh] rounded-[2rem] flex flex-col overflow-hidden relative z-10 shadow-2xl">
                   <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                      <div>
                         <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2"><Upload className="w-6 h-6 text-indigo-500" /> Excel Validation Preview</h3>
                         <p className="text-sm font-medium text-slate-500 mt-1">Review the {parsedData.total} questions detected. Errant rows will be dropped on save.</p>
                      </div>
                      <div className="flex gap-4">
                         <div className="text-center px-4 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
                            <span className="block text-xl font-black text-emerald-600 leading-none">{parsedData.validCount}</span>
                            <span className="text-[10px] font-black uppercase text-emerald-600/70">Valid</span>
                         </div>
                         <div className="text-center px-4 py-1.5 bg-rose-50 rounded-xl border border-rose-100">
                            <span className="block text-xl font-black text-rose-600 leading-none">{parsedData.total - parsedData.validCount}</span>
                            <span className="text-[10px] font-black uppercase text-rose-600/70">Invalid</span>
                         </div>
                      </div>
                   </div>

                   <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar space-y-4">
                      {parsedData.rows.map(row => (
                         <div key={row._internal_id} className={`p-5 rounded-2xl border transition-all ${row.valid ? 'bg-white border-slate-200' : 'bg-rose-50 border-rose-200'}`}>
                            <div className="flex justify-between items-start mb-3">
                               <div className="flex items-center gap-3">
                                  <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-black">ROW {row.rowNum}</span>
                                  {!row.valid && <span className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-100/50 px-2.5 py-1 rounded-full"><AlertCircle className="w-3.5 h-3.5"/> {row.error_msg}</span>}
                               </div>
                               {row.valid && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                            </div>
                            
                            <h4 className={`font-bold text-sm mb-4 ${row.valid ? 'text-slate-800' : 'text-slate-600'}`}>{row.question_text || '(Empty Question)'}</h4>
                            
                            <div className="grid md:grid-cols-4 gap-2">
                               {row.options.map((opt, i) => (
                                  <div key={i} className={`p-2 rounded-lg border text-xs leading-relaxed truncate ${row.valid && row.correct_option === i ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                                     <span className="font-bold mr-1 opacity-50">{String.fromCharCode(65+i)}.</span> {opt}
                                  </div>
                               ))}
                            </div>
                         </div>
                      ))}
                   </div>

                   <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
                      <div className="flex gap-6">
                         <label className="flex items-center gap-2 text-sm font-bold text-slate-600 cursor-pointer select-none hover:text-indigo-600">
                           <input type="checkbox" className="w-4 h-4 rounded text-indigo-500 border-slate-300 focus:ring-indigo-500" checked={shuffleQuestions} onChange={e => setShuffleQuestions(e.target.checked)} />
                           Shuffle Questions
                         </label>
                         <label className="flex items-center gap-2 text-sm font-bold text-slate-600 cursor-pointer select-none hover:text-indigo-600">
                           <input type="checkbox" className="w-4 h-4 rounded text-indigo-500 border-slate-300 focus:ring-indigo-500" checked={shuffleOptions} onChange={e => setShuffleOptions(e.target.checked)} />
                           Shuffle Options inside Questions
                         </label>
                      </div>
                      
                      <div className="flex gap-3">
                         <button disabled={processing} onClick={() => setIsExcelPreviewOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
                         <button disabled={processing || parsedData.validCount === 0} onClick={handleSaveBulkUpload} className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-500 hover:bg-indigo-600 shadow-md flex items-center gap-2">
                            {processing ? <Loader2 className="animate-spin w-4 h-4" /> : `Save ${parsedData.validCount} Valid Questions`}
                         </button>
                      </div>
                   </div>
                </motion.div>
              </div>
            )}
         </AnimatePresence>
      </div>
    );
  }

  // EXAM OVERVIEW (Admin Dashboard Screenshot 1 integration)
  return (
    <div className="space-y-10 animate-fade-in pb-10">
      <div className="bg-white rounded-[24px] p-8 shadow-[0_4px_40px_rgb(0,0,0,0.03)] border border-slate-100 border-t-4 border-t-indigo-500 flex flex-col md:flex-row gap-8 items-center">
         <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
            <Plus className="text-indigo-500 w-6 h-6" strokeWidth={3}/>
         </div>
         <div className="flex-1 w-full flex flex-col gap-6 md:flex-row">
            <div className="flex-1">
               <h3 className="font-bold text-slate-800 text-xl tracking-tight mb-4 hidden md:block">Create New Exam</h3>
               <label className="text-[10px] uppercase font-black text-slate-400 mb-1.5 ml-2 block tracking-widest">Exam Title</label>
               <input className="input-premium w-full !bg-slate-50 !py-3.5 !rounded-2xl border-transparent hover:border-slate-200" placeholder="e.g. Advanced Data Structures Midterm" value={newExamTitle} onChange={e => setNewExamTitle(e.target.value)}/>
            </div>
            <div className="w-full md:w-48 xl:w-64">
               <h3 className="font-bold text-slate-800 text-xl tracking-tight mb-4 opacity-0 hidden md:block">Spacer</h3>
               <label className="text-[10px] uppercase font-black text-slate-400 mb-1.5 ml-2 block tracking-widest">Duration (Minutes)</label>
               <input className="input-premium w-full !bg-slate-50 !py-3.5 !rounded-2xl border-transparent hover:border-slate-200" type="number" placeholder="e.g. 60" value={newExamDuration} onChange={e => setNewExamDuration(e.target.value)}/>
            </div>
         </div>
         <button disabled={processing} onClick={handleCreateExam} className="bg-[#825dfa] hover:bg-[#6e4ade] text-white font-bold py-4 px-10 rounded-2xl shadow-xl shadow-purple-500/20 transition-all shrink-0 mt-auto flex items-center gap-2 self-stretch md:self-auto h-max">
            {processing && !newExamTitle ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Create Exam +'}
         </button>
      </div>

      <div>
        <div className="flex items-center gap-4 mb-6 ml-2">
           <h3 className="text-[26px] font-black text-slate-800 tracking-tight">All Exams</h3>
           <span className="px-4 py-1.5 bg-indigo-50/80 text-indigo-600 rounded-full text-xs font-bold ring-1 ring-indigo-500/20 shadow-sm">{exams.length} Total</span>
        </div>
        
        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>
        ) : exams.length === 0 ? (
           <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-100">
             <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
             <p className="text-slate-500 font-bold">No exams created yet.</p>
           </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
             {exams.map(exam => (
                <div key={exam.id} className="bg-white p-6 rounded-[24px] shadow-[0_4px_30px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col group hover:border-indigo-200 hover:shadow-lg transition-all">
                   <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center mb-5 text-white shadow-inner">
                      <FileText className="w-6 h-6" />
                   </div>
                   <h4 className="font-bold text-xl text-slate-900 mb-1.5 tracking-tight group-hover:text-indigo-600 transition-colors line-clamp-1">{exam.title}</h4>
                   <p className="text-slate-500 text-xs font-bold flex items-center gap-1.5 mb-8 bg-slate-50 w-max px-3 py-1.5 rounded-lg border border-slate-100">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> {exam.duration} Minutes Duration
                   </p>
                   <div className="mt-auto grid grid-cols-2 gap-3 pb-1">
                      <button onClick={() => handleSelectExam(exam)} className="bg-[#1e58f0] hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-[13px] transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 hover:-translate-y-0.5">
                         <Settings className="w-4 h-4"/> Manage Questions
                      </button>
                      <button onClick={() => handleDeleteExam(exam.id)} className="bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white font-bold py-3.5 rounded-xl text-[13px] transition-all flex items-center justify-center gap-1.5 group/delete">
                         <Trash2 className="w-4 h-4 group-hover/delete:scale-110 transition-transform"/> Delete
                      </button>
                   </div>
                </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageQuestions;
