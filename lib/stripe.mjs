import Stripe from 'stripe';

export function getStripeClient(secretKey) {
  if (!secretKey) throw new Error('Stripe Secret Key is not configured.');
  return new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' });
}

export async function createStripeCheckoutSession({
  secretKey,
  mode,
  amountUsd,
  productName,
  customerEmail,
  metadata,
  successUrl,
  cancelUrl
}) {
  const stripe = getStripeClient(secretKey);
  const lineItem = {
    quantity: 1,
    price_data: {
      currency: 'usd',
      unit_amount: Math.round(Number(amountUsd) * 100),
      product_data: { name: productName }
    }
  };
  if (mode === 'subscription') {
    lineItem.price_data.recurring = { interval: 'month' };
  }

  const session = await stripe.checkout.sessions.create({
    mode,
    customer_email: customerEmail || undefined,
    line_items: [lineItem],
    metadata: metadata || {},
    success_url: successUrl,
    cancel_url: cancelUrl
  });

  return session;
}

export async function verifyStripeCheckoutSession(secretKey, sessionId) {
  const stripe = getStripeClient(secretKey);
  return stripe.checkout.sessions.retrieve(sessionId);
}

export async function createStripePortalSession(secretKey, customerId, returnUrl) {
  const stripe = getStripeClient(secretKey);
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl
  });
}

export function verifyStripeWebhookEvent(secretKey, rawBody, sigHeader, webhookSecret) {
  const stripe = getStripeClient(secretKey);
  return stripe.webhooks.constructEvent(rawBody, sigHeader, webhookSecret);
}
