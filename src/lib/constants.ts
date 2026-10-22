export const ROLES = ['ADMIN', 'JURY'] as const;
export type Role = (typeof ROLES)[number];

export const VERDICTS = ['Y', 'N'] as const;
export type Verdict = (typeof VERDICTS)[number];

export const SESSION_COOKIE = 'aahaar_session';
export const SESSION_SECONDS = 60 * 60 * 12; // 12 hours, then log in again

// final score = ecociate (out of 60) + jury (out of 40). Each juror scores out of JURY_RAW_MAX (100);
// the average of their totals is scaled down to JURY_MAX (40) before it is added to the ecociate score.
export const ECOCIATE_MAX = 60;
export const JURY_MAX = 40; // what the jury counts for in the final score
export const JURY_RAW_MAX = 100; // what a single juror scores out of
export const EXPECTED_JURORS = 4;
