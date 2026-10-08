# ARCHITECTURE.md — study of the reference codebase (Phase 1)

Source studied: `the-delta-prize-full` (read only). Everything below was verified against the files,
not the reference's `CLAUDE.md`, which is partly stale (see section F).
Reference names appear here only because this is a study document. None of them carry into the new project.

---------------------------------------------------------------------------------------------------

## A. Repo map

| Path | What lives there |
|---|---|
| `prisma/schema.prisma` | 20 models, Postgres, `relationJoins` preview feature. Enums are plain `String` columns. `directUrl` + pooled `url`. Whole app lives in a custom PG schema (`?schema=...`). |
| `prisma/seed.ts` | Old demo seeder (reads an xlsx, seeds users, runs scorer). Not used in production any more. |
| `src/middleware.ts` | Edge middleware. Verifies the HMAC cookie; redirects anonymous users to `/login`. **Skips `/apply /status /challenge /login /api`**. |
| `src/app/layout.tsx` | Root layout: theme boot script in `<head>`, `ToastProvider`, global CSS. |
| `src/app/page.tsx` | `redirect('/dashboard')`. |
| `src/app/login/page.tsx` | Email and password form. |
| `src/app/(public)/` | `challenge`, `apply` (+`thank-you`), `status`. No auth. Public apply form is a server action. |
| `src/app/(app)/` | Internal tool. `layout.tsx` = `getCurrentUser()` then `<AppShell>`. Pages: `dashboard`, `applications` (round 1 list), `applications/[id]` (record), `applications/round-2` (+`[id]`, jury oversight), `applications/round-3`, `review` (+`[id]`, reviewer queue), `outreach`, `targets`, `analytics`, `jury-guide`, `settings` (+`benches`, `view`). |
| `src/app/api/` | `applications/export`, `applications/round-2/export` (CSV), `deck-upload` (Blob token), `ingest` (form webhook), `jobs/tick`, `sync/tick`, `notifications`, `outbox`, `score`, `validate-org`, `tally/webhook`, `uploads/[kind]`. |
| `src/components/` | About 90 components. Client islands: `AppShell`, tickers, bell, filters, forms, panels. `ApplicationMainContent` is a **server** component that renders the whole record and applies field visibility. |
| `src/design-system/` | Hand-ported primitives (Button, Card, Badge, Input, Select, Dialog, Tabs, Toast, AngularBanner, Logo, …). All UI must use them. |
| `design-system/` | Source of the brand kit: `tokens/*.css` (colors, spacing, type, effects, fonts), `_adherence.oxlintrc.json`, assets, guideline HTML, ui kits. Outside `src/`, so raw hex is allowed there. |
| `src/styles/globals.css` | Imports tokens, base resets, `@media print`, small animation classes. |
| `src/lib/*` | Domain modules (below). |
| `scripts/` | `check-adherence.mjs` (the real lint), `score-all/rescore-*`, `seed-logins`, `seed-real-targets`, one-off scratch scripts. |
| `data/` | Real xlsx/csv. **Contains real data; the new project must not copy it.** |
| config | `package.json`, `next.config.js` (server action limit 4.5mb), `vercel.json` (region), `tsconfig.json`, `.env.example`, `.claude/launch.json`. |

`src/lib` modules:

- `auth/`: `password` (scrypt), `session-token` (Web Crypto HMAC, edge-safe), `session` (`getCurrentUser`, React `cache`), `guard` (role lists and scoped where), `actions` (login, logout, user CRUD).
- `applications/`: `queries` (list, filters, detail, adjacent), `actions` (round decisions, reviews, comments, notes, assignment), `jury-actions`, `assignment` (round-robin), `reviewStatus`, `consensus`, `exportColumns`, `apply-action`.
- `scoring/`: `rubric`, `juryRubric`, `juryConsensus`, `runner` (providers), `prompt`, `heuristic`, `eligibility`, `parse`, `types`.
- `jobs/queue`: DB queue. `synopsis/`: runner, prompt, heuristic, ensure. `enrichment/`: website scraper. `validation/`: three LLM cross-checks. `matching/`: fuzzy wishlist match.
- `mail/`: `mailer` (stub, resend, gmail), `outbox`, `actions`, `templates`, `rounds`, `queries`.
- `notifications/`: `actions` (mentions), `team` (broadcast), `queries`.
- `sources/`: `supabase-source` (sync), `supabase-client`, `normalize`, plus dead stubs (google-form, zoho-crm, seed).
- `visibility/`: field registry and per-role map. `uploads/`: settings-table uploads and deck blob actions. `settings.ts`: JSON blob in `Setting`. `benches/`, `dashboard/`, `analytics/`, `targets/`, `automation/`, `stages/`, `constants.ts`, `csv.ts`, `theme.ts`.

---------------------------------------------------------------------------------------------------

## B. Data model

Every PK is `cuid()`. Unless noted, child rows are `onDelete: Cascade` from `Application`.

| Model | Key fields and relations |
|---|---|
| `User` | `email` unique, `username?` unique (= email, login key), `passwordHash?`, `role` (string). M:N `benches` (implicit join table). Back-relations to reviews, scores, comments, notes, notifications, assignments, transitions. |
| `Bench` | `name`, `panelJurorNames?` (display text, semicolon-joined), M:N `jurors`, 1:N `applications` (`onDelete: SetNull` on the application side). |
| `Application` | About 120 scalar columns (identity, registrations, model, tech, impact, source metadata, ~40 columns of validation and synopsis status), plus `round1Decision / round2Decision / round3Decision` (nullable string), `currentRound` (default `ROUND_1`), `stageStatus` (legacy), `benchId?`, `interviewDay/Time` (display text), `deckUrl?`, `isConsortium`, `isEcosystemPartner`, `externalId` unique, `isDuplicateOf` self-relation, `targetMatchId?` (SetNull). |
| `Founder`, `Funder`, `TechUseCase`, `ReportLink` | Repeatable form entries. |
| `ReviewAssignment` | `@@unique([applicationId, reviewerId])`. `reviewer` relation has **no cascade**. |
| `HumanReview` | `@@unique([applicationId, reviewerId])`, `criteria` JSON string, `composite`, `recommendation`, `comment`. |
| `JuryScore` | `@@unique([applicationId, jurorId])`, `criteria` JSON, `composite`, `verdict` (YES/NO), `comment`. |
| `AiEvaluation` | Many per application (history). `criteria`, `redFlags`, `eligibility` JSON strings, `composite`, `disposition`, `rubricVersion`, `rubricWeightsSnapshot`. |
| `Comment`, `Note` (`@@unique(app, author)`), `Notification` (`@@index([userId, read])`, cascades from user and application) | Collaboration. |
| `StageTransition` | Legacy audit rows (`from/toStatus`, `actorId?`, `reason`). |
| `OutboxEmail` | `to, subject, body, template, status (QUEUED/APPROVED/SENT/FAILED/SKIPPED), provider, approvedAt, sentAt`. **Round is encoded inside `template`** (`bulk_acceptance_r2`). |
| `Target` | Wishlist orgs (`status`, `matchConfidence`, about 12 sheet columns). 1:N applications. |
| `Setting` | `key` PK, `value` JSON string. Holds: `delta_settings` (email templates, flags), `fieldVisibility`, `upload:JURY_GUIDELINES` (**a PDF as base64 inside the row**). |
| `Job` | `type, payload JSON, status, error, attempts, startedAt, finishedAt`, `@@index([status, createdAt])`. No FK to Application. |

Semicolon-joined multi-selects: `valueChainFocus, beneficiaries, primaryCrops, regenerativePractices, techTools, statesOperating, heardAboutChallenge, operatingModelArchetype` (also `Bench.panelJurorNames`). Written with `.join(';')` in the sync and apply action; read with ad hoc `split(';')`/`contains` in about 6 places. There is **no single helper**.

String "enums" and where their lists live (`src/lib/constants.ts` unless noted): UserRole, OrgType, NormalizedStage, SolutionCategory, Source, StageStatus, Disposition, Recommendation, JuryVerdict, TargetStatus, OutboxStatus, RoundDecision (`YES/NO/UNDER_REVIEW`), CurrentRound (`ROUND_1/2/3/SELECTED`), YesNoInProgress, LegalRegistrationType, BudgetBand, OperatingModel, Crop, RegenPractice, TechTool, MEL, Indian states. Job types live in `jobs/queue.ts`. Template names are free strings parsed by regex in `mail/rounds.ts`. **Nothing validates DB values against these lists**: they are TS types only.

Cascade summary: deleting an `Application` removes all children above. Deleting a `User` fails with `P2003` if they have reviews, scores, notes, comments or assignments. The app catches this and shows a friendly message.

---------------------------------------------------------------------------------------------------

## C. Request flows (end to end)

Notation: **UI** → **guard** → **query/mutation** → **revalidate**.

1. **Login and session.** `LoginForm` → `loginAction` (server action): lowercases email, `findUnique({username})`, `verifyPassword` (scrypt, timing-safe) → sets cookie `delta_session = userId.HMAC(userId)`, httpOnly, lax, 30 days → redirect `/applications` for JURY else `/dashboard`. Every request: middleware verifies HMAC only (no DB). `getCurrentUser()` verifies again and loads the user (cached per render). Logout deletes the cookie. **The token has no expiry claim and no server-side revocation**: a signed cookie is valid forever; `maxAge` is the only limit. The default secret falls back to a hard-coded string if `AUTH_SECRET` is unset.

2. **Applications list and filters.** `applications/page.tsx` (server) branches on role: JURY → `listJuryApplications`; OBSERVER → `listApplications` with observer row/filters; ADMIN/REVIEWER → full table. `ApplicationFilters` (client) writes URL searchParams (comma-separated multi-selects). `buildApplicationWhere` = `visibleApplicationWhere(user)` + `isDuplicateOf:null` + filters (name, round decision, ecosystem flag, `currentRound in`, bench, reviewer, registration type, operating model/state via `contains`). Eligibility filter is applied **in memory** after the query. Sort by score / round 2 score / round is also in memory after fetch. Query uses `relationLoadStrategy:'join'` (one SQL). `LiveRefreshTicker` calls `router.refresh()` every 20s. Row = real `<Link>`, hover prefetch. Side effect: the page enqueues missing synopses for every YES row (`ensureOrgSynopsisQueued`) **inside the render**.

3. **Application detail.** `applications/[id]/page.tsx`: parallel `getApplicationDetail` (everything included, joins), `getAdjacentApplications` (re-runs the whole filtered list just to find prev/next), `listUsers`, `getFieldVisibility`. Eligibility is computed from stored fields. Layout: `ApplicationMainContent` (server, renders sections in role-specific order and drops fields that the visibility map hides for jury/observer) + a right rail that depends on role (jury: `JurySidePanel`; staff: status bar, round decision cards, consortium flags, notes, comments, outreach history, deck). `ApplicationTimeline` is derived purely from the three decision columns + `currentRound`. `ApplicationPagerKeys` adds ←/→ shortcuts. PDF download is client-side (html2canvas + jsPDF) excluding `data-pdf-exclude` blocks.
   **Important: `getApplicationDetail(id)` has no `visibleApplicationWhere` clause.** The page never calls the scoped helper, so a juror who guesses an id can open any application. Field-level hiding is applied at render time, but the full row is loaded. See F.

4. **Round decision.** `RoundDecisionButtons` (client) → `setRoundDecisionAction(round, formData)`: `assertRole(CAN_REVIEW)`, `canManageApplication` (ADMIN, or assigned REVIEWER), checks round 2 requires round 1 = YES and round 3 requires round 2 = YES, writes `roundNDecision` (or null for CLEAR), on YES auto-advances `currentRound` only forward, `notifyTeam` on advance, enqueues `SYNOPSIZE_APPLICATION` on first round-1 YES, revalidates 5 paths. `setCurrentRoundAction` is a manual override with no rules. **Clearing or changing an earlier round does not invalidate later rounds.**

5. **Reviewer assignment.** Two paths. (a) Auto: `autoAssignReviewer` (called from the public apply action and the Supabase sync): if no assignment exists, picks `rotation[totalAssignmentsInDb % rotation.length]` from a **hard-coded email allow-list**. (b) Manual: admin `ReviewerAssignmentPanel` → `setApplicationReviewersAction` (delete + createMany in a transaction). Bulk: `reassignAllInRotationOrderAction` wipes and rebuilds all assignments; `reassignReviewerAction` moves one person's assignments and reviews to another account.

6. **AI scoring via the job queue.** Enqueue sites: apply action, ingest webhook, sync (create only), settings "score all" (limit 200). `enqueueJob` inserts a `Job(PENDING)`. `JobQueueTicker` (mounted for every signed-in user, in `AppShell`) POSTs `/api/jobs/tick` every 3.5s with an in-flight guard. `processPendingJobs(3)`: reclaim jobs stuck `RUNNING` for more than 3 min (back to PENDING, or FAILED after 3 attempts), `findMany(PENDING)`, claim each with `updateMany where status=PENDING` (optimistic CAS), run, mark DONE/FAILED. `scoreApplication`: resolve provider (`SCORING_PROVIDER` or first key present: groq, anthropic, gemini, else heuristic), build prompt from the rubric, one JSON retry, Groq has 429 backoff and Gemini fallback, **server recomputes composite from per-criterion scores** (never trusts the model's), inserts a new `AiEvaluation` row with a rubric snapshot. If `router.refresh()` sees `ran>0` the page updates.

7. **Supabase sync.** `SupabaseSyncTicker` (global, every 2 min, every open tab) and the settings button both call `syncApplicationsFromSupabase`. Uses a read-only anon-key client on an **external** `applications` table; explicit column list; incremental watermark `max(sourceUpdatedAt)` then `gte(updated_at)`; one batch lookup of existing ids; skips unchanged and rows missing org name/email; maps ~50 columns defensively (HTML-wrapped URLs, arrays → `;` strings, yes/no normalisation); update replaces child rows wholesale (delete + create); create also seeds a `StageTransition`, enqueues ENRICH/MATCH/SCORE and auto-assigns a reviewer. Per-row awaited writes, no transaction.

8. **Jury scoring.** Jury visibility = `round1Decision='YES'` AND `bench.jurors some user` (via `visibleApplicationWhere`). `JurySidePanel`/`JuryScoringForm` (client) → `submitJuryScoreAction`: `assertRole(CAN_JURY_SCORE)` (ADMIN too), **does not check the application is on the juror's bench**, rejects blank criteria, caps each criterion at `maxScore`, `upsert` on `(applicationId, jurorId)`, verdict YES/NO, comment only kept if YES. `clearJuryScoreAction` deletes own score. Staff view: `/applications/round-2` uses `listJuryOversight` (all benches, in-memory bucket filters/sorts), one `jN` column per seat on the largest bench, avg, `JuryConsensusBadge` (all YES = green, all NO = red, split = yellow, none = neutral), and an export of one row per juror.

9. **Bulk outreach.** `OutreachApplicationsTable` (client) → `bulkSendOutreachAction(formData)`: ADMIN only. For each application: pick round (`auto` = latest round with a decision, else forced), `template = bulk_<kind>[_r2|_r3]`, if a SENT row exists for that template **skip** (the per-round dedupe), else reuse or create the row, re-render subject/body fresh, `approveAndSendOutboxEmail` (mark APPROVED, `mailer.send` with a hard-coded CC list, update status/provider/sentAt), on success `notifyTeam`. Stage-transition mails (`enqueueStageEmail`) are a second legacy path. Mailer = stub (refuses to fake a send when `VERCEL_ENV=production`), resend (needs a test-override address), gmail SMTP (only a fixed sender allowed). `OutboxTable` polls `/api/outbox` itself because `router.refresh()` was unreliable.

10. **Notifications.** (a) `postCommentAction` → `notifyMentionedUsers`: loads all users, builds a regex per name, `@Full Name` match, skips author, `createMany`. (b) `notifyTeam` after round moves and sent mails: every ADMIN/REVIEWER except the actor; failures are swallowed. `NotificationBell` (client, in the sticky header) polls `GET /api/notifications` every 30s; click → `markNotificationReadAction` and navigate; "mark all" clears.

11. **Deck upload.** Settings `DeckUploadPanel` (client): loads candidates via admin server action, fuzzy-matches filenames to org names (`slugify`, `fastest-levenshtein`), user confirms, the browser uploads **directly to Vercel Blob** using a short-lived token from `POST /api/deck-upload` (admin-gated, PDF only, 25 MB, random suffix), then `setDeckUrlAction(applicationId, url)` stores the URL and revalidates 4 paths. Avoids the 4.5 MB function body limit.

12. **Field-visibility settings.** `settings/view` → `FieldVisibilityManager` → `updateFieldVisibilityAction` (ADMIN): checkbox per field per role (`observer_<key>`, `jury_<key>`) + section order. Stored as one JSON `Setting`. `getFieldVisibility` merges stored with registry defaults and reconciles order. Consumed only by `ApplicationMainContent` via `isShown(key)`. It is **presentation filtering, not authorization**.

13. **CSV export.** `ExportCsvButton` builds `/api/applications/export?...&fields=a,b,c`. Route: loads via `listApplications(..., user, true)` (with relations; scoped by the user's role), picks columns from `EXPORT_COLUMNS` (core on by default, ~78 opt-in), explicit getters + `genericCell` fallback, hand-rolled CSV quoting. The round-2 export route has **no auth check at all** and exports every jury score. The main export route has no role check beyond the where-clause (an anonymous caller gets `{id:'none'}`, so empty).

---------------------------------------------------------------------------------------------------

## D. Cross-cutting rules

- **Role guards.** `assertRole(user, allowed[])` throws `ForbiddenError`. Lists: `CAN_REVIEW` (ADMIN, REVIEWER), `CAN_JURY_SCORE` (ADMIN, JURY), `CAN_MANAGE_SETTINGS` and `CAN_SEND_MAIL` (ADMIN). `canManageApplication` = ADMIN or assigned REVIEWER. Server actions each call these by hand; pages hide controls by role.
- **Scoped where.** `visibleApplicationWhere(user)`: no user → `{id:'none'}`; JURY → `{round1Decision:'YES', bench:{jurors:{some:{id}}}}`; everyone else → `{}`. Used by `buildApplicationWhere` and `listJuryApplications` only. **Not used by** detail, round-2 pages, outreach, exports, review queue, dashboard.
- **Round state machine.** Real model = three independent decision columns + `currentRound`; gating (2 needs 1, 3 needs 2) in the server action; auto-forward only. The older 9-state `stageStatus` machine (`rules.ts`, `machine.ts`) is retired in docs but **still drives "reviewed"** (`UNDER_REVIEW` = reviewed), the dashboard funnel, divergence list, public `/status` page and analytics funnel.
- **Job-queue claiming.** Optimistic claim by `updateMany(status=PENDING)`, `attempts++`, stale `RUNNING` reclaim at 3 min, max 3 attempts. Separate status columns on `Application` for synopsis/validation have **no staleness recovery of their own** (the reference removed a guard for that reason).
- **Caching and revalidation.** All pages dynamic (cookies). Mutations call `revalidatePath` on a hand-written list; list drifts easily (round-2 and round-3 and dashboard have to be remembered each time). Freshness is mostly polling: `LiveRefreshTicker` (8–20s), job ticker, sync ticker, bell, outbox.
- **Settings.** One JSON object in `Setting('delta_settings')`, merged over code defaults on every read (no schema validation). Default email text contains real programme figures and sender names.
- **Design system + lint.** `npm run lint` = `oxlint` (the custom `no-restricted-syntax` selectors are **silently ignored by the pinned version**) + `scripts/check-adherence.mjs` (line-regex over `src/`: raw hex, raw `NNpx` in strings, off-brand `fontFamily`; mail templates exempt) + `tsc --noEmit`. Brand rules (lowercase copy, no em dashes, no radius) are by convention only. Tokens are CSS variables; dark mode = `:root[data-theme='dark']` re-pointing semantic tokens, stored in `localStorage`, applied by a pre-paint script **only on internal paths**, and printing forced light.
- **Layout.** Sticky header (z-index token), `AppShell` client component runs three global pollers.

---------------------------------------------------------------------------------------------------

## E. Feature inventory

| Feature | Main files | Data | Roles | Gotchas |
|---|---|---|---|---|
| Login / session | `auth/*`, `middleware.ts`, `LoginForm` | User | all | No expiry in token; `/api/*` unprotected by middleware |
| Applications list + filters | `applications/page`, `queries`, `ApplicationFilters` | Application + joins | ADMIN, REVIEWER, OBSERVER full; JURY trimmed | In-memory sort/eligibility; hidden side effect enqueues synopses |
| Detail record | `[id]/page`, `ApplicationMainContent` | everything | all (field-filtered) | No scope check on id; adjacent query loads whole list |
| Round decisions + status bar | `actions.ts`, `RoundDecisionButtons`, `ApplicationStatusBar` | round1-3, currentRound | ADMIN, assigned REVIEWER | Later rounds not invalidated; manual override unrestricted |
| Timeline | `ApplicationTimeline` | decisions | not JURY | Derived, no history, no actor, no time |
| Eligibility screen | `scoring/eligibility` | registration fields | staff | Hard-coded legal types and certificates |
| AI scoring | `scoring/runner,prompt,heuristic,rubric` | AiEvaluation | queue / REVIEWER+ | Silent heuristic fallback; multiple evaluation rows |
| Human review | `ReviewScoringForm`, `submitHumanReviewAction` | HumanReview | ADMIN, assigned REVIEWER | "list score" = latest review, export = average (inconsistent) |
| Reviewer rotation | `assignment.ts` | ReviewAssignment | system, ADMIN | Allow-list of emails, `count % n` rotation (race-prone, shifts on deletions) |
| Job queue | `jobs/queue`, `JobQueueTicker`, `/api/jobs/tick` | Job | any signed-in tab | Unauthenticated endpoint; work done only while a tab is open |
| Supabase sync | `supabase-source`, `SupabaseSyncTicker` | Application + children | any tab / ADMIN | Unauthenticated tick endpoint; per-row writes |
| Public apply / status | `(public)/*`, `apply-action` | Application | public | No validation lib, no rate limit/captcha; status page returns stage by id |
| Jury benches | `benches/*`, `BenchManager` | Bench, User | ADMIN | M:N implicit table |
| Jury scoring | `jury-actions`, `JuryScoringForm`, `juryRubric` | JuryScore | JURY (+ADMIN) | No bench check on write; rubric keys manually versioned |
| Jury oversight + consensus | `round-2/*`, `JuryScoreCard`, `juryConsensus` | JuryScore | ADMIN, REVIEWER | Seat columns `j1..jN` = alphabetical order, not stable identity |
| Round 3 tracking | `round-3/page`, `Round3Row` | decisions | staff | No scoring or visit data at all |
| Outreach | `mail/*`, `OutreachApplicationsTable`, `OutboxTable` | OutboxEmail, Setting | ADMIN send; REVIEWER view | Round encoded in template name; HTML not escaped in templates |
| Comments, notes, notifications | `CommentThread`, `PersonalNotes`, `notifications/*` | Comment, Note, Notification | any signed-in | Mentions matched by exact full name; polling |
| Synopsis | `synopsis/*` | Application cols | queue / ADMIN | Sanitizer is regex-based; no staleness recovery |
| Org validation (3 LLM checks) | `validation/*`, `/api/validate-org` | Application cols | REVIEWER+ | Heavy; ~40 columns on Application |
| Enrichment + wishlist match | `enrichment/*`, `matching/*`, `targets/*` | Target | system | Out of scope for the clone |
| Field visibility | `visibility/*`, `FieldVisibilityManager` | Setting | ADMIN | Render-time only |
| Deck upload | `DeckUploadPanel`, `/api/deck-upload` | Application.deckUrl | ADMIN | Needs Blob token; no local fallback |
| CSV export | `exportColumns`, `/api/applications/export` | joins | staff | Round-2 export unauthenticated |
| Dashboard / analytics | `dashboard/*`, `analytics/*`, `PieChart`, `IndiaStatesMap` | aggregates | ADMIN, REVIEWER, OBSERVER | Multiple full-table `findMany` per render |
| Settings | team CRUD, sync, automation, reset, theme | Setting, User | ADMIN | `resetPlatform` deletes everything (password-gated) |
| Theme toggle | `theme.ts`, `ThemeToggle` | localStorage | internal | Print forced light |

---------------------------------------------------------------------------------------------------

## F. Ambiguities, dead code and mistakes (do not copy)

Security and correctness:
1. `/api/*` is excluded from middleware and several routes have **no auth**: `/api/jobs/tick`, `/api/sync/tick`, `/api/applications/round-2/export` (leaks all jury scores and comments).
2. `getApplicationDetail` and the round-2 detail/export/review/outreach queries ignore `visibleApplicationWhere`. A juror can read any application by id; the "hide fields" feature is cosmetic.
3. `submitJuryScoreAction` never verifies the application is on the juror's bench or is round-1 YES; ADMIN is also in `CAN_JURY_SCORE`.
4. Session token has no expiry, no rotation, no revocation, and falls back to a default secret.
5. Email templates interpolate applicant text (`orgName`) into HTML **unescaped**.
6. A PDF is stored base64 in a `Setting` row; server-action body limit raised instead of using direct upload for it.
7. Hard-coded real CC addresses, a required sender mailbox, and a fixed recipient allow-list in code. Default templates contain real programme numbers, names and dates.
8. Public apply: no rate limiting, validation or captcha; public `/status` takes an id.

Design flaws:
9. The round is **in the template string**; dedupe works only by accident of naming.
10. Rounds are hard-coded columns (3 decisions + 4-value `currentRound`); changing the number of rounds touches ~20 files. Gating is only in an action.
11. `stageStatus` is "retired" but still defines "reviewed", the funnel, and `/status`; `StageTransition` is written once at creation and never again.
12. Round-robin uses a global assignment count, so deleting rows or manual assignment skews rotation. Doc says auto-assign was removed; code still calls it in two places.
13. "reviewed" ignores whether a review exists (comment in `reviewStatus.ts` contradicts `CLAUDE.md`).
14. Score shown in list (latest review) differs from export and dashboard (average).
15. Side effects in page render (`ensureOrgSynopsisQueued`), in-memory filtering/sorting of whole tables, three global pollers per tab, adjacent-id query loading the whole filtered list.
16. Enums are unvalidated strings; multi-select parsing duplicated.
17. Status columns on `Application` (synopsis, 3 validations) with no stale recovery; about 40 columns of derived state on the main table.
18. oxlint custom rules are a no-op; "brand law" is a regex scan only; `radius-*` tokens still exist.

Dead or legacy: `google-form-source`, `zoho-crm-source`, `seed-source`, `prisma/seed.ts` (xlsx importer), `enqueueRejectionEmail` and `renderRejectionEmail` aliases, strong/encouraged rejection templates, `stageStatus`/Kanban remnants, `moveApplicationStageAction`, `/api/ingest` and `/api/tally/webhook` (env-secret webhooks nobody calls locally), `scripts/*` one-offs, AgWater legacy columns (`waterEfficiency*`, `cropProductionFocus`, `focusCrops`, TRL), `historicallyShortlisted`.

Ambiguities to confirm with you are in the Phase 1 questions that accompany this document.

---------------------------------------------------------------------------------------------------

## G. What this implies for the clone (input to Phase 2, not a design yet)

You said the new tool has **two views only** (admin sees everything; jury view is what gets sent to jurors) and **one bench**. That removes: REVIEWER/OBSERVER roles, benches and bench assignment, bench filters, `/applications/round-2` multi-bench logic, per-bench seat columns, and most of the role matrix. Open points about reviewers and rounds are in the questions.
