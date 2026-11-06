import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Upload,
  Keyboard,
  History,
  RotateCcw,
  Sparkles,
  Scale,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Info,
  Download,
  User,
  Share2,
  Building,
  Check,
  Smartphone
} from 'lucide-react';
import { WeightItem, TallyRecord, NumeralStyle, UserProfile, BuyerInfo } from './types';
import { parseBengaliOrEnglishNumber, formatWeight, toBengaliNumerals } from './utils/numberFormat';
import { SAMPLE_SLIPS, SampleSlip } from './utils/sampleImages';
import { CameraModal } from './components/CameraModal';
import { VerificationPanel } from './components/VerificationPanel';
import { TallySummary } from './components/TallySummary';
import { HistoryDrawer } from './components/HistoryDrawer';
import { ExportShareModal } from './components/ExportShareModal';
import { LoginModal } from './components/LoginModal';
import { HowItWorksModal } from './components/HowItWorksModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { AndroidInstallModal } from './components/AndroidInstallModal';

type AppStep = 'idle' | 'scanning' | 'verifying' | 'summary';

const LOCAL_STORAGE_KEY = 'ojon_khata_records_v1';
const NUMERAL_PREF_KEY = 'ojon_khata_numeral_pref';
const PROFILES_KEY = 'ojon_khata_user_profiles_v1';
const CURRENT_USER_KEY = 'ojon_khata_current_user_v1';

export default function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>('idle');
  const [numeralStyle, setNumeralStyle] = useState<NumeralStyle>('bangla');

  // Active scan state
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [currentWeights, setCurrentWeights] = useState<WeightItem[]>([]);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('mixed');
  const [summaryNote, setSummaryNote] = useState<string>('');
  const [activeRecord, setActiveRecord] = useState<TallyRecord | null>(null);

  // User Profile & Authentication state
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Export & Share modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // App ZIP download loading state
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  // UI state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);
  const [scanErrorMessage, setScanErrorMessage] = useState<string | null>(null);

  // Manual input state
  const [isManualInputMode, setIsManualInputMode] = useState(false);
  const [manualText, setManualText] = useState('');

  // Stored records
  const [records, setRecords] = useState<TallyRecord[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load stored preferences & profiles on mount
  useEffect(() => {
    try {
      const savedPref = localStorage.getItem(NUMERAL_PREF_KEY) as NumeralStyle | null;
      if (savedPref) setNumeralStyle(savedPref);

      const savedRecords = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedRecords) {
        setRecords(JSON.parse(savedRecords));
      }

      const savedProfiles = localStorage.getItem(PROFILES_KEY);
      if (savedProfiles) {
        const parsed = JSON.parse(savedProfiles);
        setProfiles(parsed);
      }

      const savedUser = localStorage.getItem(CURRENT_USER_KEY);
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, []);

  const toggleNumeralStyle = () => {
    const next: NumeralStyle = numeralStyle === 'bangla' ? 'english' : 'bangla';
    setNumeralStyle(next);
    try {
      localStorage.setItem(NUMERAL_PREF_KEY, next);
    } catch (e) {}
  };

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } catch (e) {}
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(CURRENT_USER_KEY);
    } catch (e) {}
  };

  const handleCreateProfile = (newProfile: UserProfile) => {
    const updated = [...profiles.filter((p) => p.id !== newProfile.id), newProfile];
    setProfiles(updated);
    try {
      localStorage.setItem(PROFILES_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  const saveRecordToStorage = (newRecord: TallyRecord) => {
    const updated = [newRecord, ...records.filter((r) => r.id !== newRecord.id)].slice(0, 50);
    setRecords(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  // Perform Gemini OCR by calling server-side /api/ocr-weights
  const processImageForOCR = async (dataUrl: string) => {
  setCurrentImage(dataUrl);
  setScanErrorMessage('ছবি পড়তে Camera অথবা Gallery অপশন ব্যবহার করুন।');
  setCurrentStep('idle');
};
  // Handle sample slip click
  const handleSelectSample = (sample: any) => {
  const mapped: WeightItem[] = sample.expectedWeights.map(
    (value: number, index: number) => ({
      id: `sample-${Date.now()}-${index}`,
      value,
      originalText: String(value),
      confidence: 'high',
      note: '',
      isEdited: false,
    })
  );

  setCurrentImage(null);
  setCurrentWeights(mapped);
  setDetectedLanguage('mixed');
  setSummaryNote('Sample থেকে Offline হিসাব তৈরি হয়েছে।');
  setCurrentStep('verifying');
};
  // Handle local gallery upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
       setIsCameraOpen(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Manual text parse
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;

    // Split on comma, space, newline, plus
    const tokens = manualText.split(/[\n,+=; ]+/).filter(Boolean);
    const items: WeightItem[] = tokens.map((token, idx): WeightItem => {
      const val = parseBengaliOrEnglishNumber(token);
      return {
        id: `manual-${Date.now()}-${idx}`,
        value: val,
        originalText: token,
        confidence: 'high' as const,
        isEdited: false,
      };
    }).filter((item) => item.value > 0);

    if (items.length === 0) {
      alert('সঠিক ওজনের সংখ্যা পাওয়া যায়নি। যেমন: 1.5, 2, 3.5 লিখে চেষ্টা করুন।');
      return;
    }

    setCurrentImage(null);
    setCurrentWeights(items);
    setSummaryNote('ম্যানুয়ালি প্রবিষ্ট তালিকা। অনুগ্রহ করে যাচাই করে নিশ্চিত করুন।');
    setIsManualInputMode(false);
    setManualText('');
    setCurrentStep('verifying');
  };

  // Verification actions
  const handleUpdateWeight = (id: string, newValue: number, newOriginalText?: string) => {
    setCurrentWeights((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              value: newValue,
              originalText: newOriginalText || `${newValue}`,
              isEdited: true,
              confidence: 'high',
            }
          : item
      )
    );
  };

  const handleAddWeight = (value: number, originalText?: string) => {
    const newItem: WeightItem = {
      id: `manual-add-${Date.now()}`,
      value,
      originalText: originalText || `${value}`,
      confidence: 'high',
      isEdited: true,
    };
    setCurrentWeights((prev) => [...prev, newItem]);
  };

  const handleDeleteWeight = (id: string) => {
    setCurrentWeights((prev) => prev.filter((item) => item.id !== id));
  };

  // Confirm verification and advance to summary
  const handleConfirmTally = () => {
    const total = currentWeights.reduce((acc, curr) => acc + (curr.value || 0), 0);
    const newRecord: TallyRecord = {
      id: `tally-${Date.now()}`,
      title: `ওজন হিসাব (${currentWeights.length}টি এন্ট্রি)`,
      timestamp: Date.now(),
      weights: currentWeights,
      totalKg: total,
      tarePerItemKg: 0,
      netKg: total,
      imageDataUrl: currentImage || undefined,
      userId: currentUser?.id,
      creatorName: currentUser?.name,
      businessName: currentUser?.businessName,
    };

    setActiveRecord(newRecord);
    saveRecordToStorage(newRecord);
    setCurrentStep('summary');
  };

  const handleUpdateRecord = (updated: Partial<TallyRecord>) => {
    if (!activeRecord) return;
    const merged = { ...activeRecord, ...updated };
    setActiveRecord(merged);
    saveRecordToStorage(merged);
  };

  const handleSelectRecordFromHistory = (rec: TallyRecord) => {
    setActiveRecord(rec);
    setCurrentWeights(rec.weights);
    setCurrentImage(rec.imageDataUrl || null);
    setCurrentStep('summary');
  };

  const handleDeleteHistoryRecord = (id: string) => {
    const filtered = records.filter((r) => r.id !== id);
    setRecords(filtered);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {}
    if (activeRecord?.id === id) {
      setActiveRecord(null);
      setCurrentStep('idle');
    }
  };

  const handleClearAllHistory = () => {
    if (confirm('আপনি কি সত্যিই সমস্ত সংরক্ষিত হিসাব মুছে ফেলতে চান?')) {
      setRecords([]);
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch (e) {}
    }
  };

  // Download entire application source code ZIP
  const handleDownloadAppZip = async () => {
    setIsDownloadingZip(true);
    try {
      const response = await fetch('/api/download-app-zip');
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ojon-khata-app.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('App download failed:', err);
      // Fallback: direct window location
      window.location.href = '/api/download-app-zip';
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Camera Capture Modal */}
     <CameraModal
  isOpen={isCameraOpen}
  onClose={() => setIsCameraOpen(false)}
  onCapture={(detected) => {
    const mapped: WeightItem[] = detected.map((item, index) => ({
      id: `offline-${Date.now()}-${index}`,
      value: item.value,
      originalText: item.originalText,
      confidence: 'high',
      note: '',
      isEdited: false,
    }));

    setCurrentImage(null);
    setCurrentWeights(mapped);
    setDetectedLanguage('mixed');
    setSummaryNote('ফোনে Offline ML Kit দিয়ে ওজন শনাক্ত করা হয়েছে। যোগ করার আগে যাচাই করুন।');
    setCurrentStep('verifying');
  }}
/>

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        records={records}
        numeralStyle={numeralStyle}
        onSelectRecord={handleSelectRecordFromHistory}
        onDeleteRecord={handleDeleteHistoryRecord}
        onClearAll={handleClearAllHistory}
      />

      {/* Login & Profile Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentUser={currentUser}
        profiles={profiles}
        onLogin={handleLogin}
        onCreateProfile={handleCreateProfile}
        onLogout={handleLogout}
      />

      {/* Export & WhatsApp Share Modal */}
      {activeRecord && (
        <ExportShareModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          record={activeRecord}
          userProfile={currentUser}
          numeralStyle={numeralStyle}
          onUpdateBuyerInfo={(info) => {
            handleUpdateRecord({ buyerInfo: info });
          }}
        />
      )}

      {/* How It Works Help Modal */}
      <HowItWorksModal
        isOpen={showHowItWorks}
        onClose={() => setShowHowItWorks(false)}
        onStartCamera={() => setIsCameraOpen(true)}
      />

      {/* Android Phone App Modal */}
      <AndroidInstallModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
        onDownloadZip={handleDownloadAppZip}
      />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Logo & Title */}
          <button
            type="button"
            onClick={() => setIsCameraOpen(true)}
            className="flex items-center gap-2.5 text-left focus:outline-none group shrink-0"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-700 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-900/20 group-hover:scale-105 transition-transform">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-slate-900 tracking-tight leading-none group-hover:text-emerald-700 transition-colors">
                  ওজন খাতা
                </h1>
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline">
                  OCR Calculator
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentUser?.businessName || 'হাতে লেখা ওজন স্ক্যান ও স্বয়ংক্রিয় যোগফল'}
              </p>
            </div>
          </button>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Dedicated Android App Button */}
            <button
              type="button"
              onClick={() => setIsAndroidModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-950/20 transition-all hover:scale-[1.02] active:scale-95"
              title="অ্যান্ড্রয়েড ফোন অ্যাপ ইনস্টল করুন"
            >
              <Smartphone className="w-4 h-4 text-emerald-200" />
              <span>Android App</span>
            </button>

            {/* Install PWA Mobile App Button */}
            <PWAInstallButton />

            {/* Download App ZIP Button */}
            <button
              type="button"
              onClick={handleDownloadAppZip}
              disabled={isDownloadingZip}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all shadow-2xs hover:scale-[1.02] disabled:opacity-50"
              title="সম্পূর্ণ অ্যাপের ফাইল/সোর্স কোড জিপ (ZIP) ডাউনলোড করুন"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">
                {isDownloadingZip ? 'ডাউনলোড হচ্ছে...' : 'অ্যাপ ডাউনলোড (ZIP)'}
              </span>
              <span className="sm:hidden">ZIP</span>
            </button>

            {/* User Profile / Login Button */}
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
              title="ব্যবহারকারী প্রোফাইল ও লগইন"
            >
              {currentUser ? (
                <>
                  <div
                    className={`w-5 h-5 rounded-full ${
                      currentUser.avatarColor || 'bg-emerald-600'
                    } text-white flex items-center justify-center text-[10px] font-bold`}
                  >
                    {currentUser.name.charAt(0)}
                  </div>
                  <span className="font-bold text-slate-900 hidden sm:inline truncate max-w-[100px]">
                    {currentUser.name}
                  </span>
                </>
              ) : (
                <>
                  <User className="w-4 h-4 text-slate-500" />
                  <span className="hidden sm:inline">লগইন</span>
                </>
              )}
            </button>

            {/* Numeral Style Switcher */}
            <button
              type="button"
              onClick={toggleNumeralStyle}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
              title="সংখ্যা ফরম্যাট পরিবর্তন করুন (বাংলা / ইংরেজি)"
            >
              <span className="text-emerald-700 font-bold">
                {numeralStyle === 'bangla' ? '১ ২ ৩' : '1 2 3'}
              </span>
            </button>

            {/* How to use button */}
            <button
              type="button"
              onClick={() => setShowHowItWorks(true)}
              className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
              title="ব্যবহারের নিয়ম দেখুন"
            >
              <HelpCircle className="w-5 h-5 text-emerald-600" />
            </button>

            {/* History Button */}
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="relative p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
              title="সংরক্ষিত ইতিহাস দেখুন"
            >
              <History className="w-5 h-5 text-slate-600" />
              {records.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center font-mono">
                  {records.length > 9 ? '9+' : records.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col">
        {/* Error notification if any */}
        {scanErrorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start justify-between gap-3 text-sm text-red-900 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-950">ছবি পড়তে সমস্যা হয়েছে</p>
                <p className="mt-0.5 text-xs text-red-800">{scanErrorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setScanErrorMessage(null)}
              className="text-xs font-semibold text-red-700 hover:text-red-900 px-2 py-1 rounded-md"
            >
              ✕
            </button>
          </div>
        )}

        {/* STEP 1: IDLE / WELCOME / SCAN HUB */}
        {currentStep === 'idle' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Hero Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-emerald-600/30">
              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 text-emerald-200 text-xs font-medium mb-3 backdrop-blur-md border border-emerald-500/20">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>AI Powered Handwritten Weight OCR</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                  হাতে লেখা ওজনের তালিকা থেকে সরাসরি যোগফল ও মেমো প্রস্তুত
                </h2>
                <p className="mt-2 text-sm sm:text-base text-emerald-100 leading-relaxed">
                  কাগজ, ডায়রি বা বস্তার গায়ে লেখা <strong>1.5, 2, 3.5</strong> বা <strong>১.৫, ২, ৩.৫</strong> এর মতো ওজনের ছবি তুলুন। যোগ করার আগে প্রতিটি সংখ্যা মিলিয়ে নিয়ে ভুল থাকলে সংশোধন করুন এবং হোয়াটসঅ্যাপে চালান ছবি পাঠান।
                </p>

                {/* Primary Action Buttons */}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="flex items-center gap-2 px-6 py-3.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-2xl font-bold text-sm sm:text-base shadow-lg shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    <Camera className="w-5 h-5 text-emerald-600" />
                    <span>ক্যামেরা দিয়ে ছবি তুলুন</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-5 py-3.5 bg-emerald-600/60 hover:bg-emerald-600 text-white border border-emerald-400/40 rounded-2xl font-semibold text-sm sm:text-base backdrop-blur-md transition-colors"
                  >
                    <Upload className="w-5 h-5 text-emerald-200" />
                    <span>ছবি আপলোড করুন</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAndroidModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-3.5 bg-emerald-500/30 hover:bg-emerald-500/40 text-white border border-emerald-400/50 rounded-2xl font-bold text-sm sm:text-base backdrop-blur-md transition-all hover:scale-[1.02]"
                  >
                    <Smartphone className="w-5 h-5 text-emerald-300" />
                    <span>Android App</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsManualInputMode((prev) => !prev)}
                    className="flex items-center gap-2 px-4 py-3 bg-emerald-900/60 hover:bg-emerald-900/90 text-emerald-200 rounded-2xl text-xs sm:text-sm font-medium transition-colors"
                  >
                    <Keyboard className="w-4 h-4" />
                    <span>লিখে হিসাব</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowHowItWorks(true)}
                    className="flex items-center gap-2 px-4 py-3 bg-emerald-900/60 hover:bg-emerald-900/90 text-emerald-200 rounded-2xl text-xs sm:text-sm font-medium border border-emerald-500/20 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>নিয়মাবলী</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadAppZip}
                    disabled={isDownloadingZip}
                    className="flex items-center gap-2 px-4 py-3 bg-emerald-950/70 hover:bg-black/40 text-emerald-200 rounded-2xl text-xs sm:text-sm font-medium border border-emerald-400/30 transition-colors"
                    title="অ্যাপের ফাইল জিপ ডাউনলোড"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>{isDownloadingZip ? 'ডাউনলোড হচ্ছে...' : 'অ্যাপ ফাইল (ZIP)'}</span>
                  </button>
                </div>
              </div>

              {/* Decorative background watermark */}
              <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 pointer-events-none">
                <Scale className="w-72 h-72 text-white" />
              </div>
            </div>

            {/* Quick Manual Entry Expandable Form */}
            {isManualInputMode && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-in slide-in-from-top-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Keyboard className="w-4 h-4 text-emerald-600" />
                    <span>ক্যামেরা ছাড়া সরাসরি ওজন লিখে হিসাব করুন</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsManualInputMode(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  সংখ্যাগুলো কমা (,), স্পেস বা প্লাস (+) দিয়ে লিখুন। যেমন: <span className="font-mono text-emerald-700 font-bold">1.5, 2, 3.5, 4.25</span> অথবা <span className="font-mono text-emerald-700 font-bold">১.৫, ২, ৩.৫</span>
                </p>
                <form onSubmit={handleManualSubmit} className="space-y-3">
                  <textarea
                    rows={3}
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    placeholder="যেমন: 1.5, 2, 3.5, 10, 0.75..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono-num focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsManualInputMode(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      disabled={!manualText.trim()}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                    >
                      যাচাই ও যোগফল দেখুন
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Verification Guarantee Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">ভুল সংশোধনের নিশ্চয়তা</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    হাতের লেখা OCR সবসময় নিখুঁত না হওয়ার কারণে যোগ করার আগে বড় প্রিভিউতে মিলিয়ে ভুল সংখ্যা ঠিক করে নেওয়ার পূর্ণ সুযোগ রয়েছে।
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">হোয়াটসঅ্যাপ মেমো ও ছবি</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    হিসাব শেষ হলে সরাসরি চালান স্লিপ ইমেজ (PNG) অথবা সাজানো টেক্সট মেসেজ এক ক্লিকেই হোয়াটসঅ্যাপে ক্রেতাকে পাঠাতে পারেন।
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <Scale className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">বস্তা বাদ ও দর হিসাব</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    মোট কেজির পাশাপাশি খাঁচা/বস্তার ওজন বাদ দিয়ে নিট কেজি এবং প্রতি কেজির দর অনুযায়ী মোট টাকাও বের করা যায়।
                  </p>
                </div>
              </div>
            </div>

            {/* Test with Realistic Samples Section */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>বাস্তব নমুনা স্লিপ দিয়ে এখনই টেস্ট করুন</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    কাছে কাগজ না থাকলেও নিচের যেকোনো নমুনা ক্লিক করে অ্যাপের OCR এবং যাচাইকরণ পরীক্ষা করতে পারেন:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {SAMPLE_SLIPS.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleSelectSample(sample)}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 bg-slate-50/70 hover:bg-emerald-50/40 text-left transition-all hover:scale-[1.01] active:scale-95 group shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                          {sample.name.split(':')[0]}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-xs text-slate-600 mt-1.5 font-medium line-clamp-2">
                        {sample.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{sample.expectedWeights.length}টি ওজন</span>
                      <span className="font-semibold text-emerald-700 font-mono-num">
                        মোট ~ {sample.expectedWeights.reduce((a, b) => a + b, 0).toFixed(1)} KG
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: SCANNING IN PROGRESS */}
        {currentStep === 'scanning' && (
          <div className="flex-1 flex flex-col items-center justify-center py-16 animate-in fade-in duration-300 text-center">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center animate-pulse">
                <Scale className="w-12 h-12 text-emerald-600" />
              </div>
              <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-1">
              হাতে লেখা ওজন স্ক্যান করা হচ্ছে...
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mb-4">
              Gemini 3.8 Flash মডেল দিয়ে ছবিতে লেখা 1.5, 2, 3.5 বা ১.৫, ২, ৩.৫ ইত্যাদি সংখ্যা সনাক্ত করা হচ্ছে।
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-200/70 rounded-full text-xs text-slate-700 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>একটু অপেক্ষা করুন, এরপর যাচাইকরণ স্ক্রিনে নিয়ে যাওয়া হবে</span>
            </div>
          </div>
        )}

        {/* STEP 3: VERIFICATION & CORRECTION STUDIO */}
        {currentStep === 'verifying' && (
          <VerificationPanel
            imageDataUrl={currentImage}
            weights={currentWeights}
            detectedLanguage={detectedLanguage}
            summaryNote={summaryNote}
            numeralStyle={numeralStyle}
            onUpdateWeight={handleUpdateWeight}
            onAddWeight={handleAddWeight}
            onDeleteWeight={handleDeleteWeight}
            onConfirmTally={handleConfirmTally}
            onRetake={() => setIsCameraOpen(true)}
          />
        )}

        {/* STEP 4: FINAL SUMMARY & TALLY RECEIPT */}
        {currentStep === 'summary' && activeRecord && (
          <TallySummary
            record={activeRecord}
            numeralStyle={numeralStyle}
            onEditAgain={() => setCurrentStep('verifying')}
            onNewScan={() => {
              setCurrentImage(null);
              setCurrentWeights([]);
              setActiveRecord(null);
              setCurrentStep('idle');
            }}
            onUpdateRecord={handleUpdateRecord}
            onOpenExportModal={() => setIsExportModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-3.5 px-4 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            ওজন খাতা • হাতে লেখা ওজনের স্মার্ট স্ক্যানার ও ক্যালকুলেটর (স্বয়ংক্রিয় যোগফল ও যাচাইকরণ)
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadAppZip}
              className="text-emerald-700 hover:underline font-semibold flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>অ্যাপ ফাইল ডাউনলোড (.zip)</span>
            </button>
            <span className="text-slate-400">•</span>
            <span className="text-slate-400">Powered by Gemini 3.8 Flash</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
