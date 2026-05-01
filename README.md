# Lady Riders Mongolia

Static HTML/CSS/JS frontend with a Node.js Express backend.

## Production Setup

- Frontend: GitHub Pages
- Backend: Render Web Service
- Data file: `data.json`
- Uploads: `uploads/`

The frontend uses `api.js` to choose the API URL:

- Local development: `http://localhost:3000`
- Production: `https://lady-riders-mongolia.onrender.com`

## Domain Setup

Recommended domain:

- `ladyridersmongolia.mn`

Other good options:

- `ladyridersmongolia.com`
- `lady-riders-mongolia.mn`

Before buying a domain, check availability and trademark/social media consistency.

## Render Custom Domain Steps

Render custom domains are configured from the Render Dashboard.

1. Open the Render Dashboard.
2. Select the Lady Riders Mongolia web service.
3. Go to Settings.
4. Find Custom Domains.
5. Click Add Custom Domain.
6. Add your domain, for example `api.ladyridersmongolia.mn` or `ladyridersmongolia.mn`.
7. Configure DNS at your domain provider.
8. Return to Render and click Verify.
9. Wait for DNS propagation and TLS certificate setup.

DNS notes:

- For a subdomain such as `api.ladyridersmongolia.mn`, add a `CNAME` record pointing to the Render `onrender.com` service URL.
- For a root domain such as `ladyridersmongolia.mn`, use `ANAME`, `ALIAS`, or CNAME flattening if your DNS provider supports it.
- If those are not supported, Render documents an `A` record option using `216.24.57.1`.
- Remove conflicting `AAAA` records while setting up Render DNS.
- Render automatically issues and renews TLS certificates after verification.

Official docs:

- https://render.com/docs/custom-domains
- https://render.com/docs/configure-other-dns

## GitHub Pages Domain Notes

If the frontend moves from `https://123uugana.github.io/Documents/` to a custom domain, update these places:

- `api.js`: production API URL if the backend domain changes
- Render env var: `FRONTEND_ORIGINS`
- `robots.txt`
- `sitemap.xml`

Example Render env var:

```text
FRONTEND_ORIGINS=https://123uugana.github.io,https://ladyridersmongolia.mn
```

## Privacy

Membership form data is used only for membership review and communication. Phone, email, uploaded photos, and application details should not be shared publicly without permission.

See `privacy.html` for the public privacy policy.
