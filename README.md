# midline review (raw version)

Two views over one panel of organisations:

- **jury** (`/jury`): login, list of organisations with interview slot and your own score, an organisation page (details, internal queries and SWOT, Ecociate score and remarks) and a "start review" panel with 7 scored parameters, remarks, and a total out of 40. A juror only ever sees their own scores.
- **admin** (`/admin`): login, a snapshot table (Ecociate /60, jury average /40, final /100, Y/N verdict), and a score card per organisation with every juror's scores side by side, the Ecociate score and reasoning (fed by the admin), and a final verdict with rationale that feeds the snapshot.

Final score = Ecociate (already out of 60, entered as is) + average of submitted jury totals (out of 40). It shows `—` until both parts exist.

## Run it (three commands)

```bash
npm install
npm run setup   # applies migrations, seeds users and 9 fictional organisations
npm run dev     # http://localhost:3000
```

`.env` is needed first: `cp .env.example .env`. SQLite file `prisma/dev.db` is created locally.

## Seed logins (dev only)

| role | email |
|---|---|
| admin | `gaurangwadhawan3@gmail.com` |
| jury | `gaurang.wadhawan@thenudge.org` (juror 1, starts with no scores) |
| jury | `juror2@example.test`, `juror3@example.test`, `juror4@example.test` (have demo scores on test orgs 1 to 3) |

Every seeded account uses the dev password in `SEED_PASSWORD` (see `.env.example`). It exists only so a local clone can log in. Change it, or do not seed, on anything shared. Passwords are stored as scrypt hashes.

## Loading the real data later

Copy `data/orgs.sample.json` to `data/orgs.json` (git-ignored), replace it with real organisations (`key`, `name`, `slot`, `sector`, `location`, `website`, `summary`, `about`, `internalQueries`, `internalSwot`, optional `ecociateScore` out of 60 and `ecociateRemarks`), then run `npm run db:seed`. Rows are matched by `key`. The Ecociate score can also be typed in on the admin score card. Demo jury scores are only added when the sample file is used.

The 7 scoring parameters are a placeholder in `src/lib/rubric.ts` (they must sum to 40).

## Checks

`npm run lint` (type-check plus a small style gate) and `npm run build`.

## Not in this raw version

Reviewers, benches, rounds, outreach mail, AI scoring, synopsis, deck upload, analytics, comments and notifications, dark-mode toggle (tokens exist), password change, admin editing of organisation details (use the JSON import).
