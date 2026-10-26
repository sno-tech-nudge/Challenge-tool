# the aahaar bazaar challenge

A jury scoring tool and admin snapshot for the aahaar bazaar challenge. Jurors read about each organisation, score it against six criteria, and give a yes or no verdict with a comment. Admins see every score side by side, feed in the M&E (Ecociate) score, and record the final verdict.

Stack: Next.js 14 (App Router), TypeScript, Prisma, **Postgres**. Hosted on Vercel.

## What each role sees

**Jury** (`/jury`)

- **Organisations list**: every organisation (alphabetical, ignoring case) with your own status and score out of 40. A juror only ever sees their own scores.
- **Organisation page**:
  - *organisation details*: a contents bar that sticks under the header, then organisation brief and "the solution" (with the website), geographical coverage, women foodpreneurs covered, markets (with a revenue table), partnerships, scalability plan and SWOT.
  - A button, **click to view the org fact sheet (by M&E partner)**, opens that organisation's PDF in a new tab.
  - *internal remarks*: questions the team could ask about the organisation's current model ("to probe").
  - A **scoring guide** card (opens the rubric, the scale and the questions behind each criterion) and the **start review** form: six criteria, each scored out of 10 in half points, with a live total out of 40.
  - A full-width **final verdict** section at the end: yes or no, plus a required comment. Submitting shows a summary to confirm, then a "THANK YOU" dialog. The juror chooses when to go back (nothing redirects automatically).
- The previous and next buttons stay locked until the juror has submitted their scores for the organisation.
- Scrolling the mouse wheel over a score box never changes the score.

**Admin** (`/admin`)

- **Snapshot**: every organisation with the M&E score (out of 60), the jury score (out of 40), the final score (out of 100) and the admin verdict.
- **Score card** per organisation: the same details and fact sheet button as jurors, internal remarks plus each juror's comment ("jury comments"), a scores card, the Ecociate score and reasoning form, a table of every juror's scores per criterion (with each juror's yes or no), and the admin's own **final verdict** with rationale, which feeds the snapshot.
- **Settings** (`/admin/settings`):
  - *team*: add a member (name, login id which is their email, password with a generate button), edit name or id, reset a password (leave the field empty to keep it), or remove them. A member who has submitted reviews cannot be removed, so scores are never lost.
  - *activity log*: who submitted, updated or cleared a review, changed a verdict, edited the Ecociate score, or changed a team member, in India time. Passwords are never written to the log.

On screens 860px wide or narrower the details and the scoring column stack. On larger screens the page scrolls as one, with the scoring column pinned beside the details.

## How scoring works

- Each juror scores **six criteria out of 10**. Weights (src/lib/rubric.ts): focus on the target group 7.5, unlocking new markets 7.5, economic viability 25, innovation 15, replicability 25, founding team and organisational depth 20 (they sum to 100).
- A criterion's points are `score / 10 x weight`. The total is stored out of 100 and **shown out of 40** (`x 0.4`), so the weights read as 3, 3, 10, 6, 10 and 8 points.
- **Final score = M&E (Ecociate) score out of 60, entered as is, + the average of the jurors' totals out of 40.** It shows `-` until both parts exist.
- Score colours: 71% or more green, 50% to under 71% yellow, below 50% red.

## Sections that are switched off for now

At the team's request these are hidden but their content stays in the data, so they can be switched back on:

- **Unit economics**: removed from `ORG_SECTIONS` in `src/lib/orgSections.ts`.
- **Barriers it addresses** and the **organisational cost model**: the `SHOW_BARRIERS` and `SHOW_COST_MODEL` flags at the top of `src/components/OrgDetails.tsx`.

## Organisation data

Organisation content lives in the database (`Org.details`, a JSON of `{ sectionKey: Block[] }`; the block shapes are in `src/lib/orgSections.ts`). It is loaded from a local file, so the real data is never committed:

- **`data/orgs.json`** (git-ignored): one entry per organisation with `key`, `name`, `website`, `internalQueries`, optional `ecociateScore` (already out of 60) and `ecociateRemarks`, and `details`. `data/orgs.sample.json` shows the shape with fictional data.
- Load it with:

  ```bash
  npm run db:import-orgs                              # imports data/orgs.json
  npm run db:import-orgs -- some/file.json            # imports another file
  npm run db:import-orgs -- --delete key-1,key-2      # removes organisations (their scores go too), then imports
  ```

  Rows are matched by `key`. Only the fields present in the file are written, so an import never wipes a verdict, a jury score or an Ecociate score entered in the app.
- `scripts/xlsx-to-orgs.py` was a one-off converter for the first data sheet. The sheet layout has changed since, so treat it as a reference rather than a tool.

### Org fact sheets (PDF)

Each organisation can have a PDF fact sheet from the M&E partner.

1. Put the PDFs in `data/factsheets/`, named after the organisation key (for example `win-win-bites.pdf`). The folder is git-ignored because the files hold real organisation data.
2. Run `npm run db:import-factsheets`. Each PDF is stored in the database (table `OrgFactsheet`, so it is never loaded with the organisation).
3. The PDF is served only to signed-in people, at `/api/factsheet/<org id>`. Signed-out requests go to the sign-in page. The button shows only for organisations that have a PDF.

## Deploy on Vercel

1. **Create a Postgres database.** Easiest: in the Vercel project, Storage > Create > Neon (Postgres). Any Postgres works. You need two connection strings: a pooled one and a direct one. For Neon, the pooled string has `-pooler` in the host.
2. **Import the GitHub repo** `sno-tech-nudge/Challenge-tool` into Vercel (framework: Next.js; the build uses the `vercel-build` script).
3. **Set environment variables** (Project Settings > Environment Variables, for Production and Preview):

   | name | value |
   |---|---|
   | `DATABASE_URL` | pooled connection string |
   | `DATABASE_URL_UNPOOLED` | direct connection string |
   | `AUTH_SECRET` | a long random string, for example `openssl rand -hex 32`. **Required**: the app refuses to sign sessions in production without it. |

   If you used Vercel's Neon integration, it creates differently named variables (`POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`). Add `DATABASE_URL` and `DATABASE_URL_UNPOOLED` with those values.
4. **Deploy.** Every build runs `prisma generate`, applies any new migrations (`prisma migrate deploy`) and builds the app. New database columns and tables arrive with the deploy, so there is no separate step for them.
5. **First-time setup only: create the first accounts and organisations** from your own machine (Vercel does not run the seed):

   ```bash
   npm install
   cp .env.example .env     # put the SAME DATABASE_URL and DATABASE_URL_UNPOOLED as Vercel in .env
   # also set SEED_PASSWORD_ADMIN and SEED_PASSWORD_JUROR1 (and SEED_PASSWORD) in .env
   npm run db:seed
   ```
6. Open the Vercel URL and sign in. Add the rest of the team from **settings > team**.

> **Do not run `npm run db:seed` on a live database.** It resets the password of every seeded account (the admin, juror 1 and the demo jurors `juror2` to `juror4`) and re-creates any of them that were removed. Manage people from settings instead, and use `db:import-orgs` and `db:import-factsheets` for content.

If login says "incorrect email or password": check the email is the exact id shown in settings (ids were sometimes edited after an account was created) and that the password is the one set for that person. An admin can set a new one from settings > team.

## Run locally

You need a Postgres database (a free Neon database works, or a local Postgres).

```bash
cp .env.example .env     # fill DATABASE_URL, DATABASE_URL_UNPOOLED, AUTH_SECRET
npm install
npm run setup            # applies migrations and seeds a fresh database
npm run dev              # http://localhost:3000
```

Seed accounts (fresh databases only): admin `gaurangwadhawan3@gmail.com`; juror 1 `gaurang.wadhawan@thenudge.org`; demo jurors `juror2@example.test`, `juror3@example.test`, `juror4@example.test`. Passwords come from `.env` at seed time (`SEED_PASSWORD_ADMIN`, `SEED_PASSWORD_JUROR1`, and `SEED_PASSWORD` for the rest) and are stored only as scrypt hashes. `.env` is git-ignored.

## Scripts

| command | what it does |
|---|---|
| `npm run dev` | local development server |
| `npm run lint` | type-check plus the style gate (`scripts/check-style.mjs`) |
| `npm run build` | production build |
| `npm run setup` | apply migrations and seed (fresh database) |
| `npm run db:migrate` | create a new migration during development |
| `npm run db:seed` | seed accounts and organisations (see the warning above) |
| `npm run db:import-orgs` | load or remove organisations from `data/orgs.json` |
| `npm run db:import-factsheets` | load PDFs from `data/factsheets/` |

## Not in this version

Reviewers, benches, rounds, outreach mail, AI scoring, deck upload, analytics, comments and notifications, a self-service password change (an admin resets passwords from settings), and admin editing of organisation details (use the JSON import). See `ARCHITECTURE.md` for how the code is organised.
