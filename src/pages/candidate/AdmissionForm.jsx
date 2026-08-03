import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Upload,
  Camera,
  Video,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle,
  CheckCircle2,
  X,
  Image as ImageIcon,
  Search,
  BookOpen,
  RefreshCw,
  Play,
  Square,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import SignatureCanvas from '../../components/SignatureCanvas';
import { useAlert } from '../../context/AlertProvider';
import { indianStatesAndCities } from '../../utils/indiaLocationData';
import PMISLogo from '../../components/common/PMISLogo';

// --- SEARCHABLE DROPDOWN COMPONENT (Matching CompleteProfile.jsx) ---
const SearchableDropdown = ({ value, onChange, options, placeholder, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  const filtered = (options || []).filter((opt) => opt.toLowerCase().includes(search.toLowerCase()));

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
        className={`input-premium w-full flex items-center justify-between cursor-pointer transition-all duration-200 ${
          disabled ? 'opacity-50 pointer-events-none bg-slate-50' : 'bg-white hover:border-primary-500/50 focus-within:ring-2 focus-within:ring-primary-500/50'
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={`truncate mr-2 ${value ? 'text-slate-900 text-sm font-medium' : 'text-slate-400 text-[11px]'}`}>
          {value || placeholder}
        </span>
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
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <ul className="max-h-60 overflow-y-auto w-full p-2">
              {filtered.length > 0 ? (
                filtered.map((opt) => (
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
                ))
              ) : (
                <li className="p-4 text-center text-sm text-slate-400">No results found</li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- MAIN ADMISSION FORM COMPONENT ---
const AdmissionForm = () => {
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // Step 1: Personal & Course, Step 2: Identity Verification
  const [loading, setLoading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isLocationDetected, setIsLocationDetected] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Success state
  const [submitted, setSubmitted] = useState(false);
  const [admissionId, setAdmissionId] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    courseName: '',
    pincode: '',
    state: '',
    city: '',
    addressLine: '',
    ipAddress: ''
  });

  // Uploaded Files
  const [files, setFiles] = useState({
    aadhaarFront: null,
    aadhaarBack: null,
    panCard: null,
    signature: null
  });

  // Livestream Camera & Video Statement State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordTimer, setRecordTimer] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [profileSnapshotBlob, setProfileSnapshotBlob] = useState(null);
  const [scriptLanguage, setScriptLanguage] = useState('en'); // 'en' | 'hi'

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  // Multi-provider silent IP fetcher
  const fetchClientIP = async () => {
    try {
      const res = await fetch('https://www.cloudflare.com/cdn-cgi/trace');
      const text = await res.text();
      const match = text.match(/ip=([\d.]+)/);
      if (match && match[1]) return match[1];
    } catch (e) {}

    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      if (data && data.ip) return data.ip;
    } catch (e) {}

    try {
      const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
      const data = await res.json();
      if (data && data.ip) return data.ip;
    } catch (e) {}

    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      if (data && data.ip) return data.ip;
    } catch (e) {}

    return null;
  };

  // Auto fetch IP address on component mount
  useEffect(() => {
    const fetchIP = async () => {
      const detectedIp = await fetchClientIP();
      if (detectedIp) {
        setFormData((prev) => ({ ...prev, ipAddress: detectedIp }));
      }
    };
    fetchIP();
  }, []);

  // PIN Code -> Auto-detect State & City
  useEffect(() => {
    if (formData.pincode.length === 6) {
      fetch(`https://api.postalpincode.in/pincode/${formData.pincode}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data[0] && data[0].Status === 'Success') {
            const postOffice = data[0].PostOffice[0];
            const detectedState = postOffice.State;
            const detectedCity = postOffice.District || postOffice.Region;

            const normalize = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
            const normalizedDetected = normalize(detectedState);

            const stateKey = Object.keys(indianStatesAndCities).find(
              (s) => normalize(s) === normalizedDetected
            );

            setFormData((prev) => ({
              ...prev,
              state: stateKey || detectedState,
              city: detectedCity
            }));

            setIsLocationDetected(true);
            if (stateKey) {
              showAlert('Location detected from PIN Code', 'success');
            }
          }
        })
        .catch((err) => console.warn('Pincode fetch error:', err));
    }
  }, [formData.pincode]);

  // Reverse Geocoding / Location Detector Handler
  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    // Also trigger IP fetch in background
    fetchClientIP().then((ip) => {
      if (ip) setFormData((prev) => ({ ...prev, ipAddress: ip }));
    });

    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const { latitude, longitude } = pos.coords;
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
              );
              const data = await res.json();
              if (data && data.address) {
                const addr = data.address;
                const detectedState = addr.state || '';
                const detectedCity = addr.city || addr.town || addr.district || addr.county || '';
                const detectedPincode = addr.postcode ? addr.postcode.replace(/\D/g, '').slice(0, 6) : '';

                const normalize = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
                const stateKey = Object.keys(indianStatesAndCities).find(
                  (s) => normalize(s) === normalize(detectedState)
                );

                setFormData((prev) => ({
                  ...prev,
                  state: stateKey || detectedState,
                  city: detectedCity,
                  pincode: detectedPincode || prev.pincode
                }));
                setIsLocationDetected(true);
                showAlert('Location auto-detected via GPS!', 'success');
              }
            } catch (err) {
              console.warn('GPS reverse geo error:', err);
              fallbackIPGeo();
            } finally {
              setIsDetectingLocation(false);
            }
          },
          () => {
            fallbackIPGeo();
          },
          { timeout: 8000 }
        );
      } else {
        fallbackIPGeo();
      }
    } catch (err) {
      fallbackIPGeo();
    }
  };

  const fallbackIPGeo = async () => {
    try {
      const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
      const data = await res.json();
      if (data) {
        const detectedState = data.region || '';
        const detectedCity = data.city || '';
        const normalize = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
        const stateKey = Object.keys(indianStatesAndCities).find(
          (s) => normalize(s) === normalize(detectedState)
        );

        setFormData((prev) => ({
          ...prev,
          state: stateKey || detectedState,
          city: detectedCity,
          ipAddress: data.ip || prev.ipAddress
        }));
        setIsLocationDetected(true);
        showAlert('Location estimated via IP Geolocation', 'info');
      }
    } catch (err) {
      showAlert('Unable to detect location automatically. Please enter PIN Code to detect location.', 'warning');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Bind video stream to videoRef element
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraActive, cameraStream]);

  // Clean up camera stream
  useEffect(() => {
    return () => {
      stopCamera();
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    };
  }, []);

  // Live recording timer counter
  useEffect(() => {
    if (recording) {
      setRecordTimer(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [recording]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true
      });
      setCameraStream(stream);
      setCameraActive(true);
    } catch (err) {
      console.error('Camera access denied:', err);
      showAlert('Unable to access camera & microphone. Please enable permissions.', 'error');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  const startRecording = () => {
    if (!cameraStream) return;
    recordedChunksRef.current = [];
    try {
      const options = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? { mimeType: 'video/webm;codecs=vp9' }
        : MediaRecorder.isTypeSupported('video/webm')
        ? { mimeType: 'video/webm' }
        : {};

      const mediaRecorder = new MediaRecorder(cameraStream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setVideoPreviewUrl(url);
        captureSnapshotFrame();
      };

      mediaRecorder.start(100);
      setRecording(true);
    } catch (err) {
      console.error('Error starting MediaRecorder:', err);
      showAlert('Video recorder failed to start on this device.', 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const reRecordVideo = () => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl(null);
    setRecordedBlob(null);
    setProfileSnapshotBlob(null);
    if (!cameraActive) startCamera();
  };

  const captureSnapshotFrame = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) setProfileSnapshotBlob(blob);
      }, 'image/png');
    }
  };

  // Validate Step 1 and proceed to Step 2
  const handleProceedToStep2 = () => {
    if (!formData.fullName.trim()) {
      showAlert('Please enter your Full Name.', 'warning');
      return;
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      showAlert('Please enter a valid Email Address.', 'warning');
      return;
    }

    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      showAlert('Please enter a valid 10-digit Indian Mobile Number.', 'error');
      return;
    }

    if (!formData.courseName.trim()) {
      showAlert('Please enter your Applying Course Name.', 'warning');
      return;
    }

    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Upload File Helper
  const handleFileUpload = async (fileOrBlob, bucketPath, bucketName = 'candidate_documents') => {
    if (!fileOrBlob) return null;
    const fileExt = fileOrBlob.name ? fileOrBlob.name.split('.').pop() : 'jpg';
    const fileName = `admission_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { data, error } = await supabase.storage.from(bucketName).upload(fileName, fileOrBlob, { upsert: true });
    if (error) throw error;
    const {
      data: { publicUrl }
    } = supabase.storage.from(bucketName).getPublicUrl(fileName);
    return publicUrl;
  };

  // --- WEB3FORMS EMAIL NOTIFICATION ---
  const sendWeb3FormsNotification = async ({
    fullName,
    email,
    phone,
    courseName,
    pincode,
    state,
    city,
    addressLine,
    ipAddress,
    videoUrl,
    frontUrl,
    backUrl,
    panUrl,
    signatureUrl
  }) => {
    try {
      const locationStr = [city, state].filter(Boolean).join(', ');
      const formattedPhone = phone.startsWith('+91') ? phone : `+91 ${phone.replace(/\D/g, '')}`;

      const messageContent = `
----------------------------------------
ADMISSION VERIFICATION REPORT
----------------------------------------

CANDIDATE INFORMATION:
----------------------
• Full Name: ${fullName}
• Email ID: ${email}
• Phone: ${formattedPhone}
• Course Name: ${courseName}
• PIN Code: ${pincode}
• Location: ${locationStr || 'N/A'}
• Residential Address: ${addressLine}
• IP Address: ${ipAddress || 'Not Detected'}

VERIFICATION DOCUMENTS & MEDIA:
-------------------------------
• Live Video Statement:
${videoUrl || 'N/A'}

• Aadhaar Card (Front):
${frontUrl || 'N/A'}

• Aadhaar Card (Back):
${backUrl || 'N/A'}

• PAN Card:
${panUrl || 'N/A'}

• Digital Signature:
${signatureUrl || 'N/A'}

By proceeding, the candidate electronically signs and agrees to all terms above.
----------------------------------------

Submitted via Princeton Professionals Exam Portal
`.trim();

      const accessKey =
        import.meta.env.VITE_WEB3FORMS_KEY ||
        import.meta.env.VITE_WEB3FORMS_ACCESS_KEY ||
        '4c65807a-e5d0-46e0-9cbd-70d264618cf1';

      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: accessKey,
          subject: `Admission Form Submitted — ${fullName}`,
          from_name: 'Princeton Exam Portal',
          email: email,
          message: messageContent
        })
      });
      console.log('Admission Web3Forms email notification sent successfully.');
    } catch (err) {
      console.error('Web3Forms notification error:', err);
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLocationDetected) {
      showAlert('Detecting location is compulsory. Please click the "Detect Location *" button or enter PIN Code to detect location.', 'warning');
      return;
    }

    if (!formData.pincode.trim() || !formData.state || !formData.city || !formData.addressLine.trim()) {
      showAlert('Please complete all address fields (PIN Code, State, City, Residential Address).', 'warning');
      return;
    }

    if (!recordedBlob) {
      showAlert('Please record your live video verification statement.', 'warning');
      return;
    }

    if (!files.aadhaarFront || !files.aadhaarBack) {
      showAlert('Please upload both Aadhaar Front and Back document images.', 'warning');
      return;
    }

    if (!files.signature) {
      showAlert('Please provide your digital signature.', 'warning');
      return;
    }

    setLoading(true);

    try {
      // Ensure real IP address is resolved
      let activeIp = formData.ipAddress;
      if (!activeIp || activeIp === '0.0.0.0' || activeIp === 'Not Detected') {
        activeIp = (await fetchClientIP()) || 'Not Detected';
        if (activeIp !== 'Not Detected') {
          setFormData((prev) => ({ ...prev, ipAddress: activeIp }));
        }
      }

      const [frontUrl, backUrl, panUrl, signatureUrl, videoUrl, photoUrl] = await Promise.all([
        handleFileUpload(files.aadhaarFront, 'aadhaar_front', 'aadhaar_cards'),
        handleFileUpload(files.aadhaarBack, 'aadhaar_back', 'aadhaar_cards'),
        files.panCard ? handleFileUpload(files.panCard, 'pan_card', 'candidate_documents') : null,
        handleFileUpload(files.signature, 'signature', 'candidate_documents'),
        handleFileUpload(recordedBlob, 'video_statement', 'candidate_documents'),
        profileSnapshotBlob ? handleFileUpload(profileSnapshotBlob, 'profile_photo', 'candidate_documents') : null
      ]);

      const fullAddress = `${formData.addressLine ? formData.addressLine + ', ' : ''}${formData.city ? formData.city + ', ' : ''}${formData.state ? formData.state + ' - ' : ''}${formData.pincode}`;

      const newAdmissionId = crypto.randomUUID();

      const { error } = await supabase
        .from('admissions')
        .insert({
          id: newAdmissionId,
          full_name: formData.fullName.trim(),
          email: formData.email.toLowerCase().trim(),
          phone: formData.phone.replace(/\D/g, ''),
          course_name: formData.courseName.trim(),
          address: fullAddress.trim(),
          aadhaar_front_url: frontUrl,
          aadhaar_back_url: backUrl,
          pan_url: panUrl,
          signature_url: signatureUrl,
          profile_photo_url: photoUrl,
          video_url: videoUrl,
          ip_address: activeIp || '0.0.0.0',
          status: 'pending'
        });

      if (error) throw error;

      // Send Web3Forms Email Notification
      sendWeb3FormsNotification({
        fullName: formData.fullName.trim(),
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone,
        courseName: formData.courseName.trim(),
        pincode: formData.pincode,
        state: formData.state,
        city: formData.city,
        addressLine: formData.addressLine,
        ipAddress: activeIp || '0.0.0.0',
        videoUrl,
        frontUrl,
        backUrl,
        panUrl,
        signatureUrl
      });

      stopCamera();
      setAdmissionId(newAdmissionId);
      setSubmitted(true);
      showAlert('Admission application submitted successfully!', 'success');
    } catch (err) {
      console.error('Admission submit error:', err);
      showAlert(err.message || 'Failed to submit admission application.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="py-10 px-6 flex flex-col items-center justify-start bg-slate-50/50 min-h-screen">
      {/* SUCCESS CONFIRMATION VIEW */}
      {submitted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="glass-card-saas max-w-lg w-full p-8 md:p-12 my-10 text-center relative z-10"
        >
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-200 shadow-xl">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-3xl font-outfit font-black text-slate-900 mb-2">Application Submitted!</h2>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            Thank you, <span className="font-bold text-slate-900">{formData.fullName}</span>. Your online admission application and video verification statement have been submitted for review.
          </p>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-left text-xs space-y-2.5 mb-8">
            <div className="flex justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-400">Application Reference ID:</span>
              <span className="font-mono text-primary-600 font-bold">{admissionId}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-400">Candidate Name:</span>
              <span className="font-bold text-slate-900">{formData.fullName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-400">Email Address:</span>
              <span className="font-bold text-slate-900">{formData.email}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-400">Phone Number:</span>
              <span className="font-bold text-slate-900">+91 {formData.phone}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-400">Selected Course:</span>
              <span className="font-bold text-slate-900">{formData.courseName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Application Status:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-bold text-[11px] border border-amber-200">
                Pending Admin Approval
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="w-full btn-premium !py-4 shadow-xl flex items-center justify-center gap-2"
          >
            <span>Return to Candidate Login</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      ) : (
        /* ADMISSION FORM WIZARD VIEW */
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="glass-card-saas max-w-4xl w-full p-8 md:p-14 my-10 relative z-10"
        >
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:text-slate-900 transition-all shadow-sm group"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Login</span>
            </button>
          </div>

          <header className="text-center mb-8 flex flex-col items-center">
            <div className="mb-4">
              <PMISLogo size={80} />
            </div>

            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-primary-600 mb-1">
              {step === 1 ? 'STEP 1 OF 2: CANDIDATE DETAILS' : 'STEP 2 OF 2: IDENTITY VERIFICATION'}
            </span>

            <h1 className="text-3xl font-outfit font-black text-slate-900 mb-2">Online Admission Form</h1>
            <p className="text-slate-500 font-medium text-sm max-w-md">
              {step === 1
                ? 'Enter your candidate details and applying course to begin verification.'
                : 'Complete location credentials, livestream video statement, identity documents and signature.'}
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* STEP 1 OF 2: CANDIDATE DETAILS PAGE */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary-500" /> Candidate Credentials
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 flex items-center gap-0.5">
                      Full Candidate Name <span className="text-red-500 font-bold text-xs">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter Full Name"
                      className="input-premium w-full"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 flex items-center gap-0.5">
                      Email Address <span className="text-red-500 font-bold text-xs">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="Enter Email Address"
                      className="input-premium w-full"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 flex items-center gap-0.5">
                      Phone Number <span className="text-red-500 font-bold text-xs">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        maxLength={10}
                        className="input-premium w-full !pl-[90px]"
                        placeholder="Enter Phone Number"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })
                        }
                      />
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <span className="text-slate-500 font-bold text-sm tracking-wide border-r border-slate-200/80 pr-3 h-6 flex items-center">
                          IN +91
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Applying Course Input (Text Box) */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 flex items-center gap-0.5">
                      Applying Course <span className="text-red-500 font-bold text-xs">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter Course Name"
                      className="input-premium w-full"
                      value={formData.courseName}
                      onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                    />
                  </div>
                </div>

                {/* Step 1 Action Button */}
                <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 flex items-center justify-center gap-2 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Login</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedToStep2}
                    className="w-full sm:w-auto btn-premium !py-4 !px-10 shadow-xl flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Identity Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2 OF 2: IDENTITY VERIFICATION PAGE (Matching Screenshot Layout) */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                {/* 1. PERSONAL CREDENTIALS & LOCATION (Matching Screenshot Header & Inputs) */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-1 h-4 bg-primary-500 rounded-full" />
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">
                        Personal Credentials
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={isDetectingLocation}
                      className={`group border text-[11px] font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                        isLocationDetected
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-500 hover:text-emerald-600'
                      }`}
                    >
                      {isDetectingLocation ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                      ) : isLocationDetected ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                      <span>
                        {isLocationDetected ? 'Location Detected ✓' : 'Detect Location'} <span className="text-red-500 font-bold text-xs">*</span>
                      </span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 flex items-center gap-0.5">
                        PIN Code <span className="text-red-500 font-bold text-xs">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        className="input-premium w-full"
                        placeholder="6-digit PIN"
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 flex items-center gap-0.5">
                        State / UT <span className="text-red-500 font-bold text-xs">*</span>
                      </label>
                      <SearchableDropdown
                        value={formData.state}
                        onChange={(val) => setFormData({ ...formData, state: val, city: '' })}
                        options={Object.keys(indianStatesAndCities)}
                        placeholder="Select State..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 flex items-center gap-0.5">
                        City / District <span className="text-red-500 font-bold text-xs">*</span>
                      </label>
                      <SearchableDropdown
                        value={formData.city}
                        onChange={(val) => setFormData({ ...formData, city: val })}
                        options={formData.state ? indianStatesAndCities[formData.state] : []}
                        placeholder={formData.state ? 'Select City...' : 'Select State First'}
                        disabled={!formData.state}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 flex items-center gap-0.5">
                      Residential Address <span className="text-red-500 font-bold text-xs">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Street, Locality, House No..."
                      className="input-premium w-full"
                      value={formData.addressLine}
                      onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
                    />
                  </div>
                </div>

                {/* 2. LIVESTREAM VERIFICATION (Wide Camera on Top, Script Box Below) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-1 h-4 bg-primary-500 rounded-full" />
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-1">
                        Livestream Verification <span className="text-red-500 font-bold text-xs">*</span>
                      </h3>
                    </div>
                  </div>

                  <div className="bg-slate-50/80 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
                    {/* Top: Full-Width Widescreen Camera Feed & Recording Controls */}
                    <div className="space-y-4">
                      <div className="relative w-full aspect-video sm:aspect-[16/9] max-h-[380px] bg-slate-900 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center border border-slate-200">
                        {cameraActive && !videoPreviewUrl && (
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover scale-x-[-1]"
                          />
                        )}

                        {videoPreviewUrl && (
                          <video
                            key={videoPreviewUrl}
                            src={videoPreviewUrl}
                            controls
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        )}

                        {!cameraActive && !videoPreviewUrl && (
                          <div className="text-center p-8 text-slate-400">
                            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg border border-white/20">
                              <Camera className="w-8 h-8 text-primary-400" />
                            </div>
                            <p className="text-sm font-black uppercase text-white tracking-wider">Camera Lens Closed</p>
                            <p className="text-xs text-slate-400 mt-1">Click "Open Lens" below to activate camera</p>
                          </div>
                        )}

                        {recording && (
                          <div className="absolute top-4 left-4 bg-rose-600 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-xl animate-pulse">
                            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                            <span>REC {formatTimer(recordTimer)}</span>
                          </div>
                        )}
                      </div>

                      {/* Camera Controls Bar */}
                      <div className="flex flex-wrap gap-3 justify-center">
                        {!cameraActive && !videoPreviewUrl && (
                          <button
                            type="button"
                            onClick={startCamera}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
                          >
                            <Camera className="w-4 h-4" /> Open Lens
                          </button>
                        )}

                        {cameraActive && !recording && !videoPreviewUrl && (
                          <button
                            type="button"
                            onClick={startRecording}
                            className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-500/20 transition-all hover:scale-105 active:scale-95"
                          >
                            <Play className="w-4 h-4 fill-white" /> Start Recording
                          </button>
                        )}

                        {recording && (
                          <button
                            type="button"
                            onClick={stopRecording}
                            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
                          >
                            <Square className="w-4 h-4 fill-white" /> Stop Recording
                          </button>
                        )}

                        {videoPreviewUrl && (
                          <button
                            type="button"
                            onClick={reRecordVideo}
                            className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                          >
                            <RefreshCw className="w-4 h-4" /> Re-record Video
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Bottom: Full-Width Read-Aloud Script Box with Language Toggle Pills (Only shown when Camera Lens is Open or Video is Recorded) */}
                    <AnimatePresence>
                      {(cameraActive || videoPreviewUrl) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -10 }}
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -10 }}
                          className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 overflow-hidden"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                            <span className="text-[11px] font-black uppercase tracking-widest text-primary-600">
                              Please Read Aloud ({scriptLanguage === 'en' ? 'English' : 'Hindi'}):
                            </span>

                            <div className="flex items-center gap-3">
                              {recordedBlob && (
                                <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                  <span>Recorded!</span>
                                </div>
                              )}

                              {/* English / Hindi Script Toggle Pills (Positioned right above/in script box header) */}
                              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => setScriptLanguage('en')}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                    scriptLanguage === 'en' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'
                                  }`}
                                >
                                  English
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setScriptLanguage('hi')}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                    scriptLanguage === 'hi' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'
                                  }`}
                                >
                                  हिंदी
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="text-xs md:text-sm leading-relaxed text-slate-800 font-serif bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-inner">
                            {scriptLanguage === 'en' ? (
                              <p>
                                "My name is <span className="font-bold text-slate-900 not-italic">{formData.fullName || '[Your Name]'}</span>, and my registered email address is <span className="font-bold text-slate-900 not-italic">{formData.email || '[Your Email]'}</span>. I purposely recorded this video statement to verify my profile, confirm my identity, and acknowledge my enrollment in Princeton Professional's training program (available at princetonprofessional.in). I am purchasing this course for personal skill enhancement, professional development, and career growth. I fully accept and understand that Princeton Professional is only an educational skills-based course training provider and never offers a job promise, job placement assurance, or particular career assurances upon course completion. Furthermore, I certify that I will not file any chargebacks or complaints regarding this transaction in the future. I also promise not to share or distribute any copyrighted course materials supplied to me throughout this program. This statement is made freely, knowingly, and without pressure."
                              </p>
                            ) : (
                              <p>
                                "मेरा नाम <span className="font-bold text-slate-900 not-italic">{formData.fullName || '[आपका नाम]'}</span> है और मेरा रजिस्टर्ड ईमेल एड्रेस <span className="font-bold text-slate-900 not-italic">{formData.email || '[आपका ईमेल]'}</span> है। मैंने यह वीडियो STATEMENT जान-बूझकर रिकॉर्ड किया है ताकि मैं अपनी प्रोफ़ाइल वेरिफ़ाई कर सकूँ, अपनी पहचान कन्फ़र्म कर सकूँ और Princeton Professional के ट्रेनिंग प्रोग्राम (जो princetonprofessional.in पर उपलब्ध है) में अपने एनरोलमेंट की पुष्टि कर सकूँ। मैं यह कोर्स अपनी पर्सनल स्किल बढ़ाने, प्रोफ़ेशनल DEVELOPMENT और करियर में आगे बढ़ने के लिए खरीद रहा हूँ। मैं पूरी तरह से मानता और समझता हूँ कि Princeton Professional सिर्फ़ एक एजुकेशनल स्किल-बेस्ड कोर्स ट्रेनिंग प्रोवाइडर है और कोर्स पूरा होने पर कभी भी नौकरी का वादा, नौकरी मिलने की गारंटी या किसी खास करियर की गारंटी नहीं देता है। इसके अलावा, मैं यह सर्टिफ़ाई करता हूँ कि भविष्य में इस ट्रांज़ैक्शन के बारे में कोई चार्जबैक या शिकायत नहीं करूँगा। मैं यह भी वादा करता हूँ कि इस प्रोग्राम के दौरान मुझे दिए गए किसी भी कॉपीराइट वाले कोर्स मटीरियल को शेयर या डिस्ट्रीब्यूट नहीं करूँगा। यह STATEMENT बिना किसी दबाव के, पूरी जानकारी के साथ और अपनी मर्ज़ी से दिया जा रहा है।"
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* 3. IDENTITY DOCUMENTS (Matching Screenshot) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <span className="w-1 h-4 bg-primary-500 rounded-full" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">
                      Identity Documents
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {/* Aadhaar Front */}
                    <div className="relative group h-[140px]">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFiles({ ...files, aadhaarFront: e.target.files[0] })}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div
                        className={`w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl text-center group-hover:border-primary-500 transition-all bg-white shadow-sm overflow-hidden ${
                          files.aadhaarFront ? 'p-2' : 'p-6'
                        }`}
                      >
                        {files.aadhaarFront ? (
                          <div className="relative w-full h-full">
                            <img
                              src={URL.createObjectURL(files.aadhaarFront)}
                              className="w-full h-full object-cover rounded-2xl"
                              alt="Aadhaar Front"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white rounded-2xl transition-all">
                              <Upload className="w-5 h-5 mb-1" />
                              <span className="text-[9px] font-black uppercase tracking-wider">Change Front</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <ImageIcon className="mx-auto w-6 h-6 text-slate-400 mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-center gap-0.5">
                              Aadhaar Front <span className="text-red-500 font-bold text-xs">*</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Aadhaar Back */}
                    <div className="relative group h-[140px]">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFiles({ ...files, aadhaarBack: e.target.files[0] })}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div
                        className={`w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl text-center group-hover:border-primary-500 transition-all bg-white shadow-sm overflow-hidden ${
                          files.aadhaarBack ? 'p-2' : 'p-6'
                        }`}
                      >
                        {files.aadhaarBack ? (
                          <div className="relative w-full h-full">
                            <img
                              src={URL.createObjectURL(files.aadhaarBack)}
                              className="w-full h-full object-cover rounded-2xl"
                              alt="Aadhaar Back"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white rounded-2xl transition-all">
                              <Upload className="w-5 h-5 mb-1" />
                              <span className="text-[9px] font-black uppercase tracking-wider">Change Back</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <ImageIcon className="mx-auto w-6 h-6 text-slate-400 mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-center gap-0.5">
                              Aadhaar Back <span className="text-red-500 font-bold text-xs">*</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* PAN Card */}
                    <div className="relative group h-[140px]">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFiles({ ...files, panCard: e.target.files[0] })}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div
                        className={`w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl text-center group-hover:border-primary-500 transition-all bg-white shadow-sm overflow-hidden ${
                          files.panCard ? 'p-2' : 'p-6'
                        }`}
                      >
                        {files.panCard ? (
                          <div className="relative w-full h-full">
                            <img
                              src={URL.createObjectURL(files.panCard)}
                              className="w-full h-full object-cover rounded-2xl"
                              alt="PAN Card"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white rounded-2xl transition-all">
                              <Upload className="w-5 h-5 mb-1" />
                              <span className="text-[9px] font-black uppercase tracking-wider">Change PAN</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <ImageIcon className="mx-auto w-6 h-6 text-slate-400 mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase">PAN Card (Optional)</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. DIGITAL SIGNATURE CANVAS */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <span className="w-1 h-4 bg-primary-500 rounded-full" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-1">
                      Digital Signature <span className="text-red-500 font-bold text-xs">*</span>
                    </h3>
                  </div>
                  <div className="bg-slate-50/80 p-4 md:p-6 rounded-[2.5rem] border border-slate-100">
                    <SignatureCanvas onCapture={(blob) => setFiles({ ...files, signature: blob })} />
                  </div>
                </div>

                {/* 5. LEGAL ACKNOWLEDGEMENT */}
                <div className="bg-slate-50 rounded-3xl p-6 md:p-8 border border-slate-200/60">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary-500" /> Legal Acknowledgement
                  </h3>

                  <div className="space-y-6 text-sm text-slate-600 font-medium leading-relaxed max-h-60 overflow-y-auto pr-4 custom-scrollbar mb-6">
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">1. Identity Verification and Authentication</h4>
                      <p>
                        To ensure the integrity of the examination process and to prevent proxy attendance, the Candidate hereby authorizes the Portal to record a live video statement at the commencement of and/or during the examination. This video will be used solely to authenticate the Candidate’s identity against registered records and acknowledge their enrollment in the program. Failure to provide a clear video statement or any attempt to bypass this authentication may result in immediate disqualification.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">2. Purpose of Certification and Employment Disclaimer</h4>
                      <p>
                        The Candidate acknowledges and agrees that this certification is intended solely for personal and professional growth.
                      </p>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>
                          <strong>No Guarantee of Employment:</strong> Successful completion of the exam and issuance of a certificate does not guarantee a job offer, placement, or any form of employment.
                        </li>
                        <li>
                          <strong>No Guarantee of Financial Increase:</strong> This certification does not entitle the Candidate to a salary hike, promotion, or bonus from any current or future employer.
                        </li>
                      </ul>
                      <p className="mt-2">
                        The Portal and its affiliates are not liable for any career expectations not met following the attainment of this certification.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">3. Academic Integrity</h4>
                      <p>
                        The Candidate agrees to complete the examination independently without the use of unauthorized materials, AI tools, or external assistance. Any detected malpractice will lead to the permanent banning of the Candidate’s profile and the nullification of any previous results.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">4. Limitation of Liability</h4>
                      <p>
                        The Portal shall not be held responsible for technical failures on the Candidate’s end, including but not limited to internet connectivity issues, hardware malfunctions, or power outages during the examination session.
                      </p>
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
                      I have read, understood, and agree to follow all the legal terms and accept full responsibility for my actions. <span className="text-red-500 font-bold text-xs">*</span>
                    </span>
                  </label>
                </div>

                {/* STEP 2 ACTIONS: BACK BUTTON & CONDITIONAL SUBMIT BUTTON */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 flex items-center justify-center gap-2 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Step 1</span>
                  </button>

                  <AnimatePresence>
                    {termsAccepted && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full sm:w-auto flex-1 max-w-sm"
                      >
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full btn-premium !py-4 !text-base !rounded-2xl shadow-xl flex items-center justify-center gap-2"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Submitting Application...</span>
                            </>
                          ) : (
                            <>
                              <span>Submit Admission Application</span>
                              <ArrowRight className="w-5 h-5" />
                            </>
                          )}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </form>
        </motion.div>
      )}
    </div>
  );
};

export default AdmissionForm;
