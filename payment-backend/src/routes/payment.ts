import { Router } from "express";
import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

const router = Router();

// ✅ Initialize Razorpay with Environment Variables
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

// ✅ Debug Log: Ensure Keys are Loaded
console.log("RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID);
console.log("RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_SECRET);

// ✅ Create Order Route
router.post("/create-order", async (req, res) => {
  try {
    const { amount, currency } = req.body;

    // ✅ Create Razorpay Order
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: `receipt_${Date.now()}`,
    });

    res.json({ success: true, order_id: order.id });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ success: false, message: "Failed to create order" });
  }
});

// ✅ Verify Payment Route
router.post("/verify-payment", async (req, res) => {
  try {
    const { payment_id, order_id, signature } = req.body;

    // ✅ Verify Signature
    const isValid = verifyPaymentSignature(
      { payment_id, order_id, signature },
      process.env.RAZORPAY_KEY_SECRET!
    );

    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    res.json({ success: true, message: "Payment verified successfully" });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({ success: false, message: "Failed to verify payment" });
  }
});

export default router;
