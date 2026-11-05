import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, X, Zap, ZapOff, Check, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);

  // Stop camera tracks helper
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Start camera stream
  const startCamera = async (mode: 'environment' | 'user') => {
    stopStream();
    setCameraError(null);
    setIsLoadingCamera(true);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Check if torch/flashlight is supported
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = (videoTrack?.getCapabilities?.() as any) || {};
      setHasTorch(Boolean(capabilities.torch));
      setTorchEnabled(false);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(
        'ক্যামেরা ওপেন করা যায়নি। অনুমতি দেওয়া আছে কিনা নিশ্চিত করুন অথবা ফাইল আপলোড বাটনটি ব্যবহার করুন।'
      );
    } finally {
      setIsLoadingCamera(false);
    }
  };

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera(facingMode);
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isOpen, facingMode, capturedImage]);

  // Toggle Torch
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && hasTorch) {
      try {
        const nextState = !torchEnabled;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setTorchEnabled(nextState);
      } catch (e) {
        console.error('Torch toggle failed:', e);
      }
    }
  };

  // Snap photo
  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    // Trigger slight haptic feedback if available on mobile
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(30);
      } catch (e) {}
    }

    setCapturedImage(dataUrl);
    stopStream();
  };

  // Retake photo
  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  // Confirm photo
  const confirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
      setCapturedImage(null);
    }
  };

  // Handle local file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCapturedImage(dataUrl);
        stopStream();
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-800/90 border-b border-slate-700/80 text-white z-10">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <h2 className="font-semibold text-lg">
              {capturedImage ? 'ছবি প্রিভিউ ও নিশ্চিতকরণ' : 'ওজনের খাতার ছবি তুলুন'}
            </h2>
          </div>
          <button
            onClick={() => {
              stopStream();
              onClose();
              setCapturedImage(null);
            }}
            className="p-1.5 rounded-full hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport / Preview */}
        <div className="relative flex-1 bg-black min-h-[360px] sm:min-h-[460px] flex items-center justify-center overflow-hidden">
          {capturedImage ? (
            <div className="relative w-full h-full flex items-center justify-center p-2">
              <img
                src={capturedImage}
                alt="Captured Handwritten Slip"
                className="max-h-[65vh] w-auto object-contain rounded-xl shadow-lg border border-slate-700"
              />
            </div>
          ) : (
            <>
              {cameraError ? (
                <div className="flex flex-col items-center justify-center p-6 text-center text-slate-300 max-w-md">
                  <AlertCircle className="w-12 h-12 text-amber-400 mb-3" />
                  <p className="text-sm font-medium mb-4">{cameraError}</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium shadow-lg transition-colors"
                  >
                    <ImageIcon className="w-4 h-4" />
                    গ্যালারি বা ফাইল থেকে ছবি নিন
                  </button>
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

                  {/* Viewfinder Target Overlay */}
                  <div className="pointer-events-none absolute inset-6 sm:inset-10 border-2 border-emerald-400/70 rounded-2xl flex flex-col justify-between p-3 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                    <div className="flex justify-between items-center text-xs text-emerald-300 bg-black/50 px-3 py-1 rounded-full backdrop-blur-md self-center">
                      <span>কাগজ বা খাতা ফ্রেমের ভেতরে রাখুন</span>
                    </div>

                    {/* Corner accents */}
                    <div className="relative w-full h-full flex flex-col justify-between pointer-events-none">
                      <div className="flex justify-between">
                        <div className="w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                        <div className="w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                      </div>
                      <div className="flex justify-between">
                        <div className="w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                        <div className="w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                      </div>
                    </div>

                    <div className="text-[11px] text-center text-slate-300 bg-black/60 px-3 py-1 rounded-full self-center">
                      হাতে লেখা 1.5, 2, 3.5 বা ১.৫, ২ ইত্যাদি পরিষ্কার রাখুন
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {isLoadingCamera && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="flex items-center gap-3 bg-slate-800 text-white px-5 py-3 rounded-2xl">
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                <span>ক্যামেরা প্রস্তুত হচ্ছে...</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls Footer */}
        <div className="bg-slate-900 border-t border-slate-800 px-6 py-4 flex items-center justify-between gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {capturedImage ? (
            <div className="flex w-full items-center justify-between gap-3">
              <button
                onClick={retakePhoto}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                আবার তুলুন
              </button>

              <button
                onClick={confirmPhoto}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-900/40 transition-all hover:scale-[1.02]"
              >
                <Check className="w-5 h-5" />
                এই ছবি দিয়ে ওজন পড়ুন
              </button>
            </div>
          ) : (
            <>
              {/* Secondary actions: Gallery & Switch */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-medium border border-slate-700 transition-colors"
                  title="ফাইল বা গ্যালারি থেকে ছবি আপলোড"
                >
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  <span>গ্যালারি</span>
                </button>

                {hasTorch && (
                  <button
                    onClick={toggleTorch}
                    className={`p-2.5 rounded-xl border border-slate-700 text-slate-200 transition-colors ${
                      torchEnabled
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                        : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                    title="ফ্ল্যাশ লাইট অন/অফ"
                  >
                    {torchEnabled ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {/* Shutter button */}
              <div className="flex justify-center">
                <button
                  onClick={takeSnapshot}
                  disabled={isLoadingCamera || Boolean(cameraError)}
                  className="w-16 h-16 rounded-full border-4 border-slate-700 p-1 bg-white hover:bg-emerald-100 active:scale-95 transition-all shadow-xl disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center group"
                  aria-label="ছবি তুলুন"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-600 group-hover:bg-emerald-500 transition-colors flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </button>
              </div>

              {/* Flip camera */}
              <button
                onClick={() => {
                  setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-medium border border-slate-700 transition-colors"
                title="ক্যামেরা উল্টান"
              >
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">ঘোরান</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
