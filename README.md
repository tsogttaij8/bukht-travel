This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Email Login

Login code email ilgeeh bol `.env.local` deer dorh huvisagchuudaas negiig ni tohiruulna.

Production-d ashiglah zuv songolt ni `Resend`:

```bash
# Recommended: Resend
MAIL_FROM=no-reply@your-domain.com
RESEND_API_KEY=re_xxx

# Easiest for local testing: Gmail SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourgmail@gmail.com
SMTP_PASS=your-google-app-password

# Alternative: custom JSON mail API
MAILRUN_API_URL=https://your-mail-service.example/send
MAILRUN_API_KEY=optional-key
```

Hervee edgeer ni hooson bol app ni development deer kodig server log deer hevledeg bogood login huudas deer `DEV код` haruulna.

## Production Email Checklist

1. Domain-aa avna. Jishee ni `bukht.mn`.
2. Resend deer domain-aa `verify` hiine.
3. DNS deer Resend-ees uguh `SPF` bolon `DKIM` record-uudiig nemeh.
4. Deploy environment deer dorh huvisagchuudiig tohiruulna:

```bash
MAIL_FROM=no-reply@bukht.mn
RESEND_API_KEY=re_xxx
SESSION_SECRET=long-random-secret
ADMIN_EMAILS=admin@bukht.mn
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

5. App-aa redeploy hiine.
6. Uuriin email ruu code avch test hiine.
7. Spam folder ruu orj baigaa эсэхийг shalgana.

Delgerengui checklist: `docs/email-production-checklist.md`

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
