// src/routes/payment.routes.ts
import { Router } from "express";
import { PaymentService } from "../services/payment.service";
import { authMiddleware, AuthRequest } from "../middlewares/auth.middleware";
import Stripe from "stripe";
import { raw } from "express";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

// Create subscription
router.post("/subscribe", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { plan } = req.body;
    const result = await PaymentService.createSubscription(req.user!.id, plan);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// Stripe webhook (raw body)
router.post(
  "/webhook",
  raw({ type: "application/json" }),
  async (req, res, next) => {
    try {
      const sig = req.headers["stripe-signature"] as string;
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || ""
      );

      await PaymentService.handleWebhook(event);
      res.json({ received: true });
    } catch (error) {
      next(error);
    }
  }
);

// Get payment history
router.get("/history", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const history = await PaymentService.getPaymentHistory(req.user!.id);
    res.json(history);
  } catch (error) {
    next(error);
  }
});

export default router;
