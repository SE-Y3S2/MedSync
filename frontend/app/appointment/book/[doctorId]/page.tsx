'use client';

import React, { useState, useEffect, use } from 'react';
import { MedCard as Card, MedButton as Button, showToast, Skeleton, Badge, MedInput as Input } from '../../../components/UI';
import { doctorApi, appointmentApi } from '@/app/services/api';
import { useRouter } from 'next/navigation';
import { User, CalendarCheck } from 'lucide-react';

export default function BookingPage({ params }: { params: Promise<{ doctorId: string }> }) {
    const { doctorId } = use(params);
    const [doctor, setDoctor] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);
    const [date, setDate] = useState('');
    const [slot, setSlot] = useState('');
    const [availability, setAvailability] = useState<any[]>([]);
    const [bookedSlots, setBookedSlots] = useState<any[]>([]);
    const [slots, setSlots] = useState<string[]>([]);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [docData, availData] = await Promise.all([
                    doctorApi.getDoctor(doctorId),
                    doctorApi.getAvailability(doctorId)
                ]);
                setDoctor(docData);
                setAvailability(availData);
            } catch (err) {
                showToast('Failed to load consultation data', 'error');
                router.push('/appointment/search');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [doctorId, router]);

    useEffect(() => {
        if (!date || availability.length === 0) {
            setSlots([]);
            return;
        }

        const fetchBooked = async () => {
            try {
                const booked = await appointmentApi.getBookedSlots(doctorId, date);
                setBookedSlots(booked);

                // Filter slots by local day of week to prevent timezone shift bugs
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const [year, month, day] = date.split('-');
                const localDate = new Date(Number(year), Number(month) - 1, Number(day));
                const selectedDay = days[localDate.getDay()];
                
                const daySlots = availability
                    .filter(a => a.day === selectedDay)
                    .map(a => `${a.startTime} - ${a.endTime}`);
                
                // Filter out already booked slots
                const bookedTimes = booked.map((b: any) => b.slotTime);
                const filtered = daySlots.filter(s => !bookedTimes.includes(s));
                
                setSlots(filtered);
            } catch (err) {
                console.error('Error fetching booked slots:', err);
                setSlots([]);
            }
        };
        fetchBooked();
    }, [date, availability, doctorId]);

    const handleBooking = async () => {
        if (!date || !slot) {
            showToast('Please select a date and time slot', 'warning');
            return;
        }

        setBooking(true);
        try {
            const patientData = JSON.parse(localStorage.getItem('medsync_user') || '{}');
            const patientId = patientData.id || patientData._id || patientData.patientId;
            if (!patientId) {
                showToast('Please login to book an appointment', 'error');
                router.push('/login');
                return;
            }

            await appointmentApi.createAppointment({
                patientId: patientId,
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

    return (
        <div className="animate-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <header style={{ marginBottom: '32px' }}>
                <h1 className="page-title text-navy">Secure Booking</h1>
                <p className="page-subtitle">Confirm your consultation with {doctor?.name} in the {doctor?.specialty} department.</p>
            </header>

            <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1.2fr', gap: '24px' }}>
                <Card title="Consultant" icon={<User size={20} />} className="glass-card-navy">
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

                <Card title="Appointment Data" icon={<CalendarCheck size={20} />}>
                    <Input
                        label="Preferred Date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />

                    <div className="med-input-group">
                        <label className="med-label">Available Slots</label>
                        {slots.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                {slots.map(s => (
                                    <button
                                        key={s}
                                        type="button"
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
                        ) : (
                            <div className="empty-slots-msg" style={{ 
                                padding: '16px', 
                                textAlign: 'center', 
                                background: 'var(--bg-light)', 
                                borderRadius: '12px',
                                color: 'var(--text-secondary)',
                                fontSize: '0.9rem',
                                border: '1px dashed var(--card-border)'
                            }}>
                                {date ? "No availability slots for this date." : "Please select a date first."}
                            </div>
                        )}
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
