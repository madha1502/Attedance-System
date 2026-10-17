import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Camera,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  UserPlus,
  ShieldCheck,
  Building2,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { COLLEGE_CONFIG } from '../config/departments.config';
import { registerStudent } from '../services/studentStore';
import { assessFaceQuality, detectFacesInCanvas, extractFaceDescriptor } from '../services/faceRecognition';
import { FaceQualityReport } from '../types/attendance';

interface StudentRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentRegistered?: () => void;
}

export const StudentRegistrationModal: React.FC<StudentRegistrationModalProps> = ({
  isOpen,
  onClose,
  onStudentRegistered,
}) => {
  const { session, activeDepartment } = useAuth();

  const [registerNumber, setRegisterNumber] = useState('');
  const [name, setName] = useState('');
  const [capturedThumbnail, setCapturedThumbnail] = useState<string | null>(null);
  const [capturedDescriptor, setCapturedDescriptor] = useState<number[] | null>(null);
  const [capturedQualityScore, setCapturedQualityScore] = useState<number>(0);

  // Live quality tracking
  const [qualityReport, setQualityReport] = useState<FaceQualityReport>({
    isValid: false,
    score: 0,
    lighting: 'too_dark',
    sharpness: 'blurry',
    faceCount: 0,
    message: 'Initializing camera...',
  });

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const monitorIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (monitorIntervalRef.current) clearInterval(monitorIntervalRef.current);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access API is not supported in this browser or iframe context.');
      }

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false,
        });
      } catch (err1) {
        // Fallback to basic constraint
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      if (!stream) {
        throw new Error('Could not initialize video stream.');
      }

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Start continuous real-time face quality evaluation (every 400ms)
      monitorIntervalRef.current = setInterval(evaluateLiveFaceQuality, 400);
    } catch (err: any) {
      console.warn('Student registration camera error:', err);
      const errName = err.name || '';
      const errMsg = err.message || '';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError' || errMsg.includes('denied') || errMsg.includes('blocked')) {
        setCameraError('Camera permission not granted. Please allow camera access in your browser address bar and click Retry.');
      } else {
        setCameraError(errMsg || 'No video camera found.');
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setFormError(null);
      setCapturedThumbnail(null);
      setCapturedDescriptor(null);
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Real-time quality monitor function
  const evaluateLiveFaceQuality = async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const faces = await detectFacesInCanvas(canvas);

    if (faces.length === 0) {
      setQualityReport({
        isValid: false,
        score: 0,
        lighting: 'too_dark',
        sharpness: 'blurry',
        faceCount: 0,
        message: 'No face detected in frame. Please face the camera squarely.',
      });
      return;
    }

    if (faces.length > 1) {
      setQualityReport({
        isValid: false,
        score: 35,
        lighting: 'good',
        sharpness: 'sharp',
        faceCount: faces.length,
        message: 'Multiple faces detected. Please ensure only 1 student is in frame for registration.',
      });
      return;
    }

    const face = faces[0];
    const quality = face.quality;

    setQualityReport({
      ...quality,
      faceCount: 1,
      message: quality.isValid
        ? `Optimal face quality (${quality.score}%). Ready to capture.`
        : quality.message || 'Adjust face position, lighting or reduce motion.',
    });
  };

  // Capture face snapshot
  const handleCaptureSnapshot = async () => {
    const video = videoRef.current;
    if (!video || !qualityReport.isValid) return;

    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 360;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const faces = await detectFacesInCanvas(canvas);

    if (faces.length === 0) {
      setFormError('No face could be resolved at time of capture. Please try again.');
      return;
    }

    const targetFace = faces[0];
    const thumbnail = canvas.toDataURL('image/jpeg', 0.85);
    const descriptor = targetFace.descriptor;

    setCapturedThumbnail(thumbnail);
    setCapturedDescriptor(descriptor);
    setCapturedQualityScore(qualityReport.score);
    setFormError(null);
  };

  // Retake snapshot
  const handleRetake = () => {
    setCapturedThumbnail(null);
    setCapturedDescriptor(null);
    setCapturedQualityScore(0);
    setFormError(null);
  };

  // Save student to cohort store
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!registerNumber.trim()) {
      setFormError('Please enter a valid student Register Number.');
      return;
    }
    if (!name.trim()) {
      setFormError('Please enter the student formal name.');
      return;
    }
    if (!capturedDescriptor || !capturedThumbnail) {
      setFormError('Please capture an approved face biometric snapshot first.');
      return;
    }

    if (!session || !activeDepartment) {
      setFormError('Session is not authenticated.');
      return;
    }

    // Call store with duplicate register number rejection
    const result = registerStudent({
      registerNumber: registerNumber.trim().toUpperCase(),
      name: name.trim(),
      departmentId: activeDepartment.id,
      departmentCode: activeDepartment.code,
      year: session.year,
      section: session.section,
      faceDescriptor: capturedDescriptor,
      faceThumbnail: capturedThumbnail,
      qualityScore: capturedQualityScore || 90,
    });

    if (!result.success) {
      setFormError(result.error || 'Failed to register student.');
      return;
    }

    // Success!
    setIsSuccess(true);
    if (onStudentRegistered) {
      onStudentRegistered();
    }
  };

  const handleRegisterAnother = () => {
    setIsSuccess(false);
    setRegisterNumber('');
    setName('');
    setCapturedThumbnail(null);
    setCapturedDescriptor(null);
    setFormError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#0066b2] rounded-xl text-white shadow-sm">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Add Student to Biometric Roster
              </h3>
              <p className="text-xs text-blue-200">
                {activeDepartment?.code} • Year {session?.year} - Section {session?.section}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* SUCCESS SCREEN */}
          {isSuccess ? (
            <div className="text-center py-6 space-y-4 animate-in fade-in">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-slate-900">
                  Student Enrolled Successfully
                </h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Student <strong className="text-slate-900">{name}</strong> ({registerNumber})
                  has been added to the {activeDepartment?.code} Year {session?.year} Section {session?.section} face recognition roster.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleRegisterAnother}
                  className="px-4 py-2.5 bg-[#0066b2] hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
                >
                  Register Another Student
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    onClose();
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Form Error Banner (e.g. Duplicate Register Number) */}
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-xs text-red-800 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <strong className="block font-bold">Registration Rejected</strong>
                    <span>{formError}</span>
                  </div>
                </div>
              )}

              {/* Form Inputs: Register Number & Student Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    1. Register Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={registerNumber}
                    onChange={(e) => {
                      setRegisterNumber(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    placeholder="e.g. 922521104007"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066b2]"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Must be unique per cohort
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    2. Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    placeholder="e.g. Kavitha S"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066b2]"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    As listed in university roll
                  </span>
                </div>
              </div>

              {/* Live Camera Snapshot Area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    3. Live Face Biometric Capture *
                  </label>
                  {capturedThumbnail && (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Snapshot Captured ({capturedQualityScore}%)</span>
                    </span>
                  )}
                </div>

                {/* Viewfinder or Captured Preview */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 aspect-video flex items-center justify-center">
                  {!capturedThumbnail ? (
                    <>
                      {cameraError ? (
                        <div className="p-4 text-center text-xs text-slate-300 space-y-2.5 max-w-sm">
                          <AlertTriangle className="w-7 h-7 text-amber-400 mx-auto" />
                          <p className="leading-relaxed">{cameraError}</p>
                          <div className="flex flex-col gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={startCamera}
                              className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>Click to Allow Camera Permission</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                // Generate sample verified snapshot
                                const mockCanvas = document.createElement('canvas');
                                mockCanvas.width = 320;
                                mockCanvas.height = 240;
                                const mCtx = mockCanvas.getContext('2d');
                                if (mCtx) {
                                  mCtx.fillStyle = '#0f172a';
                                  mCtx.fillRect(0, 0, 320, 240);
                                  mCtx.fillStyle = '#fbcfe8';
                                  mCtx.beginPath();
                                  mCtx.arc(160, 110, 45, 0, Math.PI * 2);
                                  mCtx.fill();
                                  mCtx.fillStyle = '#0284c7';
                                  mCtx.beginPath();
                                  mCtx.arc(160, 195, 65, 0, Math.PI, true);
                                  mCtx.fill();
                                  const thumb = mockCanvas.toDataURL('image/jpeg', 0.85);
                                  const desc = Array.from({ length: 128 }, (_, i) => Math.sin(i * 0.3) * 0.15 + (i % 5 === 0 ? 0.35 : 0.05));
                                  setCapturedThumbnail(thumb);
                                  setCapturedDescriptor(desc);
                                  setCapturedQualityScore(92);
                                  setCameraError(null);
                                }
                              }}
                              className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-[11px] transition-colors cursor-pointer border border-slate-700 flex items-center justify-center space-x-1"
                            >
                              <Sparkles className="w-3 h-3 text-amber-300" />
                              <span>Use Sample Biometric Snapshot</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                          />

                          {/* Oval Face Alignment Guide Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div
                              className={`w-40 h-52 rounded-[50%] border-2 border-dashed transition-colors ${
                                qualityReport.isValid
                                  ? 'border-emerald-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                                  : 'border-amber-400/70'
                              }`}
                            />
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    /* Captured Snapshot Display */
                    <div className="relative w-full h-full">
                      <img
                        src={capturedThumbnail}
                        alt="Captured Face"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRetake}
                        className="absolute bottom-3 right-3 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-bold rounded-lg border border-slate-700 backdrop-blur-md flex items-center space-x-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retake Snapshot</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Live Real-time Quality Feedback Banner */}
                {!capturedThumbnail && (
                  <div
                    className={`mt-2 p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                      qualityReport.isValid
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {qualityReport.isValid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                      <span className="font-medium">{qualityReport.message}</span>
                    </div>

                    <div className="font-mono font-bold text-[11px] ml-2 shrink-0">
                      Score: {qualityReport.score}%
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-3">
                {!capturedThumbnail ? (
                  <button
                    type="button"
                    disabled={!qualityReport.isValid || Boolean(cameraError)}
                    onClick={handleCaptureSnapshot}
                    className="w-full py-3 px-4 bg-[#0066b2] hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture Face Snapshot</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Save Student to Cohort Roster</span>
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
