# Dashboard shell

One layout for every role. A route layout just wraps its pages:

```jsx
<DashboardShell role={ROLES.ADMIN}>{children}</DashboardShell>
```

| Area | Layout file | Role |
|---|---|---|
| `/dashboard/admin/*` | `app/dashboard/admin/layout.jsx` | `ADMIN` |
| `/dashboard/hospital/*` | `app/dashboard/hospital/layout.jsx` | `HOSPITAL_STAFF` |
| `/profile`, `/qr-card`, `/notification` | `app/(donor)/layout.jsx` | `DONOR` |

## What's where
- `DashboardShell` – guard + frame (sidebar, top bar, content). Renders nothing protected until the session is confirmed.
- `DashboardSidebar` – dark-red rail on desktop, slide-in drawer below 900px.
- `DashboardTopBar` – page title, `NotificationMenu`, theme toggle, `ProfileMenu`.
- `BrandLogo` – logo mark (`assets/logo-mark.png`) + name (`lib/brand.js`).
- `hooks/useDashboardSession` – confirms the session with the server; `hooks/useDashboardNotifications` – live, role-specific alerts.
- `lib/navigation.js` – **the menu for each role lives here.**

## Common changes
- **Add/rename a nav item:** edit that role's `sections` in `lib/navigation.js`. Active state and the top-bar title follow automatically.
- **Add a page under an existing area:** create it under the area's folder — it inherits the shell.
- **Change the product name:** `lib/brand.js`. **Sidebar colours:** `sidebar` in `lib/design-tokens.js`.

## Security model
Hiding a menu item is presentation only. Access is enforced by:
1. **The shell** – asks the server (`GET /api/staff/me` or `/api/user/me`) who you are and re-reads the account, ignoring whatever role is in localStorage. No session → login; wrong role → your own dashboard; bad/expired token → session cleared.
2. **The API** – every protected route re-checks the JWT's role (`requireRole`), which is what actually protects data. A new page's *data* must be protected there, not by the menu.
