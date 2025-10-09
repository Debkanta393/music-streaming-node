import Stripe from "stripe";
import paypal from "@paypal/checkout-server-sdk";
import Razorpay from "razorpay";
import crypto from "crypto";
import Payment from "../module/payment-module.js";

// ========== STRIPE ==========
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// ========== PAYPAL ==========
let paypalClient;
if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
  const environment =
    process.env.NODE_ENV === "production"
      ? new paypal.core.LiveEnvironment(
          process.env.PAYPAL_CLIENT_ID,
          process.env.PAYPAL_CLIENT_SECRET
        )
      : new paypal.core.SandboxEnvironment(
          process.env.PAYPAL_CLIENT_ID,
          process.env.PAYPAL_CLIENT_SECRET
        );
  paypalClient = new paypal.core.PayPalHttpClient(environment);
}

// ========== RAZORPAY ==========
const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
    : null;

// ========== FACTORY ==========
class PaymentGatewayFactory {
  static createGateway(gateway) {
    switch (gateway.toLowerCase()) {
      case "stripe":
        return new StripeGateway();
      case "paypal":
        return new PayPalGateway();
      case "razorpay":
        return new RazorpayGateway();
      default:
        throw new Error(`Unsupported gateway: ${gateway}`);
    }
  }
}

// ========== STRIPE GATEWAY ==========
class StripeGateway {
  async createPaymentIntent(amount, currency, metadata) {
    if (!stripe) throw new Error("Stripe not configured");
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency || "usd",
      metadata,
    });
    return {
      referenceId: intent.id,
      clientSecret: intent.client_secret,
      gateway: "stripe",
    };
  }

  async confirmPayment(paymentIntentId) {
    if (!stripe) throw new Error("Stripe not configured");
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      status: intent.status,
      amount: intent.amount / 100,
      currency: intent.currency,
      gateway: "stripe",
    };
  }
}

// ========== PAYPAL GATEWAY ==========
class PayPalGateway {
  async createOrder(amount, currency, metadata) {
    if (!paypalClient) throw new Error("PayPal not configured");

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: currency || "USD", value: amount.toString() },
          custom_id: metadata.userId,
        },
      ],
      application_context: {
        return_url: `${process.env.FRONTEND_URL}/payment/success`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
      },
    });

    const order = await paypalClient.execute(request);
    return {
      referenceId: order.result.id,
      approvalUrl: order.result.links.find((l) => l.rel === "approve").href,
      gateway: "paypal",
    };
  }

  async capturePayment(orderId) {
    if (!paypalClient) throw new Error("PayPal not configured");

    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    const capture = await paypalClient.execute(request);

    return {
      status: capture.result.status,
      amount: capture.result.purchase_units[0].amount.value,
      currency: capture.result.purchase_units[0].amount.currency_code,
      gateway: "paypal",
    };
  }
}

// ========== RAZORPAY GATEWAY ==========
class RazorpayGateway {
  async createOrder(amount, currency, metadata) {
    if (!razorpay) throw new Error("Razorpay not configured");
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: currency || "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: metadata,
    });
    return {
      referenceId: order.id,
      amount: order.amount,
      currency: order.currency,
      gateway: "razorpay",
    };
  }

  async verifyPayment(paymentId, orderId, signature) {
    if (!razorpay) throw new Error("Razorpay not configured");
    const body = `${orderId}|${paymentId}`;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected === signature) {
      return { status: "succeeded", gateway: "razorpay" };
    } else {
      throw new Error("Invalid Razorpay signature");
    }
  }
}

// ========== CONTROLLERS ==========

// Create Payment (intent/order)
const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency, gateway = "stripe", metadata = {} } = req.body;
    if (!amount)
      return res
        .status(400)
        .json({ message: "Amount is required", success: false });

    const gatewayInstance = PaymentGatewayFactory.createGateway(gateway);
    let result;
    if (gateway === "stripe")
      result = await gatewayInstance.createPaymentIntent(
        amount,
        currency,
        metadata
      );
    if (gateway === "paypal")
      result = await gatewayInstance.createOrder(amount, currency, metadata);
    if (gateway === "razorpay")
      result = await gatewayInstance.createOrder(amount, currency, metadata);

    // ✅ Save to DB
    await Payment.create({
      userId: req.user._id,
      amount,
      currency,
      gateway,
      status: "created",
      referenceId: result.referenceId,
      metadata,
    });

    res.status(200).json({ ...result, success: true });
  } catch (err) {
    res.status(500).json({ message: err.message, success: false });
  }
};

// Confirm Payment
const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, orderId, paymentId, signature, gateway } =
      req.body;

    const gatewayInstance = PaymentGatewayFactory.createGateway(gateway);
    let result;

    if (gateway === "stripe")
      result = await gatewayInstance.confirmPayment(paymentIntentId);
    if (gateway === "paypal") result = await gatewayInstance.capturePayment(orderId);
    if (gateway === "razorpay")
      result = await gatewayInstance.verifyPayment(paymentId, orderId, signature);

    // ✅ Update DB
    const referenceId = paymentIntentId || orderId;
    await Payment.findOneAndUpdate(
      { referenceId },
      { status: result.status || "failed" },
      { new: true }
    );

    res.status(200).json({ message: "Payment processed", ...result, success: true });
  } catch (err) {
    res.status(500).json({ message: err.message, success: false });
  }
};

// Get Payment History
const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.status(200).json({ payments, success: true });
  } catch (err) {
    res.status(500).json({ message: "Error fetching payment history", success: false });
  }
};

// Available gateways (public)
const getAvailableGateways = async (req, res) => {
  try {
    const gateways = [];
    if (stripe)
      gateways.push({
        id: "stripe",
        name: "Stripe",
        icon: "💳",
        supportedCurrencies: ["USD", "EUR"],
        isAvailable: true,
      });
    if (paypalClient)
      gateways.push({
        id: "paypal",
        name: "PayPal",
        icon: "🅿️",
        supportedCurrencies: ["USD", "EUR"],
        isAvailable: true,
      });
    if (razorpay)
      gateways.push({
        id: "razorpay",
        name: "Razorpay",
        icon: "🇮🇳",
        supportedCurrencies: ["INR"],
        isAvailable: true,
      });

    res.status(200).json({ gateways, success: true });
  } catch (err) {
    res.status(500).json({ message: "Error fetching gateways", success: false });
  }
};

// Subscriptions
const createSubscription = async (req, res) => {
  try {
    if (!stripe)
      return res
        .status(500)
        .json({ message: "Stripe not configured", success: false });

    const { priceId } = req.body;
    const customer = await stripe.customers.create({
      email: req.user.email,
      name: req.user.fullName,
    });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    });

    res.status(200).json({ subscription, success: true });
  } catch (err) {
    res.status(500).json({ message: "Error creating subscription", success: false });
  }
};

const cancelSubscription = async (req, res) => {
  try {
    if (!stripe)
      return res
        .status(500)
        .json({ message: "Stripe not configured", success: false });

    const { id: subscriptionId } = req.params;
    const subscription = await stripe.subscriptions.cancel(subscriptionId);

    res.status(200).json({ message: "Subscription cancelled", subscription, success: true });
  } catch (err) {
    res.status(500).json({ message: "Error cancelling subscription", success: false });
  }
};

export {
  createPaymentIntent,
  confirmPayment,
  getPaymentHistory,
  getAvailableGateways,
  createSubscription,
  cancelSubscription,
};
