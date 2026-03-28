'use client';

import React, { useState } from 'react';
import { MedCard as Card, MedInput as Input, MedButton as Button, showToast } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'patient' | 'doctor' | 'admin'>('patient');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password, role);
            showToast(`Welcome back to MedSync! Logged in as ${role}.`, 'success');
            if (role === 'admin') router.push('/admin');
            else if (role === 'doctor') router.push('/doctor');
            else router.push('/');
        } catch (err: any) {
            showToast(err.message || 'Login failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
            <div style={{ width: '100%', maxWidth: '420px' }}>
                <Card title="Sign In" icon="🔑">
                    <form onSubmit={handleSubmit}>
                        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        
                        <div className="med-input-group" style={{ marginTop: '16px' }}>
                            <label className="med-label">Login As</label>
                            <select className="med-input" value={role} onChange={(e) => setRole(e.target.value as any)}>
                                <option value="patient">Patient</option>
                                <option value="doctor">Doctor</option>
                                <option value="admin">Administrator</option>
                            </select>
                        </div>

                        <Button type="submit" className="navy" disabled={loading} style={{ width: '100%', marginTop: '12px' }}>
                            {loading ? 'Entering...' : 'Login'}
                        </Button>
                    </form>
                    <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem' }}>
                        New to MedSync? <Link href="/register">Join Now</Link>
                    </p>
                </Card>
            </div>
        </div>
    );
}
