const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');
const Payment = require('../models/Payment');
const { sendEvent } = require('../utils/kafka');

const APPOINTMENT_SERVICE_URL =
    process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3003';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ── POST /api/payments/checkout ───────────────────────────────────────────────
// Creates a Stripe Checkout session and returns the redirect URL
exports.createCheckoutSession = async (req, res, next) => {
    try {
        const { appointmentId, patientId, doctorId, doctorName, amount, currency = 'inr' } =
            req.body;

        if (!appointmentId || !patientId || !amount) {
            return res.status(400).json({ message: 'appointmentId, patientId, and amount are required' });
        }

        // Prevent duplicate sessions for the same appointment
        const existing = await Payment.findOne({
            appointmentId,
            status: { $in: ['pending', 'paid'] },
        });
        if (existing && existing.status === 'paid') {
            return res.status(409).json({ message: 'This appointment is already paid.' });
        }

        // Stripe expects amount in smallest currency unit (paise for INR)
        const amountInSmallestUnit = Math.round(amount * 100);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency,
                        product_data: {
                            name: `Consultation – Dr. ${doctorName || 'Doctor'}`,
                            description: `Appointment ID: ${appointmentId}`,
                        },
                        unit_amount: amountInSmallestUnit,
                    },
                    quantity: 1,
                },
            ],
            metadata: { appointmentId, patientId, doctorId },
            success_url: `${FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${FRONTEND_URL}/payment/cancel?appointmentId=${appointmentId}`,
        });

        // Persist pending payment record
        await Payment.findOneAndUpdate(
            { appointmentId },
            {
                appointmentId,
                patientId,
                doctorId: doctorId || '',
                doctorName,
                amount,
                currency,
                stripeSessionId: session.id,
                status: 'pending',
            },
            { upsert: true, new: true }
        );

        res.json({ url: session.url, sessionId: session.id });
    } catch (error) {
        next(error);
    }
};

// ── POST /api/payments/webhook ────────────────────────────────────────────────
// Stripe calls this; MUST use raw body for signature verification
exports.handleWebhook = async (req, res, next) => {
    const sig = req.headers['stripe-signature'];

    let event;
    try {
        event = stripe.webhooks.constructEvent(
            req.body, // raw buffer
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error(`[Webhook] Signature verification failed: ${err.message}`);
        return res.status(400).json({ message: `Webhook error: ${err.message}` });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { appointmentId, patientId } = session.metadata;

        try {
            // 1. Update our Payment record
            const payment = await Payment.findOneAndUpdate(
                { stripeSessionId: session.id },
                {
                    status: 'paid',
                    stripePaymentIntentId: session.payment_intent,
                    metadata: session,
                },
                { new: true }
            );

            // 2. Notify Appointment Service to mark appointment as paid + confirmed
            await axios.put(
                `${APPOINTMENT_SERVICE_URL}/api/appointments/${appointmentId}/payment`,
                {
                    paymentStatus: 'paid',
                    paymentId: payment?._id?.toString() || session.payment_intent,
                }
            );

            // 3. Dispatch Kafka Event for Notification Service
            // Need patientEmail for notification. Fetch it from appointment service or assume it's in metadata.
            // Let's assume the appointment notification handles the detail, or we send what we have.
            await sendEvent('payment-events', {
                type: 'PAYMENT_SUCCESSFUL',
                data: {
                    appointmentId,
                    patientId,
                    amount: payment.amount,
                    currency: payment.currency,
                    patientEmail: session.customer_details ? session.customer_details.email : null
                }
            });

            console.log(`[Webhook] Payment confirmed for appointment ${appointmentId}`);
        } catch (err) {
            // Log but still return 200 so Stripe doesn't retry indefinitely
            console.error(`[Webhook] Post-payment update failed: ${err.message}`);
        }
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({ received: true });
};

// ── GET /api/payments/:appointmentId ─────────────────────────────────────────
exports.getPaymentByAppointment = async (req, res, next) => {
    try {
        const payment = await Payment.findOne({ appointmentId: req.params.appointmentId });
        if (!payment) return res.status(404).json({ message: 'No payment found for this appointment' });
        res.json(payment);
    } catch (error) {
        next(error);
    }
};

// ── GET /api/payments/patient/:id ────────────────────────────────────────────
exports.getPatientPaymentHistory = async (req, res, next) => {
    try {
        const payments = await Payment.find({ patientId: req.params.id }).sort({ createdAt: -1 });
        res.json(payments);
    } catch (error) {
        next(error);
    }
};
