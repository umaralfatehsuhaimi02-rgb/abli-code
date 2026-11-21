# Abli Code profit model

All numbers are per month in USD. Provider cost is the sell price divided by the markup (1.1 on cheap models, the worst case). Stripe takes 2.9% plus $0.30 per charge.

## Plans (usage caps are in billed dollars)

| Plan | Price | Paid-usage cap | Free pool | Stripe fee | Profit if fully used | Profit at typical use |
|---|---|---|---|---|---|---|
| Plus | $20 | $14 | 5M tokens/day | $0.88 | $0.69 | $12.89 |
| Pro | $50 | $40 | 5M tokens/day | $1.75 | $6.19 | $32.56 |
| Max | $100 | $75 | 25M tokens/day | $3.20 | $0.12 | $63.83 |

Typical use assumes 40% of the cap and 20% of the free pool. "Fully used" assumes 100% of both, every month, on the costliest-per-dollar models, and is still not a loss.

## Free pool cost

- Pool tokens are weighted by cost, so a Max user burning the whole 25M pool on Abli Flash 5 or 5.1 uses it 5 to 6 times faster than on Lite models. That caps the daily cost at $0.95 per Max user and $0.19 per free user.
- A free user who uses the whole pool every day costs $5.70 a month. A typical free user (6% of the pool) costs $0.34.

## Reaching $500 profit a month

Fixed costs: server $12, Supabase $25, domain $1.25 = $38.25. Paid mix 60% Plus, 30% Pro, 10% Max gives an average profit of $23.89 per paying user.

| Free users | Free-user cost (typical) | Paying users needed | Paying users needed if 10% of free users max the pool |
|---|---|---|---|
| 200 | $68.40 | 26 | 30 |
| 500 | $171.00 | 30 | 41 |
| 1000 | $342.00 | 37 | 60 |
| 3000 | $1026.00 | 66 | 133 |

## Why the caps are not 150% of the price

A 150% cap means a $20 plan can burn $30 of billed usage, about $27 of provider cost. That loses money for any user above roughly 65% of their cap. The caps above keep every plan profitable even when fully used.

## Safeguards

- Chat is limited to 20 messages a minute per account.
- Email verification is required, and free usage is one shared pool per account per day.
- Refuseless and the other providers rate-limit one master key, so ask for higher limits before launch.
- Top-ups: the 5% fee (minimum $0.80) covers Stripe, and the 10% to 25% markup is extra margin.
