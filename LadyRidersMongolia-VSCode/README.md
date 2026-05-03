# Lady Riders Mongolia

React + Vite frontend with a Node.js Express backend.

## React Development

Install dependencies:

```bash
npm install
```

Start the backend API:

```bash
npm start
```

Start the React frontend in another terminal:

```bash
npm run dev
```

Local URLs:

- React app: `http://127.0.0.1:5173`
- Express API: `http://localhost:3000`

## Migration Progress

The React migration has started with these beginner-friendly pieces:

- `src/main.jsx`: mounts React into `index.html`
- `src/App.jsx`: loads API data with `useEffect`, stores it with `useState`, and wires CRUD functions
- `src/api.js`: shared fetch helper with `API_BASE_URL`, JSON, credentials, and FormData support
- `src/components/Header.jsx`: React header with mobile menu and admin/logout state
- `src/components/Features.jsx`: features list, add, edit, delete
- `src/components/About.jsx`: about list, add, edit, delete
- `src/components/CardActions.jsx`: shared edit/delete buttons
- `src/components/SectionHeading.jsx`: shared section title markup

Phase 2 added:

- `src/components/Stats.jsx`: renders stats and admin-only stat update buttons
- `src/components/Gallery.jsx`: renders the existing image grid
- `src/components/Contact.jsx`: renders contact data and admin-only save form

The next migration step is to convert `MembershipForm`.

Account-based membership added:

- `POST /api/users/register`: creates a member account with bcrypt password hash
- `POST /api/users/login`: logs a member in with session cookies
- `POST /api/users/logout`: logs a member out
- `GET /api/users/me`: returns the logged-in member without `passwordHash`
- `POST /api/membership`: requires member login and stores the application with `userId`
- `GET /api/admin/applications`: admin-only application list
- `PATCH /api/admin/applications/:id/status`: admin-only approve/reject

React components added:

- `src/components/UserRegister.jsx`
- `src/components/UserLogin.jsx`
- `src/components/UserStatus.jsx`
- `src/components/MembershipForm.jsx`
- `src/components/AdminLogin.jsx`
- `src/components/AdminApplications.jsx`

The account, membership form, admin login, and approval dashboard are now React
components using `useState`/`useEffect`. The React app does not use manual DOM
queries or event listeners for this flow.

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
