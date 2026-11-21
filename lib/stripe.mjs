import Stripe from 'stripe';

export function getStripeClient(secretKey) {
  if (!secretKey) throw new Error('Stripe Secret Key is not configured.');
  return new Stripe(secretKey, { apiVersion: '2025-02-24.acacia', timeout: 20000, maxNetworkRetries: 1 });
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

// The active subscription for a customer (by id or by email), or null.
export async function getActiveSubscription(secretKey, customerId, email) {
  const stripe = getStripeClient(secretKey);
  for (const id of await customerIdsFor(secretKey, customerId, email)) {
    const subs = await stripe.subscriptions.list({ customer: id, status: 'active', limit: 5 });
    const s = subs.data[0];
    if (s) {
      return { id: s.id, customerId: id, periodStart: Number(s.current_period_start || 0), amountUsd: Number(s.items.data[0]?.price?.unit_amount || 0) / 100 };
    }
  }
  return null;
}

// Move an active subscription to a new monthly price in place, so switching plans never creates a second subscription.
// An upgrade is invoiced and charged to the saved card right now. If that charge fails, nothing changes.
// A downgrade takes effect now and the unused time is credited on the next invoice.
export async function switchStripeSubscription({ secretKey, customerId, customerEmail, amountUsd, productName, metadata }) {
  const stripe = getStripeClient(secretKey);
  for (const id of await customerIdsFor(secretKey, customerId, customerEmail)) {
    const subs = await stripe.subscriptions.list({ customer: id, status: 'active', limit: 5 });
    const sub = subs.data[0];
    if (!sub) continue;
    const item = sub.items.data[0];
    const currentCents = Number(item.price?.unit_amount || 0);
    const newCents = Math.round(Number(amountUsd) * 100);
    if (newCents === currentCents) return { switched: true, customerId: id, chargedUsd: 0 };
    const upgrade = newCents > currentCents;
    const product = await stripe.products.create({ name: productName });
    const updated = await stripe.subscriptions.update(sub.id, {
      items: [{ id: item.id, price_data: { currency: 'usd', unit_amount: newCents, recurring: { interval: 'month' }, product: product.id } }],
      proration_behavior: upgrade ? 'always_invoice' : 'create_prorations',
      ...(upgrade ? { payment_behavior: 'error_if_incomplete' } : {}),
      metadata: metadata || {},
      expand: ['latest_invoice']
    });
    const inv = updated.latest_invoice && typeof updated.latest_invoice === 'object' ? updated.latest_invoice : null;
    if (upgrade && inv && inv.status !== 'paid' && Number(inv.amount_due) > 0) {
      throw new Error('Your card was not charged, so the plan did not change.');
    }
    return { switched: true, customerId: id, chargedUsd: upgrade && inv ? Number(inv.amount_paid || 0) / 100 : 0 };
  }
  return { switched: false };
}
