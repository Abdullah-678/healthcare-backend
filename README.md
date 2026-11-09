# Healthcare backend

## Production build

Use Node.js and npm:

```bash
npm ci
npm run build
npm start
```

The build generates the Prisma client before compiling TypeScript. `npm start`
runs the compiled server from `dist/src/server.js`. Apply schema changes to the
production database separately with `npm run db:migrate:deploy`; do not use
`prisma migrate dev` against production.

## Deploy on Vercel

Create a separate Vercel project for this repository and set its Root Directory
to the backend repository root. The `api/index.ts` entrypoint exports the
Express app from `src/app.ts`, and `vercel.json` routes requests to that
function and includes the email templates it needs. Its install command includes
development dependencies so Prisma generation and TypeScript compilation can
find the build tools and Node.js type definitions.

Set the following environment variables in the Vercel project for each
environment (Production, Preview, and Development) where the API will run:

- `NODE_ENV` (`production` in Production)
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`
- `ACCESS_TOKEN_EXPIRES_IN`
- `REFRESH_TOKEN_EXPIRES_IN`
- `BETTER_AUTH_SECRET_TOKEN_EXPIRES_IN`
- `BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE`
- `EMAIL_SENDER_SMTP_USER`
- `EMAIL_SENDER_SMTP_PASS`
- `EMAIL_SENDER_SMTP_HOST`
- `EMAIL_SENDER_SMTP_PORT`
- `EMAIL_SENDER_SMTP_FROM`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `FRONTEND_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPERADMIN_EMAIL`
- `SUPERADMIN_PASSWORD`

`PORT` defaults to `5000` and is not required on Vercel. Set `CRON_SECRET` to a
long, random secret to enable the protected maintenance endpoint.

Configure the frontend's `NEXT_PUBLIC_API_BASE_URL` as
`https://<backend-domain>/api/v1`. Configure Google OAuth's callback URL and
Stripe's webhook URL to match the deployed backend endpoints. The Google
authorized redirect URI is
`https://<backend-domain>/api/auth/callback/google`; the Stripe webhook URL is
`https://<backend-domain>/webhook`. Set `BETTER_AUTH_URL` to the backend origin
and `FRONTEND_URL` to the frontend origin.

Vercel Functions do not keep the in-process 25-minute timer alive. Configure an
external scheduler to send a `GET` request every 25 minutes to
`https://<backend-domain>/api/v1/maintenance/cancel-unpaid-appointments` with
`Authorization: Bearer <CRON_SECRET>`. Without `CRON_SECRET`, that endpoint is
disabled. Local and long-running server deployments continue to use the
in-process timer.

Before enabling production traffic, run database migrations and provision the
initial super-admin account. The regular server startup seeds the super-admin;
Vercel does not run `src/server.ts`, so do not expect that seed to run on
serverless cold starts.
