# Auth email templates

Upload these HTML templates in **Supabase Dashboard → Authentication → Email Templates**.

| File | Supabase template | Suggested subject |
|------|-------------------|-------------------|
| `confirm-signup.html` | Confirm signup | Confirm your PrimeFx Invest email |
| `magic-link.html` | Magic link | Your PrimeFx Invest sign-in link |

## Branding checklist

- Dark luxury background (`#050816` / `#0b1224`)
- Primary blue CTA (`#0052ff`)
- PrimeFx logo via `{{ .SiteURL }}/logo.png`
- Support link: `support@primefxinvest.com`
- Security notice included
- Mobile-responsive table layout

## Redirect URL

Confirm signup links should land on:

`https://www.primefxinvest.com/auth/callback?redirect=/dashboard&verify=1`

Add that exact callback URL under **Authentication → URL Configuration → Redirect URLs**.
