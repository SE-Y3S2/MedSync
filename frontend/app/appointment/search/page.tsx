'use client';

import React, { useState, useEffect } from 'react';
import { MedCard as Card, MedInput as Input, MedButton as Button, showToast, Skeleton, Badge } from '../../components/UI';
import { doctorApi } from '@/app/services/api';
import Link from 'next/link';

export default function AppointmentSearchPage() {
    const [doctors, setDoctors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [specialty, setSpecialty] = useState('');

    const fetchDoctors = async (searchSpecialty = '') => {
        setLoading(true);
        try {
            const data = await doctorApi.listDoctors(searchSpecialty);
            setDoctors(data);
        } catch (err) {
            showToast('Failed to load doctors', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchDoctors(specialty);
    };

    return (
        <div className="animate-in">
            <header style={{ marginBottom: '32px' }}>
                <h1 className="page-title text-navy">Find a Specialist</h1>
                <p className="page-subtitle">Search for certified doctors and book your consultation in minutes.</p>

                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', maxWidth: '600px', marginTop: '24px' }}>
                    <div style={{ flex: 1 }}>
                        <Input
                            placeholder="Cardiology, Pediatrics, Surgery..."
                            value={specialty}
                            onChange={(e) => setSpecialty(e.target.value)}
                        />
                    </div>
                    <Button type="submit" className="navy" icon="🔍" style={{ height: '44px' }}>Search</Button>
                </form>
            </header>

            <div className="grid">
                {loading ? (
                    [1, 2, 3].map(i => <Skeleton key={i} type="card" />)
                ) : doctors.length > 0 ? (
                    doctors.map((doctor) => (
                        <Card key={doctor._id} title={doctor.name} icon="👨‍⚕️" className="doctor-card">
                            <div style={{ marginBottom: '16px' }}>
                                <Badge text={doctor.specialty} variant="info" />
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                                {doctor.bio || 'Expert healthcare professional with extensive medical background.'}
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    ★ {doctor.analytics?.patientSatisfactionScore || 4.8} Rating
                                </div>
                                <Link href={`/appointment/book/${doctor._id}`}>
                                    <Button size="sm" className="turquoise">Book Now</Button>
                                </Link>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon text-turquoise">📂</div>
                        <h3 className="text-navy">No doctors found</h3>
                        <p>Try searching for a different specialty or browse all doctors.</p>
                        <Button variant="secondary" onClick={() => { setSpecialty(''); fetchDoctors(''); }} style={{ marginTop: '16px' }}>
                            Clear Search
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
