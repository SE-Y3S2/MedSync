'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doctorApi } from '../../services/api';
import { MedCard as Card, MedInput as Input, MedButton as Button, showToast } from '../../components/UI';
import { User, Mail, Phone, BookOpen, Stethoscope, FileText, Save } from 'lucide-react';
import Link from 'next/link';

export default function DoctorProfile() {
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    specialty: '',
    bio: '',
    contact: {
      email: '',
      phone: ''
    },
    qualifications: [] as string[]
  });

  const [qualInput, setQualInput] = useState('');

  useEffect(() => {
    if (user?.role === 'doctor') {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const data = await doctorApi.getDoctor(user!.id);
      setProfile({
        name: data.name || '',
        specialty: data.specialty || '',
        bio: data.bio || '',
        contact: {
          email: data.contact?.email || '',
          phone: data.contact?.phone || ''
        },
        qualifications: data.qualifications || []
      });
    } catch (err) {
      showToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await doctorApi.updateDoctor(user!.id, profile);
      showToast('Profile updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addQualification = () => {
    if (qualInput.trim()) {
      setProfile({
        ...profile,
        qualifications: [...profile.qualifications, qualInput.trim()]
      });
      setQualInput('');
    }
  };

  const removeQualification = (index: number) => {
    const updated = [...profile.qualifications];
    updated.splice(index, 1);
    setProfile({ ...profile, qualifications: updated });
  };

  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="loading-spinner"></div>
    </div>
  );

  return (
    <div className="animate-in max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link href="/doctor" className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1 mb-2">
            ← Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">Professional Profile</h1>
          <p className="text-slate-500">Manage your credentials, bio and contact information.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Basic Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card title="Personal Information" icon={<User size={20} />}>
              <div className="space-y-4 pt-2">
                <Input 
                  label="Full Name" 
                  value={profile.name} 
                  onChange={(e) => setProfile({...profile, name: e.target.value})} 
                  required 
                />
                <Input 
                  label="Medical Specialty" 
                  value={profile.specialty} 
                  onChange={(e) => setProfile({...profile, specialty: e.target.value})} 
                  required 
                  placeholder="e.g. Cardiologist, General Physician"
                />
                <div className="med-input-group">
                  <label className="med-label flex items-center gap-2"><FileText size={16} /> Professional Bio</label>
                  <textarea 
                    className="med-input min-h-[120px]" 
                    value={profile.bio} 
                    onChange={(e) => setProfile({...profile, bio: e.target.value})}
                    placeholder="Tell patients about your experience and background..."
                  />
                </div>
              </div>
            </Card>

            <Card title="Contact Details" icon={<Phone size={20} />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <Input 
                  label="Email Address" 
                  type="email" 
                  value={profile.contact.email} 
                  disabled 
                  onChange={() => {}}
                />
                <Input 
                  label="Contact Number" 
                  value={profile.contact.phone} 
                  onChange={(e) => setProfile({...profile, contact: {...profile.contact, phone: e.target.value}})} 
                />
              </div>
              <p className="mt-4 text-xs text-slate-400 italic">Email is tied to your account and cannot be changed here.</p>
            </Card>
          </div>

          {/* Right Column: Qualifications */}
          <div className="space-y-6">
            <Card title="Qualifications" icon={<BookOpen size={20} />}>
              <div className="space-y-4 pt-2">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="med-input !mb-0" 
                    placeholder="e.g. MBBS, MD" 
                    value={qualInput}
                    onChange={(e) => setQualInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addQualification())}
                  />
                  <Button type="button" onClick={addQualification} className="sm">Add</Button>
                </div>
                
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {profile.qualifications.length === 0 ? (
                    <p className="text-sm text-slate-400 italic py-4 text-center">No qualifications added yet.</p>
                  ) : (
                    profile.qualifications.map((q, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                        <span className="text-sm font-medium text-slate-700">{q}</span>
                        <button 
                          type="button" 
                          onClick={() => removeQualification(idx)} 
                          className="text-slate-300 hover:text-red-500 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>

            <div className="sticky top-8">
              <Button 
                type="submit" 
                className="primary w-full py-4 text-lg shadow-xl" 
                disabled={saving}
                icon={saving ? undefined : <Save size={20} />}
              >
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </Button>
            </div>
          </div>
        </div>
      </form>

      <style jsx>{`
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
