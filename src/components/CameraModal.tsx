
import React, { useState, useEffect } from 'react';
import {
  Camera,
  CameraResultType,
  CameraSource
} from '@capacitor/camera';

import {
  X,
  Camera as CameraIcon,
  Image as ImageIcon,
  RefreshCw,
  Check,
  AlertCircle
} from 'lucide-react';

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
  const [capturedImage, setCapturedImage] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      setError(null);
    }
  }, [isOpen]);

  const openCamera = async () => {
    try {
      setLoading(true);
      setError(null);

      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        correctOrientation: true,
      });

      if (!photo.base64String) {
        throw new Error('ছবি পাওয়া যায়নি');
      }

      const imageData =
        `data:image/${photo.format};base64,${photo.base64String}`;

      setCapturedImage(imageData);

    } catch (err: any) {
      console.error('Native camera error:', err);

      if (err.message?.toLowerCase().includes('cancel')) {
        return;
      }

      setError(
        err.message || 'ক্যামেরা চালু করা যাচ্ছে না।'
      );
    } finally {
      setLoading(false);
    }
  };

  const openGallery = async () => {
    try {
      setLoading(true);
      setError(null);

      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
        correctOrientation: true,
      });

      if (!photo.base64String) {
        throw new Error('ছবি পাওয়া যায়নি');
      }

      setCapturedImage(
        `data:image/${photo.format};base64,${photo.base64String}`
      );

    } catch (err: any) {
      console.error('Gallery error:', err);

      if (err.message?.toLowerCase().includes('cancel')) {
        return;
      }

      setError('গ্যালারি থেকে ছবি নেওয়া যাচ্ছে না।');
    } finally {
      setLoading(false);
    }
  };

  const confirmPhoto = () => {
    if (!capturedImage) return;

    onCapture(capturedImage);
    setCapturedImage(null);
    onClose();
  };

  const closeModal = () => {
    setCapturedImage(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3">

      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-slate-900 text-white">

        <div className="flex items-center justify-between bg-slate-800 p-4">

          <h2 className="font-bold">
            {capturedImage
              ? 'ছবি যাচাই করুন'
              : 'ওজনের খাতার ছবি তুলুন'}
          </h2>

          <button onClick={closeModal}>
            <X size={25} />
          </button>

        </div>

        <div className="flex min-h-[300px] items-center justify-center bg-black p-3">

          {loading ? (
            <div className="flex items-center gap-3">
              <RefreshCw className="animate-spin" />
              অপেক্ষা করুন...
            </div>
          ) : capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured"
              className="max-h-[60vh] w-full object-contain"
            />
          ) : error ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <AlertCircle className="text-red-400" size={40} />
              <p>{error}</p>
            </div>
          ) : (
            <div className="text-center text-slate-400">
              <CameraIcon size={65} className="mx-auto mb-3" />
              <p>ক্যামেরা অথবা গ্যালারি নির্বাচন করুন</p>
            </div>
          )}

        </div>

        <div className="flex flex-wrap justify-center gap-3 p-4">

          {capturedImage ? (
            <>
              <button
                onClick={() => setCapturedImage(null)}
                className="flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-3"
              >
                <RefreshCw size={20} />
                আবার তুলুন
              </button>

              <button
                onClick={confirmPhoto}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-bold"
              >
                <Check size={20} />
                এই ছবি দিয়ে ওজন পড়ুন
              </button>
            </>
          ) : (
            <>
              <button
                onClick={openGallery}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-3"
              >
                <ImageIcon size={20} />
                গ্যালারি
              </button>

              <button
                onClick={openCamera}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-bold"
              >
                <CameraIcon size={20} />
                ক্যামেরা খুলুন
              </button>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
          
