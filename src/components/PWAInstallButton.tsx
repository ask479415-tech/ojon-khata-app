import React, { useState } from 'react';
import { Smartphone, Download, Check, X, Share } from 'lucide-react';
import { usePWAInstall } from '../usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // If already running as an installed PWA on mobile home screen
  if (isInstalled) {
    return (
      <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold">
        <Check className="w-3.5 h-3.5" />
        <span>অ্যাপ ইন্সটল্ড</span>
      </div>
    );
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-900/20 transition-all hover:scale-[1.02] active:scale-95"
        title="মোবাইল স্ক্রিনে অ্যাপ হিসেবে ইন্সটল করুন"
      >
        <Smartphone className="w-4 h-4 text-emerald-200" />
        <span className="hidden sm:inline">মোবাইলে অ্যাপ ইন্সটল</span>
        <span className="sm:hidden">অ্যাপ ইন্সটল</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 transition-colors"
          title="আইফোনে অ্যাপ ইন্সটল করুন"
        >
          <Smartphone className="w-4 h-4 text-slate-600" />
          <span>iPhone এ ইন্সটল</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                  <span>iPhone / iPad এ অ্যাপ ইন্সটল</span>
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-700">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0 font-mono">
                    ১
                  </span>
                  <div>
                    Safari ব্রাউজারের নিচের <strong>Share (শেয়ার)</strong> বাটনে চাপ দিন।
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0 font-mono">
                    ২
                  </span>
                  <div>
                    নিচে স্ক্রোল করে <strong>&quot;Add to Home Screen&quot;</strong> (হোম স্ক্রিনে যোগ করুন) চাপুন।
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-emerald-50 text-emerald-900 rounded-xl">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    এবার আপনার আইফোনে এটি সাধারণ মোবাইল অ্যাপের মতো ফুলস্ক্রিনে চলবে!
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
              >
                বুঝেছি, বন্ধ করুন
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Generic mobile fallback button with guide
  return (
    <>
      <button
        type="button"
        onClick={() => setShowHelpModal(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-900/20 transition-all hover:scale-[1.02]"
        title="মোবাইল অ্যাপ তৈরির নির্দেশিকা"
      >
        <Smartphone className="w-4 h-4 text-emerald-200" />
        <span className="hidden sm:inline">মোবাইল অ্যাপ</span>
        <span className="sm:hidden">অ্যাপ</span>
      </button>

      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                <span>মোবাইলে অ্যাপ ইনস্টল করার নিয়ম</span>
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <p className="leading-relaxed">
                এই অ্যাপটি সম্পূর্ণ <strong>Progressive Web App (PWA)</strong> হিসেবে তৈরি।
              </p>
              <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                <div className="font-semibold text-slate-900">Android ফোনে:</div>
                <p>Chrome ব্রাউজারের ৩ ডট মেনু (⋮) তে চাপ দিয়ে <strong>&quot;Install app&quot;</strong> বা <strong>&quot;Add to Home screen&quot;</strong> চাপুন।</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                <div className="font-semibold text-slate-900">iPhone এ:</div>
                <p>Safari ব্রাউজারে Share আইকনে চাপ দিয়ে <strong>&quot;Add to Home Screen&quot;</strong> চাপুন।</p>
              </div>
              <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2.5 rounded-lg font-medium">
                ইনস্টল করলে মোবাইলের হোম স্ক্রিনে অ্যাপ আইকন চলে আসবে এবং ফুলস্ক্রিনে কাজ করবে!
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="mt-4 w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}
    </>
  );
};
