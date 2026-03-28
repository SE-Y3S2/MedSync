'use client';

import React from 'react';
import { MedCard as Card, MedButton as Button } from '../../components/UI';
import Link from 'next/link';

export default function PaymentCancelPage() {
    return (
        <div className="animate-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <Card title="Payment Cancelled" icon="❌" style={{ maxWidth: '500px', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', margin: '20px 0', color: 'var(--error)' }}>
                    ⚠️
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                    It looks like the payment process was cancelled. No charges were made. You can try again whenever you're ready.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <Link href="/appointment">
                        <Button className="navy">Return to Appointments</Button>
                    </Link>
                    <Link href="/">
                        <Button variant="secondary">Back to Dashboard</Button>
                    </Link>
                </div>
            </Card>
        </div>
    );
}
