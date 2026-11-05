import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  Image as ImageIcon,
  FileText,
  MessageCircle,
  Building,
  User,
  Package,
  Printer,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { TallyRecord, NumeralStyle, UserProfile, BuyerInfo } from '../types';
import { generateMemoCanvas, downloadMemoImage, shareMemoImage } from '../utils/generateMemoImage';
import { formatWeight, formatCurrency, toBengaliNumerals } from '../utils/numberFormat';

interface ExportShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: TallyRecord;
  userProfile: UserProfile | null;
  numeralStyle: NumeralStyle;
  onUpdateBuyerInfo?: (info: BuyerInfo) => void;
}

export const ExportShareModal: React.FC<ExportShareModalProps> = ({
  isOpen,
  onClose,
  record,
  userProfile,
  numeralStyle,
  onUpdateBuyerInfo,
}) => {
  const [activeTab, setActiveTab] = useState<'image' | 'text'>('image');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImageSrc, setPreviewImageSrc] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Editable fields for the memo
  const [businessName, setBusinessName] = useState(
    userProfile?.businessName || record.businessName || 'মেসার্স ওজন খাতা ট্রেডার্স'
  );
  const [buyerName, setBuyerName] = useState(record.buyerInfo?.buyerName || '');
  const [itemType, setItemType] = useState(record.buyerInfo?.itemType || 'আলু');
  const [memoNo, setMemoNo] = useState(
    record.buyerInfo?.memoNo || `MEMO-${record.id.slice(-6).toUpperCase()}`
  );

  // Generate preview image whenever fields or activeTab change
  const refreshCanvasPreview = async () => {
    setIsGenerating(true);
    try {
      const buyerInfo: BuyerInfo = {
        buyerName: buyerName.trim() || undefined,
        itemType: itemType.trim() || undefined,
        memoNo: memoNo.trim() || undefined,
      };

      const canvas = await generateMemoCanvas({
        record: {
          ...record,
          businessName,
        },
        userProfile: userProfile ? { ...userProfile, businessName } : null,
        buyerInfo,
        numeralStyle,
      });

      setPreviewImageSrc(canvas.toDataURL('image/png', 0.95));
      if (onUpdateBuyerInfo) {
        onUpdateBuyerInfo(buyerInfo);
      }
    } catch (e) {
      console.error('Failed to generate memo image:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshCanvasPreview();
    }
  }, [isOpen, businessName, buyerName, itemType, memoNo, numeralStyle]);

  if (!isOpen) return null;

  // Build formatted text summary
  const generateFormattedText = () => {
    const lines: string[] = [];
    const dateFormatted = new Date(record.timestamp).toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    lines.push(`⚖️ *ওজন চালান ও ক্যাশ মেমো*`);
    lines.push(`🏪 *${businessName}*`);
    if (userProfile?.phone) lines.push(`📞 মোবাইল: ${userProfile.phone}`);
    lines.push(`📅 তারিখ: ${dateFormatted}`);
    if (memoNo) lines.push(`📄 চালান নং: ${memoNo}`);
    if (buyerName) lines.push(`👤 ক্রেতা/বেপারী: ${buyerName}`);
    if (itemType) lines.push(`📦 পণ্য: ${itemType}`);
    lines.push(`-----------------------------------`);
    lines.push(`📋 *ওজনের বিবরণ:*`);

    record.weights.forEach((w, i) => {
      const idxStr = numeralStyle === 'bangla' ? toBengaliNumerals(i + 1) : `${i + 1}`;
      const weightStr = formatWeight(w.value, numeralStyle, 2);
      lines.push(`${idxStr}. ${weightStr} কেজি (${w.originalText})`);
    });

    lines.push(`-----------------------------------`);
    lines.push(
      `📦 মোট বস্তা/এন্ট্রি: ${
        numeralStyle === 'bangla' ? toBengaliNumerals(record.weights.length) : record.weights.length
      } টি`
    );
    lines.push(`⚖️ সর্বমোট ওজন (Gross): ${formatWeight(record.totalKg, numeralStyle, 2)} কেজি`);

    const tareTotal = (record.tarePerItemKg || 0) * record.weights.length;
    if (tareTotal > 0) {
      lines.push(
        `🗑️ খালি বস্তার বাদ: -${formatWeight(tareTotal, numeralStyle, 2)} কেজি (প্রতিটিতে ${formatWeight(
          record.tarePerItemKg || 0,
          numeralStyle,
          2
        )} কেজি)`
      );
      lines.push(`✨ নিট ওজন (Net): ${formatWeight(record.netKg || record.totalKg, numeralStyle, 2)} কেজি`);
    }

    if (record.pricePerKg && record.pricePerKg > 0) {
      lines.push(`💵 দর প্রতি কেজি: ৳ ${formatWeight(record.pricePerKg, numeralStyle)}`);
      lines.push(
        `💰 সর্বমোট টাকা: ${formatCurrency(
          record.totalAmount || (record.netKg || record.totalKg) * record.pricePerKg,
          numeralStyle
        )}`
      );
    }
    lines.push(`-----------------------------------`);
    lines.push(`_স্মার্ট ওজন খাতা (Ojon Khata) অ্যাপ থেকে তৈরিকৃত_`);

    return lines.join('\n');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateFormattedText());
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleShareWhatsAppText = () => {
    const text = encodeURIComponent(generateFormattedText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleDownloadImage = () => {
    const buyerInfo: BuyerInfo = {
      buyerName: buyerName.trim() || undefined,
      itemType: itemType.trim() || undefined,
      memoNo: memoNo.trim() || undefined,
    };
    downloadMemoImage({
      record: { ...record, businessName },
      userProfile: userProfile ? { ...userProfile, businessName } : null,
      buyerInfo,
      numeralStyle,
    });
  };

  const handleShareImage = async () => {
    const buyerInfo: BuyerInfo = {
      buyerName: buyerName.trim() || undefined,
      itemType: itemType.trim() || undefined,
      memoNo: memoNo.trim() || undefined,
    };
    const success = await shareMemoImage({
      record: { ...record, businessName },
      userProfile: userProfile ? { ...userProfile, businessName } : null,
      buyerInfo,
      numeralStyle,
    });
    if (success) {
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2500);
    }
  };

  const handleCopyImageToClipboard = async () => {
    try {
      const buyerInfo: BuyerInfo = {
        buyerName: buyerName.trim() || undefined,
        itemType: itemType.trim() || undefined,
        memoNo: memoNo.trim() || undefined,
      };
      const canvas = await generateMemoCanvas({
        record: { ...record, businessName },
        userProfile: userProfile ? { ...userProfile, businessName } : null,
        buyerInfo,
        numeralStyle,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          setCopiedImage(true);
          setTimeout(() => setCopiedImage(false), 2500);
        } catch (e) {
          console.warn('Clipboard image write failed, downloading instead:', e);
          handleDownloadImage();
        }
      }, 'image/png');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[94vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                ওজন চালান এক্সপোর্ট ও হোয়াটসঅ্যাপে শেয়ার
              </h3>
              <p className="text-xs text-slate-500">
                ছবি (Image Slip) বা টেক্সট সামারি হিসেবে সরাসরি কাস্টমার বা ব্যাপারীকে পাঠান
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 bg-white border-b border-slate-100 flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-2 pb-2.5 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'image'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>চালান মেমো ছবি (Image Slip)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 pb-2.5 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'text'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>টেক্সট মেসেজ সামারি (WhatsApp Text)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Memo Customization Bar */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Building className="w-3.5 h-3.5 text-emerald-600" />
              মেমোর তথ্য পরিবর্তন (ব্র্যান্ডিং ও ক্রেতা)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">দোকান/আড়তের নাম</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="যেমন: করিম ব্রাদার্স"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">ক্রেতা/বেপারীর নাম</label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="যেমন: রহিম সাহেব"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">পণ্যের বিবরণ</label>
                <input
                  type="text"
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value)}
                  placeholder="যেমন: আলু, মাছ, ধান"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">চালান মেমো নং</label>
                <input
                  type="text"
                  value={memoNo}
                  onChange={(e) => setMemoNo(e.target.value)}
                  placeholder="MEMO-001"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* TAB 1: IMAGE PREVIEW */}
          {activeTab === 'image' && (
            <div className="space-y-4">
              <div className="relative bg-slate-900/5 rounded-2xl border border-slate-200 p-3 sm:p-4 flex items-center justify-center min-h-[320px] max-h-[440px] overflow-auto">
                {isGenerating ? (
                  <div className="flex items-center gap-2 text-slate-600 text-sm">
                    <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
                    <span>মেমো স্লিপ তৈরি হচ্ছে...</span>
                  </div>
                ) : previewImageSrc ? (
                  <img
                    src={previewImageSrc}
                    alt="Weight Memo Voucher Slip"
                    className="max-h-[400px] w-auto object-contain rounded-xl shadow-lg border border-slate-200"
                  />
                ) : null}
              </div>

              {/* Action Buttons for Image */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={handleShareImage}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-800/20 transition-all hover:scale-[1.01]"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>হোয়াটসঅ্যাপে পাঠান (Share)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadImage}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold text-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>ছবি ডাউনলোড (PNG)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyImageToClipboard}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-xl font-semibold text-sm transition-colors"
                >
                  {copiedImage ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>ছবি কপি হয়েছে!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>ছবি কপি করুন</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: FORMATTED TEXT PREVIEW */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div className="relative">
                <pre className="p-4 bg-slate-900 text-emerald-400 rounded-2xl text-xs sm:text-sm font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[380px] shadow-inner border border-slate-800">
                  {generateFormattedText()}
                </pre>
              </div>

              {/* Actions for Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleShareWhatsAppText}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md transition-all hover:scale-[1.01]"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>সরাসরি হোয়াটসঅ্যাপে পাঠান</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyText}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-xl font-semibold text-sm transition-colors"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>মেমো টেক্সট কপি হয়েছে!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>সম্পূর্ণ টেক্সট কপি করুন</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>মেমোর ছবি উচ্চ রেজুলেশনে ডাউনলোড হবে</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-semibold"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
