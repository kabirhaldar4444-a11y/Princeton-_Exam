import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Phone, 
  MapPin, 
  Upload, 
  Camera, 
  ChevronDown, 
  ArrowRight, 
  Loader2,
  CheckCircle,
  Video,
  X,
  Image as ImageIcon,
  Search,
  PenTool
} from 'lucide-react';
import SignatureCanvas from '../../components/SignatureCanvas';
import DisclaimerOverlay from '../../components/DisclaimerOverlay';
import { useAlert } from '../../context/AlertProvider';
import { indianStatesAndCities } from '../../utils/indiaLocationData';
import PMISLogo from '../../components/common/PMISLogo';
import { KYC_LEGAL_ACKNOWLEDGEMENT, GLOBAL_POLICIES_DECLARATION } from '../../utils/legalText';

// --- SEARCHABLE DROPDOWN COMPONENT ---
const SearchableDropdown = ({ value, onChange, options, placeholder, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  const filtered = (options || []).filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        className={`input-premium w-full flex items-center justify-between cursor-pointer transition-all duration-200 ${disabled ? 'opacity-50 pointer-events-none bg-slate-50' : 'bg-white hover:border-primary-500/50 focus-within:ring-2 focus-within:ring-primary-500/50'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={`truncate mr-2 ${value ? 'text-slate-900 text-sm' : 'text-slate-400 text-[11px]'}`}>{value || placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-2 border-b border-slate-100 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400 ml-2" />
              <input 
                autoFocus
                placeholder="Search..." 
                className="w-full text-sm outline-none py-1"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <ul className="max-h-60 overflow-y-auto w-full p-2">
              {filtered.length > 0 ? filtered.map(opt => (
                <li 
                  key={opt} 
                  className="px-4 py-2 hover:bg-primary-500/5 hover:text-primary-600 rounded-xl cursor-pointer text-sm font-medium transition-colors"
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  {opt}
                </li>
              )) : (
                <li className="p-4 text-center text-sm text-slate-400">No results found</li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- WEBRTC CAMERA MODAL COMPONENT ---
const CameraModal = ({ isOpen, onClose, onCapture }) => {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        .then(mediaStream => {
          setStream(mediaStream);
          if (videoRef.current) videoRef.current.srcObject = mediaStream;
          setError('');
        })
        .catch(err => setError('Camera access denied or unavailable. Please enable permissions.'));
    } else {
      if (stream) stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
  }, [isOpen]);

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, 400, 400);
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `live_capture_${Date.now()}.png`, { type: 'image/png' });
          onCapture(file);
          onClose();
        }
      }, 'image/png', 0.85);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl max-w-sm w-full relative"
          >
            <button onClick={onClose} className="absolute top-6 right-6 z-10 w-10 h-10 bg-black/5 hover:bg-black/10 text-slate-800 rounded-full flex items-center justify-center transition-all">
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 text-center border-b border-slate-100">
              <h3 className="font-outfit font-black text-2xl text-slate-900">Identity Scan</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Align your face in the center</p>
            </div>

            <div className="bg-slate-900 aspect-square relative flex items-center justify-center overflow-hidden">
               {error ? (
                 <p className="text-amber-500 text-sm px-8 text-center font-medium">{error}</p>
               ) : (
                 <>
                   <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                   <div className="absolute inset-0 border-[3px] border-white/20 rounded-full m-10 pointer-events-none" />
                   <canvas ref={canvasRef} width="400" height="400" className="hidden" />
                 </>
               )}
            </div>

            <div className="p-8 bg-slate-50/80">
               <button 
                 onClick={captureFrame} disabled={!!error}
                 className="w-full btn-premium !py-5 !rounded-2xl transition-all shadow-xl shadow-primary-500/20"
               >
                  Verify Identity
               </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- MAIN COMPONENT ---
const CompleteProfile = () => {
  const { user, profile } = useAuth();
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    phone: '',
    state: '',
    city: '',
    addressLine: '',
    pincode: '',
    ipAddress: ''
  });

  const [files, setFiles] = useState({
    photo: null,
    aadhaarFront: null,
    aadhaarBack: null,
    panCard: null,
    signature: null
  });

  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // 0. Modern Background IP Detection (Automatic)
  useEffect(() => {
    const fetchIP = async () => {
      try {
        // Try Cloudflare first (extremely reliable)
        const res = await fetch('https://www.cloudflare.com/cdn-cgi/trace');
        const text = await res.text();
        const ipMatch = text.match(/ip=([\d.]+)/);
        if (ipMatch && ipMatch[1]) {
          setFormData(prev => ({ ...prev, ipAddress: ipMatch[1] }));
          return;
        }
        // Fallback to ipify
        const res2 = await fetch('https://api.ipify.org?format=json');
        const data2 = await res2.json();
        if (data2.ip) setFormData(prev => ({ ...prev, ipAddress: data2.ip }));
      } catch (err) {
        console.warn('Silent IP detection failed:', err);
      }
    };
    fetchIP();
  }, []);

  // 1. PIN Code -> State/City (Auto-fill)
  useEffect(() => {
    if (formData.pincode.length === 6) {
      fetch(`https://api.postalpincode.in/pincode/${formData.pincode}`)
        .then(res => res.json())
        .then(data => {
          if (data && data[0] && data[0].Status === 'Success') {
            const postOffice = data[0].PostOffice[0];
            const detectedState = postOffice.State;
            const detectedCity = postOffice.District || postOffice.Region;

            // Robust matching: Normalize both to compare (handle "&" vs "and", spaces, case)
            const normalize = s => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
            const normalizedDetected = normalize(detectedState);
            
            const stateKey = Object.keys(indianStatesAndCities).find(s => 
              normalize(s) === normalizedDetected
            );

            setFormData(prev => ({
              ...prev,
              state: stateKey || detectedState,
              city: detectedCity
            }));
            
            if (stateKey) {
              showAlert('Location detected from PIN Code', 'success');
            } else {
              showAlert(`Detected ${detectedState}. Please verify your selection.`, 'warning');
            }
          }
        })
        .catch(err => console.warn('Pincode fetch error:', err));
    }
  }, [formData.pincode]);

  // 2. City/State -> PIN Code (Bi-directional Smart Detection)
  useEffect(() => {
    // Only attempt if city is selected and pincode is empty or invalid
    if (formData.city && formData.state && (!formData.pincode || formData.pincode.length < 6)) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        fetch(`https://api.postalpincode.in/postoffice/${formData.city}`, { signal: controller.signal })
          .then(res => res.json())
          .then(data => {
            if (data && data[0] && data[0].Status === 'Success') {
              const matched = data[0].PostOffice.find(po => po.State.toLowerCase() === formData.state.toLowerCase()) || data[0].PostOffice[0];
              if (matched && matched.Pincode) {
                setFormData(prev => ({ ...prev, pincode: matched.Pincode }));
                showAlert(`Suggested PIN for ${formData.city}`, 'success');
              }
            }
          })
          .catch(err => {
            if (err.name !== 'AbortError') console.warn('City PIN fetch error:', err);
          });
      }, 800); // Debounce to avoid excessive API calls

      return () => {
        clearTimeout(timeoutId);
        controller.abort();
      };
    }
  }, [formData.city, formData.state]);

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    
    const tryDetect = async (url) => {
      const res = await fetch(url);
      const data = await res.json();
      if (data.error || data.status === 'fail') throw new Error(data.reason || data.message || 'API Fail');
      return data;
    };

    try {
      // Primary: ipapi.co
      try {
        const data = await tryDetect('https://ipapi.co/json/');
        setFormData(prev => ({
          ...prev,
          ipAddress: data.ip,
          pincode: data.postal || prev.pincode,
          state: data.region || prev.state,
          city: data.city || prev.city
        }));
        return; // Success
      } catch (e) {
        console.warn('Primary IP API failed, trying fallback...', e);
      }

      // Fallback: ipwho.is
      const fbData = await tryDetect('https://ipwho.is/');
      setFormData(prev => ({
        ...prev,
        ipAddress: fbData.ip,
        pincode: fbData.postal || prev.pincode,
        state: fbData.region || prev.state,
        city: fbData.city || prev.city
      }));
      
    } catch (err) {
      console.error('All Location APIs failed:', err);
      showAlert('Location detection failed. Please enter details manually.', 'error');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleFileUpload = async (file, bucketPath, bucketName = 'aadhaar_cards') => {
    if (!file) return null;
    const fileExt = file.name ? file.name.split('.').pop() : (file.type ? file.type.split('/')[1] : 'png');
    const fileName = `${user.id}/${bucketPath}_${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage.from(bucketName).upload(fileName, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(fileName);
    return publicUrl;
  };

  // --- WEB3FORMS EMAIL NOTIFICATION ---
  const sendEmailNotification = async ({ fullName, email, phone, fullAddress, ipAddress, photoUrl, frontUrl, backUrl, panUrl, signatureUrl }) => {
    try {
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: import.meta.env.VITE_WEB3FORMS_KEY || '4c65807a-e5d0-46e0-9cbd-70d264618cf1',
          subject: `NEW REGISTRATION: ${email}`,
          from_name: 'Princeton Exam Portal',
          message: `
NEW CANDIDATE KYC SUBMITTED
============================
Name     : ${fullName}
Email    : ${email}
Residence Address : ${fullAddress}
IP Address: ${ipAddress || 'Not Detected'}

UPLOADED DOCUMENTS
------------------
Profile Photo   : ${photoUrl || 'N/A'}
Aadhaar Front   : ${frontUrl || 'N/A'}
Aadhaar Back    : ${backUrl  || 'N/A'}
PAN Card        : ${panUrl   || 'N/A'}
Signature       : ${signatureUrl || 'N/A'}

=== LEGAL & POLICY ACCEPTANCE ===
[X] ${fullName} actively checked and agreed to the following terms and policies during KYC submission from IP Address: ${ipAddress || 'Not Detected'}

---------------------------------
[PART 1] KYC LEGAL ACKNOWLEDGEMENT
---------------------------------
${KYC_LEGAL_ACKNOWLEDGEMENT.trim()}

---------------------------------
✅ ${fullName} has accepted Our LEGAL ACKNOWLEDGEMENT
---------------------------------

---------------------------------
[PART 2] MASTER PORTAL DECLARATION
---------------------------------
${GLOBAL_POLICIES_DECLARATION.trim()}

---------------------------------
✅ ${fullName} has accepted Our MASTER PORTAL DECLARATION
---------------------------------
          `.trim(),
        }),
      });
      console.log('KYC Notification sent to Web3Forms successfully');
    } catch (err) {
      console.error('Web3Forms Notification Error:', err);
      // Silent fail — registration is already complete
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      showAlert('Invalid Mobile Number. Must be 10 digits.', 'error');
      return;
    }
    if (!files.photo || !files.signature || !files.aadhaarFront || !files.aadhaarBack || !files.panCard) {
      showAlert('Please provide all required documents, PAN card, and signature.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const [photoUrl, frontUrl, backUrl, panUrl, signatureUrl] = await Promise.all([
        handleFileUpload(files.photo, 'photo', 'candidate_documents'),
        handleFileUpload(files.aadhaarFront, 'aadhaar_front', 'aadhaar_cards'),
        handleFileUpload(files.aadhaarBack, 'aadhaar_back', 'aadhaar_cards'),
        handleFileUpload(files.panCard, 'pan_card', 'candidate_documents'),
        handleFileUpload(files.signature, 'signature', 'candidate_documents')
      ]);

      const fullAddress = `${formData.addressLine ? formData.addressLine + ', ' : ''}${formData.city}, ${formData.state} - ${formData.pincode}`;
      const { error } = await supabase.from('profiles').update({
        phone: formData.phone,
        address: fullAddress,
        profile_photo_url: photoUrl,
        aadhaar_front_url: frontUrl,
        aadhaar_back_url: backUrl,
        pan_card_url: panUrl,
        signature_url: signatureUrl,
        profile_completed: true
      }).eq('id', user.id);

      if (error) throw error;

      // Fire email notification (non-blocking)
      sendEmailNotification({
        fullName: formData.fullName,
        email: user?.email || '',
        phone: formData.phone,
        fullAddress,
        ipAddress: formData.ipAddress,
        photoUrl,
        frontUrl,
        backUrl,
        panUrl,
        signatureUrl,
      });

      showAlert('Registration completed! Redirecting...', 'success');
      setTimeout(() => { window.location.href = '/'; }, 1500);
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DisclaimerOverlay user={user} profile={profile} />
      <CameraModal isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onCapture={(file) => setFiles({...files, photo: file})} />

      <div className="py-10 px-6 flex flex-col items-center justify-start bg-slate-50/50">

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="glass-card-saas max-w-2xl w-full p-8 md:p-14 my-10 relative z-10"
        >
          <header className="text-center mb-12 flex flex-col items-center">
            <div className="mb-4">
              <PMISLogo size={80} />
            </div>
            <h1 className="text-4xl font-outfit font-black text-slate-900 mb-2">KYC Form</h1>
            <p className="text-slate-500 font-medium">Complete your profile to access your assigned exams.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-10">

            {/* DETECT LOCATION BUTTON */}
            <div className="flex justify-end w-full mb-[-1.5rem] relative z-20">
              <button 
                type="button" 
                onClick={handleDetectLocation}
                disabled={isDetectingLocation}
                title="Detect IP & Location"
                className="group bg-white border border-emerald-200 text-emerald-600 hover:bg-gradient-to-r hover:from-emerald-400 hover:to-emerald-500 hover:border-transparent hover:text-white text-[11px] font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm hover:shadow-md hover:shadow-emerald-500/30 active:scale-95"
              >
                {isDetectingLocation ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5 transition-colors group-hover:text-white text-emerald-500" />}
                Detect Location
              </button>
            </div>

            {/* MANDATORY LIVE PHOTO CAPTURE */}
            <div className="flex flex-col items-center gap-6 group">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Identity Verification (Live Photo) *</label>
              <div className="relative">
                <div className={`w-40 h-40 rounded-full border-4 flex flex-col items-center justify-center transition-all bg-white ${files.photo ? 'border-primary-500 shadow-2xl' : 'border-slate-100 shadow-inner'}`}>
                  {files.photo ? (
                    <img src={URL.createObjectURL(files.photo)} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <Camera className="w-10 h-10 text-slate-300" />
                  )}
                  <button type="button" onClick={() => setIsCameraOpen(true)} className="absolute -bottom-2 right-0 w-12 h-12 rounded-2xl flex items-center justify-center bg-primary-500 text-white shadow-xl hover:scale-110 transition-all">
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Registered Email</label>
                <input type="email" className="input-premium w-full bg-slate-50 text-slate-500 cursor-not-allowed" value={user?.email || ''} disabled />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Phone Number *</label>
                <div className="relative">
                  <input 
                    type="tel" 
                    maxLength={10}
                    className="input-premium w-full !pl-[90px]" 
                    placeholder="9876543210" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
                  />
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <span className="text-slate-500 font-bold text-sm tracking-wide border-r border-slate-200/80 pr-3 h-6 flex items-center">IN +91</span>
                  </div>
                </div>
              </div>
            </div>

            {/* COMPACT LOCATION DETECTION */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">PIN Code *</label>
                <input 
                  type="text" 
                  maxLength={6} 
                  className="input-premium w-full focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all" 
                  placeholder="e.g. 110001" 
                  value={formData.pincode} 
                  onChange={e => setFormData({...formData, pincode: e.target.value.replace(/\D/g, '')})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">State / UT *</label>
                <SearchableDropdown value={formData.state} onChange={val => setFormData({...formData, state: val, city: ''})} options={Object.keys(indianStatesAndCities)} placeholder="Search State..." />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">City *</label>
                <SearchableDropdown value={formData.city} onChange={val => setFormData({...formData, city: val})} options={formData.state ? indianStatesAndCities[formData.state] : []} placeholder={formData.state ? "Select City..." : "Select State First"} disabled={!formData.state} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Identity Documents (Aadhaar & PAN) *</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                 <div className="relative group h-[140px]">
                    <input type="file" accept="image/*" onChange={e => setFiles({...files, aadhaarFront: e.target.files[0]})} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <div className={`w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl text-center group-hover:border-primary-500 transition-all bg-white shadow-sm overflow-hidden ${files.aadhaarFront ? 'p-2' : 'p-6'}`}>
                       {files.aadhaarFront ? (
                         <div className="relative w-full h-full">
                           <img src={URL.createObjectURL(files.aadhaarFront)} className="w-full h-full object-cover rounded-2xl" alt="Aadhaar Front Preview" />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white rounded-2xl transition-all duration-200">
                             <Upload className="w-5 h-5 mb-1" />
                             <span className="text-[9px] font-black uppercase tracking-wider">Change Front</span>
                           </div>
                         </div>
                       ) : (
                         <>
                           <ImageIcon className="mx-auto w-6 h-6 text-slate-400 mb-2 group-hover:scale-110 transition-transform" />
                           <span className="text-[10px] font-bold text-slate-500 uppercase">Aadhaar Front</span>
                         </>
                       )}
                    </div>
                 </div>
                 <div className="relative group h-[140px]">
                    <input type="file" accept="image/*" onChange={e => setFiles({...files, aadhaarBack: e.target.files[0]})} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <div className={`w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl text-center group-hover:border-primary-500 transition-all bg-white shadow-sm overflow-hidden ${files.aadhaarBack ? 'p-2' : 'p-6'}`}>
                       {files.aadhaarBack ? (
                         <div className="relative w-full h-full">
                           <img src={URL.createObjectURL(files.aadhaarBack)} className="w-full h-full object-cover rounded-2xl" alt="Aadhaar Back Preview" />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white rounded-2xl transition-all duration-200">
                             <Upload className="w-5 h-5 mb-1" />
                             <span className="text-[9px] font-black uppercase tracking-wider">Change Back</span>
                           </div>
                         </div>
                       ) : (
                         <>
                           <ImageIcon className="mx-auto w-6 h-6 text-slate-400 mb-2 group-hover:scale-110 transition-transform" />
                           <span className="text-[10px] font-bold text-slate-500 uppercase">Aadhaar Back</span>
                         </>
                       )}
                    </div>
                 </div>
                 <div className="relative group h-[140px]">
                    <input type="file" accept="image/*" onChange={e => setFiles({...files, panCard: e.target.files[0]})} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <div className={`w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl text-center group-hover:border-primary-500 transition-all bg-white shadow-sm overflow-hidden ${files.panCard ? 'p-2' : 'p-6'}`}>
                       {files.panCard ? (
                         <div className="relative w-full h-full">
                           <img src={URL.createObjectURL(files.panCard)} className="w-full h-full object-cover rounded-2xl" alt="PAN Card Preview" />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white rounded-2xl transition-all duration-200">
                             <Upload className="w-5 h-5 mb-1" />
                             <span className="text-[9px] font-black uppercase tracking-wider">Change PAN</span>
                           </div>
                         </div>
                       ) : (
                         <>
                           <ImageIcon className="mx-auto w-6 h-6 text-slate-400 mb-2 group-hover:scale-110 transition-transform" />
                           <span className="text-[10px] font-bold text-slate-500 uppercase">PAN Card</span>
                         </>
                       )}
                    </div>
                 </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Digital Signature *</label>
              <div className="bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-100 h-[280px]">
                <SignatureCanvas onCapture={(blob) => setFiles({ ...files, signature: blob })} />
              </div>
            </div>

            {/* LEGAL ACKNOWLEDGEMENT */}
            <div className="bg-slate-50 rounded-3xl p-6 md:p-8 border border-slate-200/60">
               <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6 flex items-center gap-2">
                 <CheckCircle className="w-5 h-5 text-primary-500" /> Legal Acknowledgement
               </h3>
               
               <div className="space-y-6 text-sm text-slate-600 font-medium leading-relaxed max-h-60 overflow-y-auto pr-4 custom-scrollbar mb-6">
                 <div>
                   <h4 className="font-bold text-slate-900 mb-1">1. Identity Verification and Authentication</h4>
                   <p>To ensure the integrity of the examination process and to prevent proxy attendance, the Candidate hereby authorizes the Portal to capture a live photograph (selfie) at the commencement of and/or during the examination. This image will be used solely to authenticate the Candidate's identity against registered records. Failure to provide a clear image or any attempt to bypass this authentication may result in immediate disqualification.</p>
                 </div>
                 
                 <div>
                   <h4 className="font-bold text-slate-900 mb-1">2. Purpose of Certification and Employment Disclaimer</h4>
                   <p>The Candidate acknowledges and agrees that this certification is intended solely for personal and professional growth.</p>
                   <ul className="list-disc pl-5 mt-2 space-y-1">
                     <li><strong>No Guarantee of Employment:</strong> Successful completion of the exam and issuance of a certificate does not guarantee a job offer, placement, or any form of employment.</li>
                     <li><strong>No Guarantee of Financial Increase:</strong> This certification does not entitle the Candidate to a salary hike, promotion, or bonus from any current or future employer.</li>
                   </ul>
                   <p className="mt-2">The Portal and its affiliates are not liable for any career expectations not met following the attainment of this certification.</p>
                 </div>

                 <div>
                   <h4 className="font-bold text-slate-900 mb-1">3. Academic Integrity</h4>
                   <p>The Candidate agrees to complete the examination independently without the use of unauthorized materials, AI tools, or external assistance. Any detected malpractice will lead to the permanent banning of the Candidate's profile and the nullification of any previous results.</p>
                 </div>

                 <div>
                   <h4 className="font-bold text-slate-900 mb-1">4. Limitation of Liability</h4>
                   <p>The Portal shall not be held responsible for technical failures on the Candidate's end, including but not limited to internet connectivity issues, hardware malfunctions, or power outages during the examination session.</p>
                 </div>
               </div>

               <label className="flex items-start gap-4 cursor-pointer group bg-white p-4 rounded-2xl border border-slate-200 hover:border-primary-500 transition-all shadow-sm">
                 <div className="relative flex items-center justify-center mt-0.5">
                   <input 
                     type="checkbox" 
                     className="peer sr-only"
                     checked={termsAccepted}
                     onChange={(e) => setTermsAccepted(e.target.checked)}
                   />
                   <div className="w-6 h-6 rounded-lg border-2 border-slate-300 peer-checked:bg-primary-500 peer-checked:border-primary-500 transition-all flex items-center justify-center group-hover:border-primary-400">
                     <CheckCircle className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity scale-50 peer-checked:scale-100" />
                   </div>
                 </div>
                 <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors select-none">
                   I have read, understood, and agree to follow all the legal terms and academic integrity policies mentioned above.
                 </span>
               </label>
            </div>

            <AnimatePresence>
              {termsAccepted && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -20 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <button type="submit" disabled={loading} className="w-full btn-premium !py-5 !text-lg !rounded-2xl shadow-2xl flex items-center justify-center gap-3">
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Complete Registration <ArrowRight className="w-5 h-5" /></>}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.div>
      </div>
    </>
  );
};

export default CompleteProfile;
