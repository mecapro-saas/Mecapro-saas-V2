// src/services/payment.service.ts
import Stripe from "stripe";
import prisma from "../config/database";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

const PLANS = {
  STARTER: {
    priceId: process.env.STRIPE_PRICE_STARTER || "price_starter",
    quota: 5,
    price: 7900, // 79€ en cents
  },
  PRO: {
    priceId: process.env.STRIPE_PRICE_PRO || "price_pro",
    quota: 15,
    price: 14900, // 149€ en cents
  },
  PREMIUM: {
    priceId: process.env.STRIPE_PRICE_PREMIUM || "price_premium",
    quota: -1, // unlimited
    price: 29900, // 299€ en cents
  },
};

export class PaymentService {
  static async createSubscription(userId: string, planKey: "STARTER" | "PRO" | "PREMIUM") {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const plan = PLANS[planKey];
    if (!plan) throw new Error("Invalid plan");

    // Récupérer ou créer customer Stripe
    let stripeCustomerId: string;

    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (existingSubscription?.stripeCustomerId) {
      stripeCustomerId = existingSubscription.stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: { userId },
      });
      stripeCustomerId = customer.id;
    }

    // Créer la subscription Stripe
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: plan.priceId }],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    });

    // Sauvegarder dans la DB
    await prisma.subscription.upsert({
      where: { userId },
      update: {
        plan: planKey,
        stripeCustomerId,
        stripeSubId: subscription.id,
        contactQuota: plan.quota,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        status: "ACTIVE",
      },
      create: {
        userId,
        plan: planKey,
        stripeCustomerId,
        stripeSubId: subscription.id,
        contactQuota: plan.quota,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        status: "ACTIVE",
      },
    });

    return {
      subscription,
      clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
    };
  }

  static async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription = await prisma.subscription.findUnique({
          where: { stripeSubId: invoice.subscription as string },
        });
        if (subscription) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: "ACTIVE" },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription = await prisma.subscription.findUnique({
          where: { stripeSubId: invoice.subscription as string },
        });
        if (subscription) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: "PAST_DUE" },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const dbSubscription = await prisma.subscription.findUnique({
          where: { stripeSubId: subscription.id },
        });
        if (dbSubscription) {
          await prisma.subscription.update({
            where: { id: dbSubscription.id },
            data: { status: "CANCELED", canceledAt: new Date() },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const dbSubscription = await prisma.subscription.findUnique({
          where: { stripeSubId: subscription.id },
        });
        if (dbSubscription && subscription.current_period_end) {
          await prisma.subscription.update({
            where: { id: dbSubscription.id },
            data: {
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
          });
        }
        break;
      }
    }
  }

  static async getPaymentHistory(userId: string) {
    return await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }
}
