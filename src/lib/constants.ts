export const ROLES = ['ADMIN', 'JURY'] as const;
export type Role = (typeof ROLES)[number];

export const VERDICTS = ['Y', 'N'] as const;
export type Verdict = (typeof VERDICTS)[number];

export const SESSION_COOKIE = 'midline_session';
export const SESSION_SECONDS = 60 * 60 * 12; // 12 hours, then log in again

// final score = ecociate (out of 60) + average jury total (out of 40)
export const ECOCIATE_MAX = 60;
export const JURY_MAX = 40;
export const EXPECTED_JURORS = 4;
