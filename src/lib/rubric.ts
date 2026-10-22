import { JURY_RAW_MAX } from './constants';

export interface Parameter {
  key: string;
  label: string;
  max: number;
  hint: string;
}

// PLACEHOLDER rubric: 7 parameters summing to 100. Replace labels/weights with the real ones.
export const PARAMETERS: Parameter[] = [
  { key: 'p1', label: 'clarity of purpose', max: 15, hint: 'is the mission and the problem stated clearly?' },
  { key: 'p2', label: 'progress since baseline', max: 15, hint: 'what has moved since the last checkpoint?' },
  { key: 'p3', label: 'evidence of outcomes', max: 15, hint: 'are results measured and believable?' },
  { key: 'p4', label: 'team and execution', max: 15, hint: 'can this team deliver what it plans?' },
  { key: 'p5', label: 'financial health', max: 10, hint: 'runway, funding mix, discipline' },
  { key: 'p6', label: 'partnerships', max: 10, hint: 'quality and depth of partners' },
  { key: 'p7', label: 'outlook for next phase', max: 20, hint: 'is the next phase credible and ambitious enough?' },
];

if (PARAMETERS.reduce((s, p) => s + p.max, 0) !== JURY_RAW_MAX) {
  throw new Error('rubric maxima must sum to JURY_RAW_MAX');
}

export interface ScoreEntry {
  key: string;
  score: number;
  remarks: string;
}

/** Parses one stored JuryScore.entries value; anything malformed becomes an empty list. */
export function parseEntries(json: string): ScoreEntry[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
