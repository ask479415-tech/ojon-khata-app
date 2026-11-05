import React from 'react';
import {
  X,
  Smartphone,
  Download,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight
} from 'lucide-react';
import { usePWAInstall } from '../usePWAInstall';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadZip: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  isOpen,
  onClose,
  onDownloadZip,
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[94vh] overflow-hidden">
        {/* Header with Android Badge */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-800 to-teal-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md text-emerald-300 flex items-center justify-center font-bold border border-white/20">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">অ্যান্ড্রয়েড ফোন অ্যাপ (Android App)</h3>
                <span className="text-[10px] font-bold bg-emerald-400 text-emerald-950 px-2 py-0.5 rounded-full uppercase">
                  WebAPK / PWA
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                প্লে-স্টোর ছাড়াই সরাসরি আপনার অ্যান্ড্রয়েড ফোনে ইন্সটল করুন
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-emerald-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Status Box */}
          {isInstalled ? (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center gap-3 text-emerald-900">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-sm">অভিনন্দন! অ্যাপটি আপনার ফোনে ইনস্টল করা আছে</p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  আপনি সরাসরি আপনার মোবাইলের হোম স্ক্রিন থেকে ওজনের খাতা ব্যবহার করতে পারেন।
                </p>
              </div>
            </div>
          ) : isInstallable ? (
            /* 1-Click Android Chrome Installation */
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-500 rounded-3xl p-5 text-center space-y-3 shadow-md">
              <div className="inline-flex p-3 bg-emerald-600 text-white rounded-2xl shadow-md">
                <Smartphone className="w-8 h-8" />
              </div>
              <h4 className="font-black text-slate-900 text-lg">
                এক ক্লিকে আপনার ফোনে অ্যাপ তৈরি করুন
              </h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                নিচের বাটনে চাপ দিলে আপনার অ্যান্ড্রয়েড ফোনে <strong>&quot;ওজন খাতা&quot;</strong> নামে একটি নিজস্ব অ্যাপ তৈরি হয়ে যাবে।
              </p>
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl font-bold text-sm sm:text-base shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                <span>অ্যান্ড্রয়েড ফোনে এখনই অ্যাপ ইনস্টল করুন</span>
              </button>
            </div>
          ) : (
            /* Visual 3-Step Guide for Android Browsers */
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                অ্যান্ড্রয়েড ফোনে ইন্সটল করার সহজ ৩টি ধাপ
              </span>

              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0 font-mono">
                    ১
                  </span>
                  <div>
                    আপনার অ্যান্ড্রয়েড ফোনে <strong>Google Chrome</strong> ব্রাউজারে এই লিংকটি ওপেন করুন।
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0 font-mono">
                    ২
                  </span>
                  <div>
                    ক্রোম ব্রাউজারের উপরের ডানপাশের <strong>৩টি ডট মেনু (⋮)</strong>-তে চাপ দিন।
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0 font-mono">
                    ৩
                  </span>
                  <div>
                    মেনু থেকে <strong>&quot;Install app&quot;</strong> অথবা <strong>&quot;Add to Home screen&quot;</strong> (হোম স্ক্রিনে যোগ করুন) চাপুন।
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-emerald-800 bg-emerald-100/70 p-2.5 rounded-xl font-medium">
                ✅ সাথে সাথে আপনার ফোনে <strong>&quot;ওজন খাতা&quot;</strong> এর অফিসিয়াল লোগো সহ অ্যাপ চলে আসবে! কোনো প্লে-স্টোর ছাড়াই ফুলস্ক্রিনে চলবে।
              </p>
            </div>
          )}

          {/* Android Feature Highlights */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>কোন মেগাবাইট খরচ নেই</span>
              </div>
              <p className="text-slate-500 text-[11px] leading-tight">
                ভারী APK ফাইলের চেয়ে এটি দ্রুত চলে এবং ফোনের স্টোরেজ নষ্ট করে না।
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>নিরাপদ ও ভাইরাস মুক্ত</span>
              </div>
              <p className="text-slate-500 text-[11px] leading-tight">
                গুগল ক্রোম সুরক্ষিত স্যান্ডবক্স পরিবেশের ভেতর সরাসরি চলে।
              </p>
            </div>
          </div>

          {/* Developer / APK Wrap Option */}
          <div className="p-4 bg-slate-900 text-slate-300 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center justify-between text-white font-bold">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>সম্পূর্ণ সোর্স কোড ও অ্যান্ড্রয়েড স্টুডিও প্রজেক্ট</span>
              </span>
              <button
                type="button"
                onClick={onDownloadZip}
                className="text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg font-semibold flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ZIP ডাউনলোড</span>
              </button>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              আপনি যদি নিজেই Android Studio দিয়ে আলাদা <strong>.apk</strong> ফাইল বিল্ড করতে চান, তবে জিপ ফাইলটি ডাউনলোড করে <code className="text-emerald-300 bg-slate-800 px-1 py-0.5 rounded">npx cap add android</code> দিয়ে সরাসরি অ্যান্ড্রয়েড এপিকে তৈরি করতে পারবেন।
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            অ্যান্ড্রয়েড ফোনের জন্য ১০০% অপ্টিমাইজড
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
