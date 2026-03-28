'use client';

import React from 'react';
import { MedCard as Card, MedButton as Button } from '../../components/UI';
import Link from 'next/link';

export default function PaymentSuccessPage() {
    return (
        <div className="animate-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <Card title="Payment Successful" icon="✅" style={{ maxWidth: '500px', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', margin: '20px 0', color: 'var(--success)' }}>
                    💳
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                    Thank you! Your payment has been processed successfully. Your appointment is now confirmed and recorded in our system.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <Link href="/appointment">
                        <Button className="navy">View Appointments</Button>
                    </Link>
                    <Link href="/">
                        <Button variant="secondary">Back to Dashboard</Button>
                    </Link>
                </div>
            </Card>
        </div>
    );
}
