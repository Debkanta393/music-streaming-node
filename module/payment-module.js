import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    gateway: {
      type: String,
      enum: ["stripe", "paypal", "razorpay"],
      required: true,
    },
    status: {
      type: String,
      enum: ["created", "succeeded", "failed", "pending", "cancelled"],
      default: "created",
    },
    referenceId: {
      type: String, // Stripe intentId / PayPal orderId / Razorpay orderId
      required: true,
    },
    metadata: {
      type: Object, // optional extra info (like productId, notes)
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
