
import React, { useEffect, useRef, useState } from 'react';
import {
  Camera, RefreshCw, X, Zap, ZapOff,
  Check, Image as ImageIcon, AlertCircle
} from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
}

type FacingMode = 'environment' | 'user';

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [facingMode, setFacingMode] =
    useState<FacingMode>('environment');

  const [capturedImage, setCapturedImage] =
    useState<string | null>(null);

  const [cameraError, setCameraError] =
    useState<string | null>(null);

  const [isLoadingCamera, setIsLoadingCamera] =
    useState(false);

  const [hasTorch, setHasTorch] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    setHasTorch(false);
    setTorchEnabled(false);
  };

  const startCamera = async (mode: FacingMode) => {
    stopStream();
    setCameraError(null);
    setIsLoadingCamera(true);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('UNSUPPORTED');
      }

      if (!window.isSecureContext) {
        throw new Error('HTTPS_REQUIRED');
      }

      let stream: MediaStream;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (firstError: any) {
        if (
          firstError.name === 'NotAllowedError' ||
          firstError.name === 'SecurityError'
        ) {
          throw firstError;
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;

      if (!videoRef.current) {
        throw new Error('VIDEO_NOT_READY');
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const track = stream.getVideoTracks()[0];
      const capabilities = track?.getCapabilities?.() as any;

      setHasTorch(Boolean(capabilities?.torch));

    } catch (error: any) {
      console.error('Camera error:', error);
      stopStream();

      if (error.message === 'HTTPS_REQUIRED') {
        setCameraError('HTTPS ওয়েবসাইটে অ্যাপ খুলুন।');
      } else if (error.message === 'UNSUPPORTED') {
        setCameraError('আপনার ব্রাউজার ক্যামেরা সমর্থন করছে না। Chrome ব্যবহার করুন।');
      } else if (error.name === 'NotAllowedError') {
        setCameraError('ক্যামেরার অনুমতি বন্ধ আছে। Chrome Settings থেকে Camera Allow করুন।');
      } else if (error.name === 'NotFoundError') {
        setCameraError('মোবাইলে ক্যামেরা পাওয়া যায়নি।');
      } else if (error.name === 'NotReadableError') {
        setCameraError('অন্য অ্যাপ ক্যামেরা ব্যবহার করছে। অন্য অ্যাপ বন্ধ করে আবার চেষ্টা করুন।');
      } else {
        setCameraError('ক্যামেরা চালু হয়নি। আবার চেষ্টা করুন।');
      }
    } finally {
      setIsLoadingCamera(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopStream();
      return;
    }

    setCapturedImage(null);
    startCamera(facingMode);

    return () => {
      stopStream();
    };
  }, [isOpen, facingMode]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];

    if (!track || !hasTorch) return;

    try {
      const next = !torchEnabled;

      await track.applyConstraints({
        advanced: [{ torch: next } as any],
      });

      setTorchEnabled(next);
    } catch (error) {
      console.error('Torch error:', error);
      setCameraError('ফ্ল্যাশ চালু করা যাচ্ছে না।');
    }
  };

  const takeSnapshot = () => {
    const video = videoRef.current;

    if (!video || !video.videoWidth) {
      setCameraError('ক্যামেরা এখনও প্রস্তুত হয়নি।');
      return;
    }

    const canvas = document.createElement('canvas');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');

    if (!context) {
      setCameraError('ছবি তৈরি করা যাচ্ছে না।');
      return;
    }

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const image = canvas.toDataURL('image/jpeg', 0.90);

    setCapturedImage(image);
    stopStream();

    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  const confirmPhoto = () => {
    if (!capturedImage) return;

    onCapture(capturedImage);
    setCapturedImage(null);
    stopStream();
    onClose();
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setCameraError('অনুগ্রহ করে একটি ছবি নির্বাচন করুন।');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCapturedImage(reader.result);
        stopStream();
        setCameraError(null);
      }
    };

    reader.onerror = () => {
      setCameraError('ছবি পড়তে সমস্যা হয়েছে।');
    };

    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const closeModal = () => {
    stopStream();
    setCapturedImage(null);
    setCameraError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-2">

      <div className="relative flex max-h-[95dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between bg-slate-800 p-4 text-white">

          <div className="flex items-center gap-2">
            <Camera className="h-6 w-6 text-emerald-400" />

            <h2 className="text-base font-bold">
              {capturedImage
                ? 'ছবি যাচাই করুন'
                : 'ওজনের খাতার ছবি তুলুন'}
            </h2>
          </div>

          <button
            onClick={closeModal}
            className="rounded-full p-2 hover:bg-slate-700"
            aria-label="বন্ধ করুন"
          >
            <X className="h-6 w-6" />
          </button>

        </div>

        {/* Camera View */}
        <div className="relative flex min-h-[300px] flex-1 items-center justify-center overflow-hidden bg-black">

          {capturedImage ? (

            <img
              src={capturedImage}
              alt="Captured image"
              className="max-h-[65dvh] w-full object-contain"
            />

          ) : cameraError ? (

            <div className="flex flex-col items-center gap-4 p-6 text-center text-white">

              <AlertCircle className="h-12 w-12 text-amber-400" />

              <p className="text-sm">
                {cameraError}
              </p>

              <button
                onClick={() => startCamera(facingMode)}
                disabled={isLoadingCamera}
                className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold"
              >
                আবার ক্যামেরা চালু করুন
              </button>

            </div>

          ) : (

            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-contain"
              />

              <div className="pointer-events-none absolute inset-5 rounded-xl border-2 border-emerald-400/80" />

            </>

          )}

          {isLoadingCamera && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white">
              <RefreshCw className="mr-3 h-6 w-6 animate-spin text-emerald-400" />
              ক্যামেরা চালু হচ্ছে...
            </div>
          )}

        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-4 text-white">

          {capturedImage ? (

            <>
              <button
                onClick={retakePhoto}
                className="flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-3"
              >
                <RefreshCw className="h-5 w-5" />
                আবার তুলুন
              </button>

              <button
                onClick={confirmPhoto}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-bold"
              >
                <Check className="h-5 w-5" />
                এই ছবি দিয়ে ওজন পড়ুন
              </button>

            </>

          ) : (

            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-xl bg-slate-700 px-3 py-3"
              >
                <ImageIcon className="h-5 w-5" />
                গ্যালারি
              </button>

              {hasTorch && (
                <button
                  onClick={toggleTorch}
                  className="rounded-xl bg-slate-700 p-3"
                  aria-label="Flash"
                >
                  {torchEnabled
                    ? <Zap className="h-5 w-5 text-yellow-400" />
                    : <ZapOff className="h-5 w-5" />}
                </button>
              )}

              <button
                onClick={takeSnapshot}
                disabled={isLoadingCamera || Boolean(cameraError)}
                className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-emerald-400 bg-white text-emerald-700 disabled:opacity-40"
                aria-label="ছবি তুলুন"
              >
                <Camera className="h-8 w-8" />
              </button>

              <button
                onClick={() => setFacingMode(prev =>
                  prev === 'environment' ? 'user' : 'environment'
                )}
                disabled={isLoadingCamera}
                className="flex items-center gap-2 rounded-xl bg-slate-700 px-3 py-3"
              >
                <RefreshCw className="h-5 w-5" />
                ক্যামেরা ঘোরান
              </button>

            </>

          )}

        </div>

      </div>
    </div>
  );
};
    
