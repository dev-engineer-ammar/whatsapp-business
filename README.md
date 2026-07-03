# WhatsApp Commerce App

Two-folder TypeScript project:

- `backend/`: Express API, WhatsApp webhooks, MongoDB models, payment webhooks, admin auth
- `frontend/`: React + TypeScript admin panel

## Folder Structure

```text
backend/
  src/
    config/
    controllers/
    middleware/
    models/
    routes/
    services/
    types/
frontend/
  src/
    auth/
    components/
    pages/admin/
    routes/
    services/api/
    utils/
```

## Backend

Set backend environment variables in `backend/.env`.

Important admin auth values:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `ADMIN_API_KEY`

Run backend:

```bash
npm install --prefix backend
npm --prefix backend run dev
```

Backend routes:

- `POST /api/admin/auth/login`
- `POST /api/admin/auth/logout`
- `GET /api/admin/auth/me`
- `GET /api/admin/orders`
- `GET /api/admin/products`
- `GET /api/admin/payments`

Browser authentication uses an HTTP-only cookie. Server-to-server calls can also use `x-admin-api-key`.

## Frontend

Run React admin panel:

```bash
npm install --prefix frontend
npm --prefix frontend run dev
```

Open:

```text
http://localhost:5173
```

The frontend uses:

- Axios instance in `frontend/src/services/api/axiosInstance.ts`
- Auth API service in `frontend/src/services/api/authService.ts`
- Admin API service in `frontend/src/services/api/adminService.ts`
- Protected routes in `frontend/src/auth/ProtectedRoute.tsx`
- Route definitions in `frontend/src/routes/AppRoutes.tsx`
- Login/Register files in `frontend/src/auth/`
- Admin pages in `frontend/src/pages/admin/`

For production:

```bash
npm --prefix frontend run build
npm --prefix backend run build
npm --prefix backend start
```

After the frontend build, the backend serves the compiled admin panel at `/admin`.
