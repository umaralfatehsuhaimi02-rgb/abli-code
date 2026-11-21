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
  cancelUrl,
  embedded
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

  const params = {
    mode,
    customer_email: customerEmail || undefined,
    line_items: [lineItem],
    metadata: metadata || {}
  };
  if (embedded) {
    // Payment form renders inside the app. No redirect to checkout.stripe.com.
    params.ui_mode = 'embedded';
    params.redirect_on_completion = 'never';
  } else {
    params.success_url = successUrl;
    params.cancel_url = cancelUrl;
  }
  const session = await stripe.checkout.sessions.create(params);

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

export async function customerIdsFor(secretKey, customerId, email) {
  const stripe = getStripeClient(secretKey);
  const ids = [];
  if (customerId) ids.push(customerId);
  if (email) {
    const found = await stripe.customers.list({ email, limit: 10 });
    for (const c of found.data) if (!ids.includes(c.id)) ids.push(c.id);
  }
  return ids;
}

export async function cancelStripeSubscriptions(secretKey, customerId, email) {
  const stripe = getStripeClient(secretKey);
  let n = 0;
  for (const id of await customerIdsFor(secretKey, customerId, email)) {
    const subs = await stripe.subscriptions.list({ customer: id, status: 'active', limit: 20 });
    for (const s of subs.data) { await stripe.subscriptions.cancel(s.id); n++; }
  }
  return n;
}

// Move an active subscription to a new monthly price in place (prorated), so switching plans never creates a second subscription.
export async function switchStripeSubscription({ secretKey, customerId, customerEmail, amountUsd, productName, metadata }) {
  const stripe = getStripeClient(secretKey);
  for (const id of await customerIdsFor(secretKey, customerId, customerEmail)) {
    const subs = await stripe.subscriptions.list({ customer: id, status: 'active', limit: 5 });
    const sub = subs.data[0];
    if (!sub) continue;
    const item = sub.items.data[0];
    const product = await stripe.products.create({ name: productName });
    await stripe.subscriptions.update(sub.id, {
      items: [{ id: item.id, price_data: { currency: 'usd', unit_amount: Math.round(Number(amountUsd) * 100), recurring: { interval: 'month' }, product: product.id } }],
      proration_behavior: 'create_prorations',
      metadata: metadata || {}
    });
    return { switched: true, customerId: id };
  }
  return { switched: false };
}
