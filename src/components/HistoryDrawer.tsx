import React from 'react';
import { X, Trash2, Calendar, Scale, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { TallyRecord, NumeralStyle } from '../types';
import { formatWeight, formatCurrency, toBengaliNumerals } from '../utils/numberFormat';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  records: TallyRecord[];
  numeralStyle: NumeralStyle;
  onSelectRecord: (record: TallyRecord) => void;
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  records,
  numeralStyle,
  onSelectRecord,
  onDeleteRecord,
  onClearAll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-lg">সংরক্ষিত ওজনের খাতা</h3>
            <span className="text-xs font-mono bg-slate-200 px-2 py-0.5 rounded-full text-slate-700">
              {records.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {records.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Scale className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="font-medium text-slate-600">কোন হিসাব সংরক্ষিত নেই</p>
              <p className="text-xs text-slate-400 mt-1">
                ছবি স্ক্যান করে বা সংখ্যা লিখে নিশ্চিত করলে এখানে সংরক্ষিত থাকবে।
              </p>
            </div>
          ) : (
            records.map((rec) => (
              <div
                key={rec.id}
                onClick={() => {
                  onSelectRecord(rec);
                  onClose();
                }}
                className="p-3.5 bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-2xl cursor-pointer transition-all shadow-xs group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {rec.imageDataUrl ? (
                      <img
                        src={rec.imageDataUrl}
                        alt="Thumbnail"
                        className="w-12 h-12 object-cover rounded-xl border border-slate-300 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center font-bold text-xs shrink-0">
                        KG
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                        {rec.title || 'ওজন হিসাব'}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {new Date(rec.timestamp).toLocaleDateString('bn-BD', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRecord(rec.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-600">
                    {numeralStyle === 'bangla' ? toBengaliNumerals(rec.weights.length) : rec.weights.length}টি এন্ট্রি
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">মোট:</span>
                    <span className="font-bold font-mono-num text-emerald-700 text-sm">
                      {formatWeight(rec.totalKg, numeralStyle, 2)} কেজি
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {records.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs text-red-600 hover:text-red-700 font-semibold hover:underline"
            >
              সব ইতিহাস মুছে ফেলুন
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-700"
            >
              বন্ধ করুন
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
