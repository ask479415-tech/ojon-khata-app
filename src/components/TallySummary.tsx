import React, { useState } from 'react';
import {
  Scale,
  Printer,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Share2,
  RotateCcw,
  Edit3,
  Calculator,
  ChevronDown,
  ChevronUp,
  Package
} from 'lucide-react';
import { TallyRecord, NumeralStyle } from '../types';
import { formatWeight, formatCurrency, toBengaliNumerals, parseBengaliOrEnglishNumber } from '../utils/numberFormat';

interface TallySummaryProps {
  record: TallyRecord;
  numeralStyle: NumeralStyle;
  onEditAgain: () => void;
  onNewScan: () => void;
  onUpdateRecord: (updated: Partial<TallyRecord>) => void;
  onOpenExportModal: () => void;
}

export const TallySummary: React.FC<TallySummaryProps> = ({
  record,
  numeralStyle,
  onEditAgain,
  onNewScan,
  onUpdateRecord,
  onOpenExportModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(true);

  // Tare & Price states
  const [tareInput, setTareInput] = useState<string>(
    record.tarePerItemKg ? record.tarePerItemKg.toString() : '0'
  );
  const [priceInput, setPriceInput] = useState<string>(
    record.pricePerKg ? record.pricePerKg.toString() : ''
  );

  const itemCount = record.weights.length;
  const grossKg = record.totalKg;
  const tarePerItem = parseBengaliOrEnglishNumber(tareInput);
  const totalTare = tarePerItem * itemCount;
  const netKg = Math.max(0, grossKg - totalTare);
  const pricePerKg = parseBengaliOrEnglishNumber(priceInput);
  const totalAmount = pricePerKg > 0 ? netKg * pricePerKg : 0;

  const handleTareChange = (val: string) => {
    setTareInput(val);
    const parsed = parseBengaliOrEnglishNumber(val);
    const newNet = Math.max(0, grossKg - parsed * itemCount);
    onUpdateRecord({
      tarePerItemKg: parsed,
      netKg: newNet,
      totalAmount: pricePerKg > 0 ? newNet * pricePerKg : undefined,
    });
  };

  const handlePriceChange = (val: string) => {
    setPriceInput(val);
    const parsed = parseBengaliOrEnglishNumber(val);
    onUpdateRecord({
      pricePerKg: parsed > 0 ? parsed : undefined,
      totalAmount: parsed > 0 ? netKg * parsed : undefined,
    });
  };

  // Text-to-Speech voice announcement
  const speakTotal = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `মোট ওজন ${grossKg} কেজি। মোট এন্ট্রি ${itemCount} টি। ${
      totalAmount > 0 ? `সর্বমোট মূল্য ${Math.round(totalAmount)} টাকা।` : ''
    }`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'bn-BD';
    utterance.rate = 0.95;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Copy Tally to Clipboard (for WhatsApp / SMS)
  const copyTallyBreakdown = () => {
    const lines: string[] = [];
    lines.push(`⚖️ ওজন খাতার হিসাব (${new Date(record.timestamp).toLocaleDateString('bn-BD')})`);
    lines.push(`---------------------------------`);
    record.weights.forEach((w, i) => {
      lines.push(`${i + 1}. ${w.value} kg (${w.originalText})`);
    });
    lines.push(`---------------------------------`);
    lines.push(`📦 মোট বস্তা/এন্ট্রি: ${itemCount} টি`);
    lines.push(`⚖️ মোট ওজন (Gross): ${grossKg.toFixed(2)} KG`);
    if (totalTare > 0) {
      lines.push(`🗑️ বাদ দেওয়া ওজন (খালি বস্তা): ${totalTare.toFixed(2)} KG`);
      lines.push(`✨ নিট ওজন (Net): ${netKg.toFixed(2)} KG`);
    }
    if (pricePerKg > 0) {
      lines.push(`💵 দর প্রতি কেজি: ৳ ${pricePerKg}`);
      lines.push(`💰 সর্বমোট টাকা: ৳ ${totalAmount.toFixed(2)}`);
    }
    lines.push(`\nস্মার্ট ওজন খাতা অ্যাপ থেকে তৈরিকৃত`);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Print voucher memo
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">ওজনের হিসাব চূড়ান্ত ও সংরক্ষিত</h2>
            <p className="text-xs text-slate-500">
              {new Date(record.timestamp).toLocaleDateString('bn-BD', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={speakTotal}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
            title="শব্দ করে মোট ওজন শুনুন"
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span>থামুন</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-emerald-600" />
                <span>ভয়েস শুনুন</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all hover:scale-[1.02]"
            title="মেমো ছবি ডাউনলোড বা হোয়াটসঅ্যাপে শেয়ার"
          >
            <Share2 className="w-4 h-4" />
            <span>মেমো ছবি ও হোয়াটসঅ্যাপ শেয়ার</span>
          </button>

          <button
            type="button"
            onClick={copyTallyBreakdown}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>কপি হয়েছে!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>টেক্সট কপি</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট</span>
          </button>
        </div>
      </div>

      {/* Hero Display Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Gross Weight */}
        <div className="md:col-span-2 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
            <Scale className="w-56 h-56" />
          </div>

          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-emerald-200 text-xs sm:text-sm font-bold uppercase tracking-wider">
                  সর্বমোট ওজন (Gross Weight)
                </span>
                <span className="bg-emerald-900/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-emerald-100 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" />
                  {numeralStyle === 'bangla' ? toBengaliNumerals(itemCount) : itemCount}টি বস্তা / খাঁচা
                </span>
              </div>

              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-5xl sm:text-6xl font-black font-mono-num tracking-tight text-white drop-shadow-sm">
                  {formatWeight(grossKg, numeralStyle, 2)}
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-200">কেজি (KG)</span>
              </div>
            </div>

            {/* If Tare is applied, show Net weight highlighted */}
            {totalTare > 0 && (
              <div className="mt-4 pt-4 border-t border-emerald-500/50 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-emerald-200">
                  খালি বস্তার বাদ: -{formatWeight(totalTare, numeralStyle, 2)} কেজি
                </div>
                <div className="flex items-baseline gap-1.5 bg-emerald-900/80 px-3.5 py-1.5 rounded-xl border border-emerald-500/40">
                  <span className="text-xs text-emerald-300 font-semibold">নিট ওজন (Net):</span>
                  <span className="text-lg font-bold font-mono-num text-white">
                    {formatWeight(netKg, numeralStyle, 2)}
                  </span>
                  <span className="text-xs text-emerald-300">কেজি</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Total Price / Rate Calculation Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-3">
              <Calculator className="w-4 h-4 text-emerald-600" />
              <span>দর ও মূল্য নির্ধারণ (ঐচ্ছিক)</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  প্রতি কেজির দর (৳ Rate/KG)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">৳</span>
                  <input
                    type="text"
                    value={priceInput}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    placeholder="যেমন: ৫০ বা 50"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono-num font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  খালি খাঁচা/বস্তা বাদ (প্রতিটিতে কেজি)
                </label>
                <input
                  type="text"
                  value={tareInput}
                  onChange={(e) => handleTareChange(e.target.value)}
                  placeholder="0 বা ০.২"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono-num text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-medium block">সর্বমোট মূল্য:</span>
            <div className="text-2xl font-black text-emerald-700 font-mono-num">
              {formatCurrency(totalAmount, numeralStyle)}
            </div>
          </div>
        </div>
      </div>

      {/* Itemized Breakdown Table & Paper Memo */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowBreakdown((prev) => !prev)}
            className="flex items-center gap-2 font-bold text-slate-800 text-sm hover:text-emerald-700"
          >
            <span>ওজনের সম্পূর্ণ তালিকা ({numeralStyle === 'bangla' ? toBengaliNumerals(itemCount) : itemCount}টি আইটেম)</span>
            {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEditAgain}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>আবার সংশোধন করুন</span>
            </button>
          </div>
        </div>

        {showBreakdown && (
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {record.weights.map((w, idx) => (
                <div
                  key={w.id}
                  className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span className="font-mono font-semibold">#{numeralStyle === 'bangla' ? toBengaliNumerals(idx + 1) : idx + 1}</span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[60px]">
                      {w.originalText}
                    </span>
                  </div>
                  <div className="text-lg font-black font-mono-num text-slate-900 flex items-baseline justify-between">
                    <span>{formatWeight(w.value, numeralStyle, 2)}</span>
                    <span className="text-xs font-normal text-slate-500">কেজি</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Sum formula row */}
            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl font-mono-num leading-relaxed overflow-x-auto">
              <span className="font-sans font-semibold text-slate-700 mr-1">যোগফল সূত্র: </span>
              {record.weights.map((w) => formatWeight(w.value, numeralStyle, 2)).join(' + ')} ={' '}
              <span className="font-bold text-emerald-700 font-mono-num">
                {formatWeight(grossKg, numeralStyle, 2)} কেজি
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action Bar Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onEditAgain}
          className="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>সংখ্যা পুনরায় যাচাই করুন</span>
        </button>

        <button
          type="button"
          onClick={onNewScan}
          className="w-full sm:w-auto px-7 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-700/25 transition-all hover:scale-[1.01] flex items-center justify-center gap-2"
        >
          <Scale className="w-4 h-4" />
          <span>নতুন ওজন খাতা স্ক্যান করুন</span>
        </button>
      </div>
    </div>
  );
};
