"use client";

import React from 'react';
import { 
  User, Mail, Shield, Hash, 
  CheckCircle 
} from 'lucide-react';

export default function WorkerProfileUI({ profile, email }: { profile: any, email?: string }) {
  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Account Profile</h1>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Manage your field credentials</p>
      </header>

      {/* Profile Card */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-slate-900 to-blue-900 relative">
            <div className="absolute -bottom-10 left-8">
                <div className="w-24 h-24 bg-white rounded-3xl p-1 shadow-xl">
                    <div className="w-full h-full bg-blue-100 rounded-[1.25rem] flex items-center justify-center text-blue-600">
                        <User size={40} />
                    </div>
                </div>
            </div>
        </div>

        <div className="pt-14 p-8 space-y-8">
          {/* Basic Info */}
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{profile?.username || 'Field Worker'}</h2>
            <div className="inline-flex items-center gap-2 mt-1 text-blue-600 font-bold text-xs uppercase tracking-widest">
                <Shield size={14} /> {profile?.roles?.length > 0 ? profile.roles.join(', ') : 'Field Personnel'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem 
              icon={<Mail size={18} />} 
              label="System Email" 
              value={email || 'N/A'} 
            />
            <InfoItem 
              icon={<Hash size={18} />} 
              label="Employee ID" 
              value={profile?.id?.toString().slice(0, 8).toUpperCase()} 
            />
            <InfoItem 
              icon={<CheckCircle size={18} />} 
              label="Account Status" 
              value={profile.is_active?"Active":"Deactive"}
              valueClassName="text-green-600 font-black"
            />
          </div>

          <hr className="border-slate-100" />


        </div>
      </div>

      {/* Security Note */}
      <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-2xl flex gap-4 items-start">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            <Shield size={20} />
        </div>
        <div>
            <p className="text-[11px] font-black text-blue-900 uppercase tracking-widest mb-1">Security Policy</p>
            <p className="text-xs text-blue-700 leading-relaxed font-medium">
                Your account is bound to system credentials. Any change in role or regional access must be requested via the Head Office Admin Panel.
            </p>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value, valueClassName = "text-slate-700" }: any) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 text-slate-400">{icon}</div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">{label}</p>
        <p className={`text-sm font-bold truncate ${valueClassName}`}>{value}</p>
      </div>
    </div>
  );
}