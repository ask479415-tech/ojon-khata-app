<<<<<<< HEAD

=======
>>>>>>> 6d852efc (Fix OCR plugin)
import React, { useState } from 'react';
import {
  Camera,
  CameraResultType,
<<<<<<< HEAD
  CameraSource
} from '@capacitor/camera';

import {
  TextRecognition,
  Script
} from '@capacitor-mlkit/text-recognition';

import {
  X,
  Image as ImageIcon,
  Camera as CameraIcon,
  Trash2,
  Plus,
  RefreshCw,
  Calculator
} from 'lucide-react';

interface Weight {
  id: number;
  value: number;
  originalText: string;
}
=======
  CameraSource,
} from '@capacitor/camera';
import {
  Camera as CameraIcon,
  Image as ImageIcon,
  RefreshCw,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
>>>>>>> 6d852efc (Fix OCR plugin)

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (data: Weight[]) => void;
}

const bengaliDigits: Record<string, string> = {
  '০': '0', '১': '1', '২': '2',
  '৩': '3', '৪': '4', '৫': '5',
  '৬': '6', '৭': '7', '৮': '8',
  '৯': '9'
};

const normalizeText = (text: string) => {
  return text
    .replace(/[০-৯]/g, digit => bengaliDigits[digit])
    .replace(/,/g, '.')
    .replace(/[Oo]/g, '0')
    .replace(/[Il|]/g, '1');
};

const extractWeights = (text: string): Weight[] => {
  const lines = normalizeText(text).split(/\r?\n/);
  const results: Weight[] = [];

  lines.forEach((line) => {
    const cleaned = line.trim();

    if (!cleaned) return;

    // KG or gram detection
    const isGram = /\b(g|gm|gram|grams)\b/i.test(cleaned);

    const matches = cleaned.match(
      /\d+(?:\.\d+)?/g
    );

    if (!matches) return;

    matches.forEach((match) => {
      let value = Number(match);

      if (!Number.isFinite(value) || value <= 0) return;

      if (isGram) {
        value = value / 1000;
      }

      // Ignore unusually large values
      if (value > 500) return;

      results.push({
        id: Date.now() + results.length + Math.random(),
        value: Number(value.toFixed(3)),
        originalText: match
      });
    });
  });

  return results;
};

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture
}) => {
<<<<<<< HEAD
  const [image, setImage] = useState<string | null>(null);
  const [weights, setWeights] = useState<Weight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const total = weights.reduce(
    (sum, item) => sum + item.value,
    0
  );

  const takePicture = async (source: CameraSource) => {
    try {
      setError('');
      setLoading(true);
      setWeights([]);

      const photo = await Camera.getPhoto({
        quality: 95,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source
      });

      if (!photo.path) {
        throw new Error('ছবির Path পাওয়া যায়নি');
      }

      setImage(photo.webPath || null);

      const result = await TextRecognition.processImage({
        path: photo.path,
        script: Script.Latin
      });

      console.log('Recognized Text:', result.text);

      const detected = extractWeights(result.text);

      if (detected.length === 0) {
        setError(
          'কোনো ওজন শনাক্ত হয়নি। পরিষ্কার ছবি তুলুন অথবা হাতে ওজন যোগ করুন।'
        );
      }

      setWeights(detected);

    } catch (err: any) {
      console.error('OCR ERROR:', err);

      setError(
        err?.message || 'ছবি পড়তে সমস্যা হয়েছে।'
      );

=======
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const openCamera = async () => {
    setCameraError(null);
    setLoading(true);

    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 1800,
      });

      if (photo.dataUrl) {
        setCapturedImage(photo.dataUrl);
      } else {
        setCameraError('ছবি পাওয়া যায়নি। আবার চেষ্টা করুন।');
      }
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError(
        'ক্যামেরা চালু করা যায়নি। ক্যামেরার অনুমতি দিন অথবা গ্যালারি ব্যবহার করুন।'
      );
>>>>>>> 6d852efc (Fix OCR plugin)
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  const updateWeight = (id: number, value: string) => {
    setWeights(previous =>
      previous.map(item =>
        item.id === id
          ? {
              ...item,
              value: Number(value),
              originalText: value
            }
          : item
      )
    );
  };

  const deleteWeight = (id: number) => {
    setWeights(previous =>
      previous.filter(item => item.id !== id)
    );
  };

  const addWeight = () => {
    setWeights(previous => [
      ...previous,
      {
        id: Date.now() + Math.random(),
        value: 0,
        originalText: '0'
      }
    ]);
  };

  const finish = () => {
    onCapture(weights);
=======
  const openGallery = async () => {
    setCameraError(null);
    setLoading(true);

    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        width: 1800,
      });

      if (photo.dataUrl) {
        setCapturedImage(photo.dataUrl);
      } else {
        setCameraError('ছবি পাওয়া যায়নি।');
      }
    } catch (error) {
      console.error('Gallery error:', error);
      setCameraError('গ্যালারি থেকে ছবি নেওয়া যায়নি।');
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
    setCameraError(null);
>>>>>>> 6d852efc (Fix OCR plugin)
    onClose();
  };

  return (
<<<<<<< HEAD
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3">

      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[95vh] overflow-y-auto">

        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">
            ছবি থেকে ওজন হিসাব
          </h2>

          <button onClick={onClose}>
            <X size={25} />
          </button>
        </div>

        <div className="p-4 space-y-4">

          <div className="grid grid-cols-2 gap-3">

            <button
              onClick={() => takePicture(CameraSource.Camera)}
              disabled={loading}
              className="bg-blue-600 text-white p-4 rounded-xl flex flex-col items-center gap-2 disabled:opacity-50"
            >
              <CameraIcon size={30} />
              ক্যামেরা
            </button>

            <button
              onClick={() => takePicture(CameraSource.Photos)}
              disabled={loading}
              className="bg-green-600 text-white p-4 rounded-xl flex flex-col items-center gap-2 disabled:opacity-50"
            >
              <ImageIcon size={30} />
              গ্যালারি
            </button>

          </div>

          {image && (
            <img
              src={image}
              alt="Selected"
              className="w-full max-h-64 object-contain rounded-xl border"
            />
          )}

          {loading && (
            <div className="text-center p-5">
              <RefreshCw
                className="animate-spin mx-auto mb-2"
                size={30}
              />
              ছবি থেকে লেখা পড়া হচ্ছে...
=======
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3">
      <div className="w-full max-w-2xl bg-slate-900 rounded-3xl overflow-hidden border border-slate-700">

        <div className="flex items-center justify-between p-4 bg-slate-800 text-white">
          <div className="flex items-center gap-2">
            <CameraIcon className="w-5 h-5 text-emerald-400" />
            <h2 className="font-semibold text-lg">
              {capturedImage ? 'ছবি প্রিভিউ' : 'ওজনের খাতার ছবি তুলুন'}
            </h2>
          </div>

          <button onClick={closeModal} className="p-2 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-black min-h-[360px] flex items-center justify-center p-4">

          {capturedImage ? (
            <img
              src={capturedImage}
              alt="ওজনের খাতার ছবি"
              className="max-h-[65vh] max-w-full object-contain rounded-xl"
            />
          ) : (
            <div className="text-center text-white p-5">
              {loading ? (
                <>
                  <RefreshCw className="w-10 h-10 mx-auto mb-4 animate-spin text-emerald-400" />
                  <p>ক্যামেরা প্রস্তুত হচ্ছে...</p>
                </>
              ) : (
                <>
                  <CameraIcon className="w-16 h-16 mx-auto mb-4 text-emerald-400" />
                  <p className="text-lg font-semibold mb-2">
                    ওজনের কাগজটি প্রস্তুত রাখুন
                  </p>
                  <p className="text-sm text-slate-300">
                    হাতে লেখা 1.5, 2, 3.5 KG পরিষ্কারভাবে ছবি তুলুন।
                  </p>
                </>
              )}

              {cameraError && (
                <div className="mt-4 text-amber-400 text-sm flex items-center justify-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {cameraError}
                </div>
              )}
>>>>>>> 6d852efc (Fix OCR plugin)
            </div>
          )}

<<<<<<< HEAD
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg">
              শনাক্ত ওজন
            </h3>

            <button
              onClick={addWeight}
              className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg flex items-center gap-1"
            >
              <Plus size={18} />
              যোগ করুন
            </button>
          </div>

          {weights.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-2 border p-3 rounded-xl"
            >
              <span className="font-bold">
                {index + 1}.
              </span>

              <input
                type="number"
                step="0.001"
                min="0"
                value={item.value}
                onChange={e =>
                  updateWeight(item.id, e.target.value)
                }
                className="flex-1 border rounded-lg p-2 min-w-0"
              />

              <span>KG</span>

              <button
                onClick={() => deleteWeight(item.id)}
                className="text-red-600 p-2"
=======
        <div className="p-4 flex flex-wrap items-center justify-center gap-3">

          {capturedImage ? (
            <>
              <button
                onClick={() => setCapturedImage(null)}
                className="px-5 py-3 rounded-xl bg-slate-700 text-white flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                আবার তুলুন
              </button>

              <button
                onClick={confirmPhoto}
                className="px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold flex items-center gap-2"
>>>>>>> 6d852efc (Fix OCR plugin)
              >
                <Trash2 size={20} />
              </button>
<<<<<<< HEAD
            </div>
          ))}

          <div className="bg-green-50 rounded-xl p-4 text-center">

            <Calculator
              className="mx-auto mb-2 text-green-700"
              size={28}
            />

            <p className="text-gray-600">
              মোট ওজন
            </p>

            <h2 className="text-3xl font-bold text-green-700">
              {total.toFixed(3)} KG
            </h2>

            <p className="text-sm text-gray-500">
              {weights.length} টি ওজন
            </p>

          </div>

          <button
            onClick={finish}
            disabled={loading}
            className="w-full bg-green-600 text-white font-bold p-4 rounded-xl disabled:opacity-50"
          >
            হিসাব সংরক্ষণ করুন
          </button>
=======
            </>
          ) : (
            <>
              <button
                onClick={openCamera}
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                <CameraIcon className="w-5 h-5" />
                ক্যামেরা খুলুন
              </button>

              <button
                onClick={openGallery}
                disabled={loading}
                className="px-5 py-3 rounded-xl bg-slate-700 text-white flex items-center gap-2 disabled:opacity-50"
              >
                <ImageIcon className="w-5 h-5" />
                গ্যালারি
              </button>
            </>
          )}
>>>>>>> 6d852efc (Fix OCR plugin)

        </div>
      </div>
    </div>
  );
};