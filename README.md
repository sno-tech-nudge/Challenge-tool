# midline review (raw version)

Two views over one panel of organisations:

- **jury** (`/jury`): login, list of organisations with interview slot and your own score, an organisation page (details, internal queries and SWOT, Ecociate score and remarks) and a "start review" panel with 7 scored parameters, remarks, and a total out of 40. A juror only ever sees their own scores.
- **admin** (`/admin`): login, a snapshot table (Ecociate /60, jury average /40, final /100, Y/N verdict), and a score card per organisation with every juror's scores side by side, the Ecociate score and reasoning (fed by the admin), and a final verdict with rationale that feeds the snapshot.

Final score = Ecociate (already out of 60, entered as is) + average of submitted jury totals (out of 40). It shows `-` until both parts exist.

Stack: Next.js 14, Prisma, **Postgres**. Hosted on Vercel.

## Deploy on Vercel

1. **Create a Postgres database.** Easiest: in the Vercel project, Storage > Create > Neon (Postgres). Any Postgres works. You need two connection strings: a pooled one and a direct one. For Neon, the pooled string has `-pooler` in the host.
2. **Import the GitHub repo** `sno-tech-nudge/Challenge-tool` into Vercel (framework: Next.js, nothing else to change; the build uses the `vercel-build` script).
3. **Set environment variables** (Project Settings > Environment Variables, for Production and Preview):

   | name | value |
   |---|---|
   | `DATABASE_URL` | pooled connection string |
   | `DIRECT_URL` | direct connection string |
   | `AUTH_SECRET` | a long random string, e.g. `openssl rand -hex 32`. **Required**: the app refuses to sign sessions in production without it. |

   If you used Vercel's Neon integration, it creates differently named variables (`POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`). Add `DATABASE_URL` and `DIRECT_URL` with those values.
4. **Deploy.** The build runs `prisma generate`, applies migrations (`prisma migrate deploy`) and builds the app. This creates the empty tables.
5. **Seed the users and organisations once, from your own machine** (the seed is not run by Vercel). In a terminal in this repo:

   ```bash
   npm install
   cp .env.example .env     # then put the SAME DATABASE_URL and DIRECT_URL as Vercel in .env
   # also set SEED_PASSWORD_ADMIN and SEED_PASSWORD_JUROR1 (and SEED_PASSWORD) in .env
   npm run db:seed
   ```

   Re-running the seed is safe: it updates passwords and organisations by key and never touches submitted jury scores (demo scores are only added for the fictional sample organisations).
6. Open the Vercel URL and sign in.

If login says "incorrect email or password", the seed was not run against the same database Vercel uses, or the password in `.env` at seed time differs from the one you typed. Re-run `npm run db:seed` with the right values.

## Run locally

You need a Postgres database (a free Neon database works, or a local Postgres).

```bash
cp .env.example .env     # fill DATABASE_URL, DIRECT_URL, AUTH_SECRET
npm install
npm run setup            # applies migrations and seeds
npm run dev              # http://localhost:3000
```

## Seed logins

| role | email |
|---|---|
| admin | `gaurangwadhawan3@gmail.com` |
| jury | `gaurang.wadhawan@thenudge.org` (juror 1, starts with no scores) |
| jury | `juror2@example.test`, `juror3@example.test`, `juror4@example.test` (demo scores on test orgs 1 to 3) |

Passwords come from your `.env` at seed time: `SEED_PASSWORD_ADMIN` and `SEED_PASSWORD_JUROR1` for the two named accounts, `SEED_PASSWORD` for the rest. They are stored only as scrypt hashes, and `.env` is git-ignored. To change a password later, change the value and re-run `npm run db:seed`.

## Loading the real data later

Copy `data/orgs.sample.json` to `data/orgs.json` (git-ignored), replace it with real organisations (`key`, `name`, `slot`, `sector`, `location`, `website`, `summary`, `about`, `internalQueries`, `internalSwot`, optional `ecociateScore` out of 60 and `ecociateRemarks`), then run `npm run db:seed` against the target database. Rows are matched by `key`. The Ecociate score can also be typed in on the admin score card.

The 7 scoring parameters are a placeholder in `src/lib/rubric.ts` (they must sum to 40).

## Checks

`npm run lint` (type-check plus a small style gate) and `npm run build`.

## Not in this raw version

Reviewers, benches, rounds, outreach mail, AI scoring, synopsis, deck upload, analytics, comments and notifications, password change, admin editing of organisation details (use the JSON import).
