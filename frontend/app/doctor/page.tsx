'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { doctorApi, appointmentApi } from '../services/api';
import { Clock, Video, User, List, CheckCircle, AlertCircle } from 'lucide-react';
import { showToast } from '../components/UI';

export default function DoctorDashboard() {
  const { user, isLoading } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctorDetails, setDoctorDetails] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (user?.role === 'doctor') {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const [appts, docInfo] = await Promise.all([
        appointmentApi.getDoctorAppointments(user!.id),
        doctorApi.getDoctor(user!.id)
      ]);
      setAppointments(appts || []);
      setDoctorDetails(docInfo);
      
      // Load analytics (bonus feature)
      try {
        const analyticsData = await doctorApi.getAnalytics(user!.id);
        setAnalytics(analyticsData);
      } catch (e) {
        console.warn('Analytics service unavailable');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  if (isLoading || loadingData) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="loading-spinner"></div>
      <p className="ml-3 text-slate-500">Loading your dashboard...</p>
    </div>
  );
  
  if (user?.role !== 'doctor') return (
    <div className="med-card urgency-high">
      <h3 className="flex items-center gap-2"><AlertCircle size={20} /> Access Denied</h3>
      <p>This area is reserved for medical professionals.</p>
    </div>
  );

  const pending = appointments.filter(a => a.status === 'pending');
  const confirmed = appointments.filter(a => a.status === 'confirmed');

  return (
    <div className="animate-in space-y-8">
      {/* Profile Header Card */}
      <div className="med-card overflow-hidden !p-0">
        <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
        <div className="px-8 pb-8 -mt-12 relative flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
            <div className="w-32 h-32 rounded-2xl bg-white p-1 shadow-xl">
              <div className="w-full h-full rounded-xl bg-slate-100 flex items-center justify-center text-4xl font-bold text-blue-600 uppercase border-2 border-slate-50">
                {user.name.charAt(0)}
              </div>
            </div>
            <div className="mb-2">
              <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">Dr. {user.name}</h1>
              <p className="text-blue-600 font-medium">{doctorDetails?.specialty || 'Medical Specialist'}</p>
              {!doctorDetails?.isVerified && (
                <div className="mt-2 flex items-center justify-center md:justify-start gap-1 text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-100">
                  <AlertCircle size={14} /> Verification Pending
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3">
             <Link href="/doctor/profile" className="med-button secondary flex items-center gap-2 px-6 shadow-sm">
                <User size={18} /> Edit Profile
             </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="med-card !p-6 flex flex-col justify-between border-l-4 border-l-blue-500">
          <div className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Total Patients</div>
          <div className="text-3xl font-bold text-slate-900">24</div>
        </div>
        <div className="med-card !p-6 flex flex-col justify-between border-l-4 border-l-amber-500">
          <div className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Pending Requests</div>
          <div className="text-3xl font-bold text-slate-900">{pending.length}</div>
        </div>
        <div className="med-card !p-6 flex flex-col justify-between border-l-4 border-l-success">
          <div className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Upcoming Today</div>
          <div className="text-3xl font-bold text-slate-900">{confirmed.length}</div>
        </div>
        <div className="med-card !p-6 flex flex-col justify-between border-l-4 border-l-indigo-500 text-indigo-700 font-bold">
           {analytics ? (
              <div className="w-full h-full">
                <div className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Satisfaction</div>
                <div className="text-3xl font-bold text-slate-900">{analytics.patientSatisfactionScore}%</div>
              </div>
           ) : (
              <div className="opacity-50 italic font-normal text-sm">Analytics loading...</div>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="med-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="text-amber-500" size={22} /> Action Needed
              </h3>
              <Link href="/doctor/appointments" className="text-blue-600 text-sm font-bold hover:underline">View All</Link>
            </div>
            
            {pending.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle className="mx-auto text-slate-300 mb-2" size={32} />
                <p className="text-slate-500">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pending.slice(0, 3).map(a => (
                  <div key={a._id} className="history-item group transition-all hover:bg-slate-50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="font-bold text-slate-900 text-lg">{a.patientName}</div>
                        <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                          <span className="flex items-center gap-1"><Clock size={14} /> {new Date(a.slotDate).toLocaleDateString()} at {a.slotTime}</span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-xs">Reason: {a.reason || 'Checkup'}</span>
                        </div>
                      </div>
                      <Link href="/doctor/appointments" className="med-button primary sm shadow-md group-hover:scale-105 transition-transform">
                        Review Request
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="med-card">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Video className="text-blue-500" size={22} /> Recent Consultations
            </h3>
            <p className="text-slate-400 italic text-center py-12">Session history integration coming soon...</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="med-card bg-slate-900 text-white border-0 shadow-2xl">
            <h3 className="text-lg font-bold mb-6">Quick Tools</h3>
            <div className="space-y-3">
              <Link href="/doctor/availability" className="flex items-center justify-between p-4 rounded-xl bg-white/10 hover:bg-white/20 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:text-indigo-300">
                    <Clock size={20} />
                  </div>
                  <span className="font-semibold text-slate-100">My Schedule</span>
                </div>
                <div className="text-slate-500 group-hover:text-slate-200">→</div>
              </Link>

              <Link href="/doctor/appointments" className="flex items-center justify-between p-4 rounded-xl bg-white/10 hover:bg-white/20 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:text-blue-300">
                    <List size={20} />
                  </div>
                  <span className="font-semibold text-slate-100">Appointments</span>
                </div>
                <div className="text-slate-500 group-hover:text-slate-200">→</div>
              </Link>
            </div>
            
            <div className="mt-8 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-300 text-xs leading-relaxed">
              <strong>Tip:</strong> Keep your availability up to date to ensure patients can book consultations at your preferred times.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

