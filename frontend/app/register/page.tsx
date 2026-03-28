'use client';

import React, { useState } from 'react';
import { MedCard as Card, MedInput as Input, MedButton as Button, showToast } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', password: '',
        phone: '', dateOfBirth: '', gender: 'Other', address: '',
        name: '', specialty: '', qualifications: '', bio: ''
    });
    const [role, setRole] = useState<'patient' | 'doctor'>('patient');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            let submitData: any = {};
            if (role === 'doctor') {
                submitData = {
                    name: formData.name,
                    specialty: formData.specialty,
                    qualifications: formData.qualifications.split(','),
                    bio: formData.bio,
                    contact: { email: formData.email, phone: formData.phone },
                    password: formData.password
                };
            } else {
                submitData = formData;
            }

            await register(submitData, role);
            showToast('Account created! Please sign in.', 'success');
            router.push('/login');
        } catch (err: any) {
            showToast(err.message || 'Registration failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

    return (
        <div className="animate-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
            <div style={{ width: '100%', maxWidth: '600px' }}>
                <Card title="Registration" icon="📝">
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                        <Button className={role === 'patient' ? 'primary' : 'secondary'} onClick={() => setRole('patient')}>Register as Patient</Button>
                        <Button className={role === 'doctor' ? 'primary' : 'secondary'} onClick={() => setRole('doctor')}>Register as Doctor</Button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {role === 'patient' ? (
                            <>
                                <div className="grid-2">
                                    <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
                                    <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />
                                </div>
                                <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                                <div className="grid-2">
                                    <Input label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required />
                                    <Input label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
                                </div>
                                <div className="grid-2">
                                    <Input label="Birth Date" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} required />
                                    <div className="med-input-group">
                                        <label className="med-label">Gender</label>
                                        <select name="gender" className="med-input" value={formData.gender} onChange={handleChange}>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <Input label="Address" name="address" value={formData.address} onChange={handleChange} />
                            </>
                        ) : (
                            <>
                                <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} required />
                                <div className="grid-2">
                                    <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                                    <Input label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
                                </div>
                                <Input label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required />
                                <Input label="Specialty" name="specialty" value={formData.specialty} onChange={handleChange} placeholder="e.g. Cardiology" required />
                                <Input label="Qualifications (Comma separated)" name="qualifications" value={formData.qualifications} onChange={handleChange} placeholder="MBBS, MD" />
                                <Input label="Brief Bio" name="bio" value={formData.bio} onChange={handleChange} />
                            </>
                        )}

                        <Button type="submit" className="turquoise" disabled={loading} style={{ width: '100%', marginTop: '16px' }}>
                            {loading ? 'Creating Account...' : 'Register'}
                        </Button>
                    </form>
                    <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem' }}>
                        Already have an account? <Link href="/login">Login</Link>
                    </p>
                </Card>
            </div>
        </div>
    );
}
