'use client';

import React, { useState, useEffect } from 'react';
import { MedCard as Card, MedButton as Button, Badge, Skeleton, showToast, Tabs } from '../components/UI';
import { appointmentApi, paymentApi } from '@/app/services/api';
import { User, CalendarX } from 'lucide-react';

export default function AppointmentListPage() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);

    const fetchAppointments = async () => {
        try {
            const patientData = JSON.parse(localStorage.getItem('medsync_user') || '{}');
            if (patientData.id) {
                const data = await appointmentApi.getPatientAppointments(patientData.id);
                setAppointments(data);
            }
        } catch (err) {
            showToast('Failed to load appointments', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const handlePayment = async (appt: any) => {
        try {
            const patientData = JSON.parse(localStorage.getItem('medsync_user') || '{}');
            const { url } = await paymentApi.createCheckoutSession({
                appointmentId: appt._id,
                patientId: patientData.patientId || patientData.id,
                doctorId: appt.doctorId,
                doctorName: appt.doctorName,
                amount: appt.consultationFee || 500 // Fallback if missing
            });
            window.location.href = url;
        } catch (err: any) {
            showToast(err.message || 'Payment initiation failed', 'error');
        }
    };

    const handleCancel = async (id: string) => {
        if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
        try {
            await appointmentApi.cancelAppointment(id);
            showToast('Appointment cancelled successfully', 'info');
            fetchAppointments();
        } catch (err) {
            showToast('Cancellation failed', 'error');
        }
    };

    const filtered = appointments.filter(a => {
        if (activeTab === 0) return ['pending', 'confirmed'].includes(a.status);
        if (activeTab === 1) return a.status === 'completed';
        return a.status === 'cancelled';
    });

    return (
        <div className="animate-in">
            <header style={{ marginBottom: '32px' }}>
                <h1 className="page-title text-navy">My Appointments</h1>
                <p className="page-subtitle">Track your upcoming consultations and review medical visits.</p>
            </header>

            <Tabs
                tabs={['Upcoming', 'History', 'Cancelled']}
                activeTab={activeTab}
                onChange={setActiveTab}
            />

            <div className="tab-content">
                {loading ? (
                    <Skeleton type="card" />
                ) : filtered.length > 0 ? (
                    <div className="grid">
                        {filtered.map((appt) => (
                            <Card key={appt._id} title={appt.doctorName} icon={<User size={20} />}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <Badge text={appt.slotDate} variant="info" />
                                    <Badge text={appt.slotTime} variant="info" />
                                </div>

                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
                                    <strong>Specialty:</strong> {appt.specialty}
                                </p>

                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <Badge
                                            text={appt.status?.toUpperCase()}
                                            variant={appt.status === 'confirmed' ? 'low' : appt.status === 'pending' ? 'info' : 'high'}
                                        />
                                        <Badge
                                            text={(appt.paymentStatus || 'unpaid').toUpperCase()}
                                            variant={appt.paymentStatus === 'paid' ? 'low' : 'high'}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {appt.paymentStatus === 'unpaid' && ['pending', 'confirmed'].includes(appt.status) && (
                                            <Button size="sm" className="turquoise" onClick={() => handlePayment(appt)}>Pay Now</Button>
                                        )}
                                        {['pending', 'confirmed'].includes(appt.status) && (
                                            <Button size="sm" variant="danger" onClick={() => handleCancel(appt._id)}>Cancel</Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon"><CalendarX size={48} /></div>
                        <h3>No appointments found</h3>
                        <p>You have no records in this category at the moment.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
