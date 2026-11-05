import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Eye,
  Info,
  Scale
} from 'lucide-react';
import { WeightItem, NumeralStyle } from '../types';
import { formatWeight, parseBengaliOrEnglishNumber, toBengaliNumerals } from '../utils/numberFormat';

interface VerificationPanelProps {
  imageDataUrl: string | null;
  weights: WeightItem[];
  detectedLanguage?: string;
  summaryNote?: string;
  numeralStyle: NumeralStyle;
  onUpdateWeight: (id: string, newValue: number, newOriginalText?: string) => void;
  onAddWeight: (value: number, originalText?: string) => void;
  onDeleteWeight: (id: string) => void;
  onConfirmTally: () => void;
  onRetake: () => void;
}

export const VerificationPanel: React.FC<VerificationPanelProps> = ({
  imageDataUrl,
  weights,
  detectedLanguage: _detectedLanguage,
  summaryNote,
  numeralStyle,
  onUpdateWeight,
  onAddWeight,
  onDeleteWeight,
  onConfirmTally,
  onRetake,
}) => {
  // Image zoom state
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showFullImageModal, setShowFullImageModal] = useState<boolean>(false);

  // New item quick add state
  const [newWeightInput, setNewWeightInput] = useState<string>('');
  const [newWeightNote, setNewWeightNote] = useState<string>('');
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  // Quick edit item
  const [activeEditingId, setActiveEditingId] = useState<string | null>(null);
  const [editInputValue, setEditInputValue] = useState<string>('');

  // Calculate live statistics
  const totalKg = weights.reduce((acc, curr) => acc + (curr.value || 0), 0);
  const itemCount = weights.length;
  const avgKg = itemCount > 0 ? totalKg / itemCount : 0;
  const lowConfidenceCount = weights.filter((w) => w.confidence === 'low' || w.confidence === 'medium').length;

  const handleStartEdit = (item: WeightItem) => {
    setActiveEditingId(item.id);
    setEditInputValue(item.value.toString());
  };

  const handleSaveEdit = (id: string) => {
    const parsed = parseBengaliOrEnglishNumber(editInputValue);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdateWeight(id, parsed, editInputValue);
    }
    setActiveEditingId(null);
    setEditInputValue('');
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseBengaliOrEnglishNumber(newWeightInput);
    if (!isNaN(parsed) && parsed > 0) {
      onAddWeight(parsed, newWeightNote ? `${newWeightNote}: ${newWeightInput}` : newWeightInput);
      setNewWeightInput('');
      setNewWeightNote('');
      setIsAddingNew(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Reassurance Banner regarding Handwritten OCR */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl shadow-xs">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-900 leading-relaxed">
            <p className="font-semibold text-amber-950 flex items-center gap-1.5">
              <span>গুরুত্বপূর্ণ যাচাইকরণ ধাপ (Verification Step)</span>
              {lowConfidenceCount > 0 && (
                <span className="bg-amber-200 text-amber-900 text-xs px-2 py-0.5 rounded-full font-medium">
                  {numeralStyle === 'bangla' ? toBengaliNumerals(lowConfidenceCount) : lowConfidenceCount}টি সংখ্যা যাচাই করুন
                </span>
              )}
            </p>
            <p className="mt-0.5">
              হাতের লেখা OCR সবসময় শতভাগ নিখুঁত নাও পড়তে পারে। মূল ছবির সাথে নিচের প্রতিটি সংখ্যা মিলিয়ে নিন, ভুল থাকলে ট্যাপ করে সংশোধন করুন অথবা বাদ পড়া ওজন যোগ করুন।
            </p>
            {summaryNote && (
              <p className="mt-1.5 text-xs text-amber-800 bg-amber-100/70 p-2 rounded-lg flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>{summaryNote}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Verification Grid: Image & Extracted Numbers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Zoomable Image View (5 cols on lg) */}
        {imageDataUrl && (
          <div className="lg:col-span-5 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-700">
              <span className="font-medium flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-600" />
                মূল ছবি (হাতে লেখা স্লিপ)
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.2))}
                  className="p-1 hover:bg-slate-200 rounded-md text-slate-600"
                  title="জুম আউট"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono px-1 font-semibold text-slate-500">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                  className="p-1 hover:bg-slate-200 rounded-md text-slate-600"
                  title="জুম ইন"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  className="p-1 hover:bg-slate-200 rounded-md text-slate-600 ml-1"
                  title="রিসেট"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowFullImageModal(true)}
                  className="text-emerald-700 hover:text-emerald-800 text-xs font-semibold underline ml-2"
                >
                  বড় করে দেখুন
                </button>
              </div>
            </div>

            <div className="relative bg-slate-900/5 min-h-[260px] max-h-[460px] overflow-auto p-3 flex items-center justify-center">
              <img
                src={imageDataUrl}
                alt="Captured handwritten document"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                className="max-w-full h-auto object-contain rounded-lg transition-transform duration-150 shadow-xs"
              />
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-600">
              <span>ছবি অস্পষ্ট হলে আবার তুলতে পারেন:</span>
              <button
                type="button"
                onClick={onRetake}
                className="px-2.5 py-1 text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              >
                নতুন ছবি তুলুন
              </button>
            </div>
          </div>
        )}

        {/* Right Column: Editable Items List & Real-time Total (7 cols on lg) */}
        <div className={`flex flex-col space-y-4 ${imageDataUrl ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          {/* Real-time Tally Header Card */}
          <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white rounded-2xl p-5 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-emerald-200 text-xs sm:text-sm font-semibold tracking-wide uppercase flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-emerald-300" />
                বর্তমান মোট ওজন (Live Total)
              </span>
              <span className="bg-emerald-600/60 backdrop-blur-md text-xs px-2.5 py-1 rounded-full text-emerald-100 font-medium">
                {numeralStyle === 'bangla' ? toBengaliNumerals(itemCount) : itemCount}টি এন্ট্রি
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black font-mono-num tracking-tight text-white drop-shadow-xs">
                {formatWeight(totalKg, numeralStyle, 2)}
              </span>
              <span className="text-xl sm:text-2xl font-bold text-emerald-200">কেজি (KG)</span>
            </div>

            <div className="mt-3 pt-3 border-t border-emerald-600/50 flex flex-wrap gap-4 text-xs text-emerald-100">
              <div>
                <span className="text-emerald-300">গড় ওজন: </span>
                <span className="font-semibold font-mono-num">
                  {formatWeight(avgKg, numeralStyle, 2)} কেজি
                </span>
              </div>
              <div>
                <span className="text-emerald-300">সর্বনিম্ন: </span>
                <span className="font-semibold font-mono-num">
                  {formatWeight(itemCount > 0 ? Math.min(...weights.map((w) => w.value)) : 0, numeralStyle, 2)} কেজি
                </span>
              </div>
              <div>
                <span className="text-emerald-300">সর্বোচ্চ: </span>
                <span className="font-semibold font-mono-num">
                  {formatWeight(itemCount > 0 ? Math.max(...weights.map((w) => w.value)) : 0, numeralStyle, 2)} কেজি
                </span>
              </div>
            </div>
          </div>

          {/* Extracted Weights Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <span>সনাক্তকৃত ওজনের তালিকা</span>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
                    {itemCount}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  সংখ্যা পরিবর্তন করতে ক্লিক করুন, অথবা ডানপাশের বাটন চাপুন।
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingNew((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs sm:text-sm font-semibold border border-emerald-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>ওজন যোগ করুন</span>
              </button>
            </div>

            {/* Quick Add Form */}
            {isAddingNew && (
              <form
                onSubmit={handleQuickAdd}
                className="mb-4 p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 flex flex-wrap items-center gap-2 animate-in slide-in-from-top-2"
              >
                <input
                  type="text"
                  placeholder="ওজন লিখুন (যেমন: 2.5 বা ২.৫)"
                  value={newWeightInput}
                  onChange={(e) => setNewWeightInput(e.target.value)}
                  className="flex-1 min-w-[140px] px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono-num"
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="নোট/বস্তা নং (ঐচ্ছিক)"
                  value={newWeightNote}
                  onChange={(e) => setNewWeightNote(e.target.value)}
                  className="w-32 px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                />
                <div className="flex items-center gap-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                  >
                    যোগ করুন
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium"
                  >
                    বাতিল
                  </button>
                </div>
              </form>
            )}

            {/* Weights List / Grid */}
            {weights.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <p>কোন ওজন পাওয়া যায়নি।</p>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(true)}
                  className="mt-2 text-emerald-600 hover:underline text-sm font-medium"
                >
                  ম্যানুয়ালি প্রথম ওজন যোগ করুন
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {weights.map((item, index) => {
                  const isEditing = activeEditingId === item.id;
                  const isLowConfidence = item.confidence === 'low';
                  const isMediumConfidence = item.confidence === 'medium';

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all ${
                        isLowConfidence
                          ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300/60'
                          : isMediumConfidence
                          ? 'bg-yellow-50/40 border-yellow-200'
                          : 'bg-slate-50/70 border-slate-200 hover:bg-white'
                      }`}
                    >
                      {/* Left: Index badge & Label */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                          {numeralStyle === 'bangla' ? toBengaliNumerals(index + 1) : index + 1}
                        </span>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={editInputValue}
                                  onChange={(e) => setEditInputValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit(item.id);
                                    if (e.key === 'Escape') setActiveEditingId(null);
                                  }}
                                  className="w-24 px-2 py-1 bg-white border border-emerald-500 rounded-md text-sm font-bold font-mono-num focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(item.id)}
                                  className="px-2 py-1 bg-emerald-600 text-white rounded text-xs font-semibold"
                                >
                                  ঠিক
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveEditingId(null)}
                                  className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs"
                                >
                                  বাতিল
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleStartEdit(item)}
                                className="font-mono-num font-bold text-lg text-slate-900 hover:text-emerald-700 hover:underline cursor-pointer flex items-baseline gap-1"
                                title="এডিট করতে ক্লিক করুন"
                              >
                                <span>{formatWeight(item.value, numeralStyle, 2)}</span>
                                <span className="text-xs font-sans text-slate-500 font-normal">কেজি</span>
                              </button>
                            )}

                            {/* Confidence / Edited status pill */}
                            {item.isEdited ? (
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                                সংশোধিত
                              </span>
                            ) : isLowConfidence ? (
                              <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                মিলিয়ে নিন
                              </span>
                            ) : null}
                          </div>

                          <div className="text-[11px] text-slate-500 truncate flex items-center gap-2">
                            <span>মূল লেখা: &quot;{item.originalText}&quot;</span>
                            {item.note && <span className="text-slate-400">• {item.note}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Right: Quick adjustment (+0.5, -0.5) & Delete */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const next = Math.max(0, +(item.value - 0.5).toFixed(2));
                            onUpdateWeight(item.id, next);
                          }}
                          className="w-7 h-7 flex items-center justify-center text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 active:scale-95"
                          title="-0.5 কেজি"
                        >
                          -½
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = +(item.value + 0.5).toFixed(2);
                            onUpdateWeight(item.id, next);
                          }}
                          className="w-7 h-7 flex items-center justify-center text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 active:scale-95"
                          title="+0.5 কেজি"
                        >
                          +½
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteWeight(item.id)}
                          className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
                          title="এই ওজন মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Finalize Button */}
            <div className="pt-4 mt-auto border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500 text-center sm:text-left">
                সব সংখ্যা সঠিক থাকলে নিচের বাটনে চাপ দিন
              </div>

              <button
                type="button"
                onClick={onConfirmTally}
                disabled={weights.length === 0}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold shadow-md shadow-emerald-700/20 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:pointer-events-none"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                <span>যাচাই সম্পন্ন • মোট হিসাব সংরক্ষণ করুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Image Lightbox Modal */}
      {showFullImageModal && imageDataUrl && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setShowFullImageModal(false)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 font-bold text-sm bg-slate-800/80 px-3 py-1 rounded-full"
            >
              ✕ বন্ধ করুন
            </button>
            <img
              src={imageDataUrl}
              alt="Handwritten note full preview"
              className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
