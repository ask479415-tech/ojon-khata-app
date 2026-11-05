import React from 'react';
import {
  X,
  Camera,
  CheckCircle2,
  Scale,
  Share2,
  ArrowRight,
  Sparkles,
  HelpCircle,
  FileCheck,
  Edit3
} from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCamera: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({
  isOpen,
  onClose,
  onStartCamera,
}) => {
  if (!isOpen) return null;

  const steps = [
    {
      step: '১',
      title: 'ওজন খাতার ছবি তুলুন',
      desc: 'কাগজ, ডায়রি বা বস্তার গায়ে লেখা 1.5, 2, 3.5 বা ১.৫, ২, ৩.৫ ইত্যাদি ওজনের স্পষ্ট ছবি তুলুন অথবা গ্যালারি থেকে আপলোড করুন।',
      icon: Camera,
      badge: 'ক্যামেরা স্ক্যান',
      color: 'bg-emerald-100 text-emerald-800',
    },
    {
      step: '২',
      title: 'যাচাই ও ভুল সংশোধন করুন',
      desc: 'মূল ছবির সাথে মিলিয়ে দেখুন। হাতের লেখা অস্পষ্ট হলে যেকোনো সংখ্যায় ক্লিক করে সরাসরি সংশোধন করুন অথবা বাদ পড়া ওজন যোগ করুন।',
      icon: Edit3,
      badge: 'খুবই গুরুত্বপূর্ণ ধাপ',
      color: 'bg-amber-100 text-amber-900',
    },
    {
      step: '৩',
      title: 'মোট ওজন ও দর হিসাব',
      desc: 'স্বয়ংক্রিয়ভাবে মোট কেজি (Gross KG), বস্তার বাদ দেওয়া ওজন এবং প্রতি কেজির দর অনুযায়ী সর্বমোট টাকার হিসাব তৈরি হয়ে যাবে।',
      icon: Scale,
      badge: 'স্বয়ংক্রিয় যোগফল',
      color: 'bg-blue-100 text-blue-800',
    },
    {
      step: '৪',
      title: 'হোয়াটসঅ্যাপে চালান মেমো পাঠান',
      desc: 'আপনার দোকান/আড়তের নাম দিয়ে ডিজিটাল চালান মেমোর ছবি (PNG) বা টেক্সট তৈরি করে এক ক্লিকেই হোয়াটসঅ্যাপে ক্রেতাকে পাঠান।',
      icon: Share2,
      badge: 'সহজ শেয়ার',
      color: 'bg-teal-100 text-teal-800',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                ওজন খাতা অ্যাপ ব্যবহারের সহজ নিয়ম
              </h3>
              <p className="text-xs text-slate-500">
                মাত্র ৪টি সহজ ধাপে যেকারো জন্য সুবিধাজনক
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 gap-3.5">
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.step}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-emerald-50/30 transition-colors"
                >
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <span className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs font-mono">
                      {s.step}
                    </span>
                    <div className={`p-1.5 rounded-lg ${s.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-slate-900 text-sm">{s.title}</h4>
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                        {s.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-950">টিপস (Pro Tips):</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-emerald-800">
                <li>কাগজ বা খাতা সমান আলোতে রেখে সোজাভাবে ছবি তুলুন।</li>
                <li>সংখ্যাগুলো বাংলা (১, ২, ৩) বা ইংরেজি (1, 2, 3) উভয় রূপেই পড়তে পারে।</li>
                <li>কাছে খাতা না থাকলে হোমস্ক্রিনের <strong>"বাস্তব নমুনা স্লিপ"</strong> এ ক্লিক করে টেস্ট করতে পারেন।</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            বন্ধ করুন
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onStartCamera();
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all hover:scale-[1.02]"
          >
            <Camera className="w-4 h-4" />
            <span>এখনই ছবি তুলুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
