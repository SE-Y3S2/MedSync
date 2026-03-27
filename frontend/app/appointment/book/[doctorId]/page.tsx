'use client';

import React, { useState, useEffect, use } from 'react';
import { MedCard as Card, MedButton as Button, showToast, Skeleton, Badge, MedInput as Input } from '../../../components/UI';
import { doctorApi, appointmentApi } from '@/app/services/api';
import { useRouter } from 'next/navigation';

export default function BookingPage({ params }: { params: Promise<{ doctorId: string }> }) {
    const { doctorId } = use(params);
    const [doctor, setDoctor] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);
    const [date, setDate] = useState('');
    const [slot, setSlot] = useState('');
    const router = useRouter();

    useEffect(() => {
        const fetchDoctor = async () => {
            try {
                const data = await doctorApi.getDoctor(doctorId);
                setDoctor(data);
            } catch (err) {
                showToast('Failed to load doctor details', 'error');
                router.push('/appointment/search');
            } finally {
                setLoading(false);
            }
        };
        fetchDoctor();
    }, [doctorId, router]);

    const handleBooking = async () => {
        if (!date || !slot) {
            showToast('Please select a date and time slot', 'warning');
            return;
        }

        setBooking(true);
        try {
            const patientData = JSON.parse(localStorage.getItem('medsync_user') || '{}');
            if (!patientData.id) {
                showToast('Please login to book an appointment', 'error');
                router.push('/login');
                return;
            }

            await appointmentApi.createAppointment({
                patientId: patientData.patientId || patientData.id,
                patientName: `${patientData.firstName} ${patientData.lastName}`,
                patientEmail: patientData.email,
                doctorId: doctorId,
                doctorName: doctor.name,
                specialty: doctor.specialty,
                slotDate: date,
                slotTime: slot,
                reason: 'General Consultation',
                consultationFee: doctor.consultationFee || 500
            });

            showToast('Appointment booked successfully!', 'success');
            router.push('/appointment');
        } catch (err: any) {
            showToast(err.message || 'Failed to book appointment', 'error');
        } finally {
            setBooking(false);
        }
    };

    if (loading) return <Skeleton type="card" />;

    const slots = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'];

    return (
        <div className="animate-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <header style={{ marginBottom: '32px' }}>
                <h1 className="page-title text-navy">Secure Booking</h1>
                <p className="page-subtitle">Confirm your consultation with {doctor?.name} in the {doctor?.specialty} department.</p>
            </header>

            <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1.2fr', gap: '24px' }}>
                <Card title="Consultant" icon="👨‍⚕️" className="glass-card-navy">
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <div className="avatar lg" style={{ margin: '0 auto 16px', backgroundImage: 'linear-gradient(135deg, var(--oxford-navy), var(--bright-marine))' }}>
                            {doctor?.name?.charAt(0)}
                        </div>
                        <h3 className="text-navy">{doctor?.name}</h3>
                        <Badge text={doctor?.specialty} variant="info" />
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <p style={{ marginBottom: '8px' }}><strong>Qualifications:</strong> {doctor?.qualifications?.join(', ') || 'MBBS, MD'}</p>
                        <p><strong>Bio:</strong> {doctor?.bio || 'Specialist with over 10 years of clinical experience.'}</p>
                    </div>
                </Card>

                <Card title="Appointment Data" icon="📅">
                    <Input
                        label="Preferred Date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />

                    <div className="med-input-group">
                        <label className="med-label">Available Slots</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {slots.map(s => (
                                <button
                                    key={s}
                                    onClick={() => setSlot(s)}
                                    style={{
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: '1.5px solid',
                                        borderColor: slot === s ? 'var(--turquoise)' : 'var(--card-border)',
                                        background: slot === s ? 'var(--accent-light)' : 'white',
                                        color: slot === s ? 'var(--turquoise)' : 'var(--text-secondary)',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Button
                        onClick={handleBooking}
                        disabled={booking}
                        className="navy"
                        style={{ width: '100%', marginTop: '20px' }}
                    >
                        {booking ? 'Reserving...' : 'Confirm Book'}
                    </Button>
                </Card>
            </div>
        </div>
    );
}
