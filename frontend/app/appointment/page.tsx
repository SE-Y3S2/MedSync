'use client';

import React, { useState, useEffect } from 'react';
import { MedCard as Card, MedButton as Button, MedInput as Input, Badge, Skeleton, showToast, Tabs, Modal } from '../components/UI';
import { appointmentApi, paymentApi } from '@/app/services/api';
import { User, CalendarX, CalendarClock } from 'lucide-react';

interface Appointment {
    _id: string;
    doctorId: string;
    doctorName: string;
    specialty: string;
    slotDate: string;
    slotTime: string;
    consultationFee?: number;
    status: string;
    paymentStatus?: string;
}

export default function AppointmentListPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);

    const [showReschedule, setShowReschedule] = useState(false);
    const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');
    const [rescheduling, setRescheduling] = useState(false);

    const fetchAppointments = async () => {
        try {
            const patientData = JSON.parse(localStorage.getItem('medsync_user') || '{}');
            if (patientData.id) {
                const data = await appointmentApi.getPatientAppointments(patientData.id);
                setAppointments(data);
            }
        } catch {
            showToast('Failed to load appointments', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const handlePayment = async (appt: Appointment) => {
        try {
            const patientData = JSON.parse(localStorage.getItem('medsync_user') || '{}');
            const { url } = await paymentApi.createCheckoutSession({
                appointmentId: appt._id,
                patientId: patientData.id,
                doctorId: appt.doctorId,
                doctorName: appt.doctorName,
                amount: appt.consultationFee || 500,
            });
            window.location.href = url;
        } catch (err: any) {
            showToast(err.message || 'Payment initiation failed', 'error');
        }
    };

    const handleCancel = async (id: string) => {
        if (!window.confirm('Cancel this appointment?')) return;
        try {
            await appointmentApi.cancelAppointment(id, { cancelledBy: 'patient' });
            showToast('Appointment cancelled', 'info');
            fetchAppointments();
        } catch {
            showToast('Cancellation failed', 'error');
        }
    };

    const openReschedule = (appt: Appointment) => {
        setRescheduleTarget(appt);
        setNewDate(appt.slotDate);
        setNewTime(appt.slotTime);
        setShowReschedule(true);
    };

    const submitReschedule = async () => {
        if (!rescheduleTarget) return;
        if (!newDate || !newTime) {
            showToast('Pick a new date and time', 'warning');
            return;
        }
        setRescheduling(true);
        try {
            await appointmentApi.rescheduleAppointment(rescheduleTarget._id, {
                slotDate: newDate,
                slotTime: newTime,
            });
            showToast('Appointment rescheduled', 'success');
            setShowReschedule(false);
            fetchAppointments();
        } catch (err: any) {
            showToast(err.message || 'Reschedule failed', 'error');
        } finally {
            setRescheduling(false);
        }
    };

    const filtered = appointments.filter(a => {
        if (activeTab === 0) return ['pending', 'confirmed'].includes(a.status);
        if (activeTab === 1) return a.status === 'completed';
        return ['cancelled', 'rejected'].includes(a.status);
    });

    return (
        <div className="animate-in">
            <header style={{ marginBottom: '32px' }}>
                <h1 className="page-title">My Appointments</h1>
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

                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--card-border)', paddingTop: '16px', flexWrap: 'wrap', gap: '8px' }}>
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
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {appt.paymentStatus === 'unpaid' && ['pending', 'confirmed'].includes(appt.status) && (
                                            <Button size="sm" onClick={() => handlePayment(appt)}>Pay Now</Button>
                                        )}
                                        {['pending', 'confirmed'].includes(appt.status) && (
                                            <>
                                                <Button size="sm" variant="secondary" onClick={() => openReschedule(appt)}>
                                                    Reschedule
                                                </Button>
                                                <Button size="sm" variant="danger" onClick={() => handleCancel(appt._id)}>
                                                    Cancel
                                                </Button>
                                            </>
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

            <Modal
                isOpen={showReschedule}
                onClose={() => setShowReschedule(false)}
                title={`Reschedule with Dr. ${rescheduleTarget?.doctorName || ''}`}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CalendarClock size={16} />
                        Current: {rescheduleTarget?.slotDate} at {rescheduleTarget?.slotTime}
                    </div>
                    <Input
                        label="New Date"
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                    />
                    <Input
                        label="New Time"
                        type="time"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                    />
                    <Button onClick={submitReschedule} disabled={rescheduling} style={{ width: '100%' }}>
                        {rescheduling ? 'Rescheduling…' : 'Confirm Reschedule'}
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
