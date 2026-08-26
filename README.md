# MajesticPermitsHUB

White-glove permit management for South Florida contractors and homeowners.

## Already configured in Vercel
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Environment variables still to add in Vercel

| Variable | Where to get it |
|----------|-----------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` (secret) |
| `NEXT_PUBLIC_ADMIN_EMAIL` | Set to `angelique@majesticpermits.com` |
| `NEXT_PUBLIC_SITE_URL` | Your production domain (e.g. `https://majesticpermits.com`) |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → API keys |
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys |
| `RESEND_FROM_EMAIL` | A verified domain sender, e.g. `updates@majesticpermits.com` |

## Logos
Place the two logo PNGs you have into:
- `/public/logos/majestic_permits_logo.png`
- `/public/logos/permit_closer_logo.png`

Favicon placeholders are in `/public/icons/`. Replace them with generated versions from the Majestic Permits logo when ready.

## Local development (optional)
This project is designed for GitHub → Vercel. Local run is only needed if you want to test offline.
