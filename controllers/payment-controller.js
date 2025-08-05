import Stripe from 'stripe';
import User from '../module/auth-module.js';

// Initialize Stripe with fallback for development
const stripe = process.env.STRIPE_SECRET_KEY 
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

// Create payment intent
const createPaymentIntent = async (req, res) => {
    try {
        if (!stripe) {
            return res.status(500).json({
                message: 'Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables.',
                success: false
            });
        }

        const { amount, currency = 'usd', payment_method_types = ['card'] } = req.body;

        if (!amount) {
            return res.status(400).json({
                message: 'Amount is required',
                success: false
            });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency,
            payment_method_types,
            metadata: {
                userId: req.user._id.toString(),
                userEmail: req.user.email
            }
        });

        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            success: true
        });

    } catch (error) {
        console.error('Payment intent error:', error);
        res.status(500).json({
            message: 'Error creating payment intent',
            success: false
        });
    }
};

// Confirm payment
const confirmPayment = async (req, res) => {
    try {
        if (!stripe) {
            return res.status(500).json({
                message: 'Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables.',
                success: false
            });
        }

        const { paymentIntentId } = req.body;

        if (!paymentIntentId) {
            return res.status(400).json({
                message: 'Payment intent ID is required',
                success: false
            });
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
            // Payment successful - you can add additional logic here
            // like updating user subscription, creating order, etc.
            
            res.status(200).json({
                message: 'Payment confirmed successfully',
                paymentStatus: paymentIntent.status,
                success: true
            });
        } else {
            res.status(400).json({
                message: 'Payment not completed',
                paymentStatus: paymentIntent.status,
                success: false
            });
        }

    } catch (error) {
        console.error('Confirm payment error:', error);
        res.status(500).json({
            message: 'Error confirming payment',
            success: false
        });
    }
};

// Get payment history
const getPaymentHistory = async (req, res) => {
    try {
        if (!stripe) {
            return res.status(500).json({
                message: 'Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables.',
                success: false
            });
        }

        const userId = req.user._id;

        const payments = await stripe.paymentIntents.list({
            limit: 20,
            metadata: { userId: userId.toString() }
        });

        res.status(200).json({
            payments: payments.data,
            success: true
        });

    } catch (error) {
        console.error('Get payment history error:', error);
        res.status(500).json({
            message: 'Error fetching payment history',
            success: false
        });
    }
};

// Create subscription
const createSubscription = async (req, res) => {
    try {
        if (!stripe) {
            return res.status(500).json({
                message: 'Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables.',
                success: false
            });
        }

        const { priceId, paymentMethodId } = req.body;

        if (!priceId || !paymentMethodId) {
            return res.status(400).json({
                message: 'Price ID and payment method ID are required',
                success: false
            });
        }

        // Create customer if doesn't exist
        let customer;
        const existingCustomers = await stripe.customers.list({
            email: req.user.email,
            limit: 1
        });

        if (existingCustomers.data.length > 0) {
            customer = existingCustomers.data[0];
        } else {
            customer = await stripe.customers.create({
                email: req.user.email,
                name: req.user.name,
                payment_method: paymentMethodId,
                invoice_settings: {
                    default_payment_method: paymentMethodId,
                },
            });
        }

        // Create subscription
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: priceId }],
            payment_behavior: 'default_incomplete',
            payment_settings: { save_default_payment_method: 'on_subscription' },
            expand: ['latest_invoice.payment_intent'],
        });

        res.status(200).json({
            subscriptionId: subscription.id,
            clientSecret: subscription.latest_invoice.payment_intent.client_secret,
            success: true
        });

    } catch (error) {
        console.error('Create subscription error:', error);
        res.status(500).json({
            message: 'Error creating subscription',
            success: false
        });
    }
};

// Cancel subscription
const cancelSubscription = async (req, res) => {
    try {
        if (!stripe) {
            return res.status(500).json({
                message: 'Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables.',
                success: false
            });
        }

        const { subscriptionId } = req.body;

        if (!subscriptionId) {
            return res.status(400).json({
                message: 'Subscription ID is required',
                success: false
            });
        }

        const subscription = await stripe.subscriptions.cancel(subscriptionId);

        res.status(200).json({
            message: 'Subscription cancelled successfully',
            subscription: subscription,
            success: true
        });

    } catch (error) {
        console.error('Cancel subscription error:', error);
        res.status(500).json({
            message: 'Error cancelling subscription',
            success: false
        });
    }
};

export {
    createPaymentIntent,
    confirmPayment,
    getPaymentHistory,
    createSubscription,
    cancelSubscription
}; 