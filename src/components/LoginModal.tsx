import React, { useState } from 'react';
import {
  X,
  User,
  Building,
  Phone,
  MapPin,
  Lock,
  LogOut,
  Check,
  PlusCircle,
  ShieldCheck,
  Store
} from 'lucide-react';
import { UserProfile } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  profiles: UserProfile[];
  onLogin: (profile: UserProfile) => void;
  onCreateProfile: (profile: UserProfile) => void;
  onLogout: () => void;
}

const AVATAR_COLORS = [
  'bg-emerald-600',
  'bg-blue-600',
  'bg-purple-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-teal-600',
];

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  profiles,
  onLogin,
  onCreateProfile,
  onLogout,
}) => {
  const [mode, setMode] = useState<'select' | 'create'>('select');

  // Form states for new profile
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pin, setPin] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('অনুগ্রহ করে আপনার নাম লিখুন।');
      return;
    }
    if (!businessName.trim()) {
      setErrorMsg('অনুগ্রহ করে প্রতিষ্ঠান বা আড়তের নাম লিখুন।');
      return;
    }

    const newProfile: UserProfile = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      businessName: businessName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      pin: pin.trim() || undefined,
      avatarColor: selectedColor,
      createdAt: Date.now(),
    };

    onCreateProfile(newProfile);
    onLogin(newProfile);
    // Reset
    setName('');
    setBusinessName('');
    setPhone('');
    setAddress('');
    setPin('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <User className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                ব্যবহারকারী একাউন্ট ও প্রোফাইল
              </h3>
              <p className="text-xs text-slate-500">
                লগইন করলে আপনার প্রতিষ্ঠান ও নাম চালানের মেমোতে স্বয়ংক্রিয়ভাবে থাকবে
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
        <div className="p-6 overflow-y-auto space-y-5">
          {currentUser && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl ${
                    currentUser.avatarColor || 'bg-emerald-600'
                  } text-white flex items-center justify-center font-bold text-lg shadow-sm`}
                >
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-base">{currentUser.name}</span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                      লগইন সক্রিয়
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 font-medium">{currentUser.businessName}</p>
                  {currentUser.phone && (
                    <p className="text-[11px] text-slate-500 mt-0.5">মোবাইল: {currentUser.phone}</p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-700 text-slate-600 rounded-xl text-xs font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>লগআউট</span>
              </button>
            </div>
          )}

          {/* Toggle between selecting existing profile or creating new */}
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('select');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'select'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              প্রোফাইল নির্বাচন ({profiles.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('create');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'create'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              + নতুন প্রোফাইল তৈরি
            </button>
          </div>

          {/* MODE: SELECT EXISTING */}
          {mode === 'select' && (
            <div className="space-y-3">
              {profiles.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Store className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">কোন প্রোফাইল তৈরি করা নেই</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    চালান মেমোতে আপনার আড়ত বা দোকানের নাম বসাতে নতুন প্রোফাইল তৈরি করুন।
                  </p>
                  <button
                    type="button"
                    onClick={() => setMode('create')}
                    className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-xs"
                  >
                    + নতুন প্রোফাইল তৈরি করুন
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {profiles.map((profile) => {
                    const isCurrent = currentUser?.id === profile.id;
                    return (
                      <div
                        key={profile.id}
                        onClick={() => {
                          onLogin(profile);
                          onClose();
                        }}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isCurrent
                            ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400/60'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl ${
                              profile.avatarColor || 'bg-slate-700'
                            } text-white flex items-center justify-center font-bold text-sm shadow-xs`}
                          >
                            {profile.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{profile.name}</h4>
                            <p className="text-xs text-slate-600">{profile.businessName}</p>
                            {profile.phone && (
                              <p className="text-[11px] text-slate-400">{profile.phone}</p>
                            )}
                          </div>
                        </div>

                        {isCurrent ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-300">
                            <Check className="w-3.5 h-3.5" />
                            সক্রিয়
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-500 group-hover:text-emerald-700">
                            লগইন করুন →
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* MODE: CREATE NEW PROFILE */}
          {mode === 'create' && (
            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              {errorMsg && (
                <div className="p-2.5 bg-red-50 text-red-800 rounded-xl text-xs font-semibold border border-red-200">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  আপনার নাম *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="যেমন: মো: আলমগীর হোসেন"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  প্রতিষ্ঠান বা আড়তের নাম *
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="যেমন: মেসার্স আলম ব্রাদার্স ট্রেডার্স"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    মোবাইল নম্বর (ঐচ্ছিক)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="০১৭১১-XXXXXX"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ঠিকানা / বাজার (ঐচ্ছিক)
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="কারওয়ান বাজার, ঢাকা"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  প্রোফাইল কালার
                </label>
                <div className="flex gap-2">
                  {AVATAR_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setSelectedColor(col)}
                      className={`w-7 h-7 rounded-full ${col} transition-transform ${
                        selectedColor === col
                          ? 'ring-2 ring-offset-2 ring-slate-800 scale-110'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-800/25 transition-all"
                >
                  প্রোফাইল তৈরি ও লগইন করুন
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
