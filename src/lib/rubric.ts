import { JURY_RAW_MAX } from './constants';

/** The jury evaluation rubric. Each juror scores every criterion out of SCORE_MAX; that score is
 *  scaled to the criterion's weightage, so a juror's six scores add up to a total out of 100:
 *    weighted points = (score / SCORE_MAX) x weightage
 *  The average of the jurors' totals is then scaled to the jury's 40% share of the final score
 *  (see src/lib/scoring.ts). */
export const SCORE_MIN = 1;
export const SCORE_MAX = 10;
export const SCORE_STEP = 0.5;

export interface Parameter {
  key: string;
  label: string;
  /** weightage in points; all six add up to JURY_RAW_MAX (100) */
  weight: number;
  /** what the jury is assessing; the M&E findings already cover what has been done, so use these
   *  to build on that evidence rather than re-verify it */
  components: string[];
  /** suggested lines of questioning on scalability and punt-ability: prompts, not a script */
  lens: string[];
}

export const PARAMETERS: Parameter[] = [
  {
    key: 'tg',
    label: 'is the model focused on the TG we intend to work with?',
    weight: 7.5,
    components: [
      'Is the solution reaching home-based foodpreneurs with an annual revenue of roughly ₹1–6 lakh, OR collectives of women food processors/producers with a revenue of ₹10–30 lakh a year?',
    ],
    lens: [
      'As the model grows, will it stay with this segment, or drift towards larger, easier-to-serve businesses?',
      'How deeply does the team understand the constraints of this TG (time, working capital, mobility, household responsibilities)?',
    ],
  },
  {
    key: 'markets',
    label: 'is the model focused on unlocking new markets for foodpreneurs?',
    weight: 7.5,
    components: [
      'How many new market channels have been unlocked?',
      'How much revenue has been generated through each channel?',
      'How much focus is on improving the quality of products sold by foodpreneurs (taste, packaging, standardisation, variety, branding, etc.)?',
    ],
    lens: [
      'Which of these channels can absorb many more foodpreneurs, and which are one-off or relationship-dependent?',
      'Is the quality-improvement work set up so it can be repeated with every new cohort?',
    ],
  },
  {
    key: 'viability',
    label: 'is the model economically viable?',
    weight: 25,
    components: [
      'How well thought out is the revenue model for the solution? Is it grant-funded or revenue-funded? What is the level of clarity on the model?',
      'What is the cost the organisation is incurring to provide the solution to each foodpreneur? Consider EDP-related costs, the cost to build the application/solution, team and resource costs, and the operational cost of providing access to different markets.',
    ],
    lens: [
      'Do the unit economics get better or worse as the model scales?',
      'What is the path to reducing grant dependence, and over what timeframe?',
      'Does the team know its numbers without reaching for a slide?',
    ],
  },
  {
    key: 'innovation',
    label: 'is the solution innovative?',
    weight: 15,
    components: [
      'Tech solution: is the tech solution provided innovative? (app, system, other technology used to deliver the solution)',
      'Business innovation: is this a business innovation? (new ways to go to market, new ways of doing sales, new approaches to customer acquisition)',
      'Innovative partnerships: have they used partnerships and networks intelligently?',
    ],
    lens: [
      'Is the innovation a lasting advantage, or something others could copy quickly?',
      'Is the technology proportionate to the TG, i.e. usable by a home-based foodpreneur without hand-holding?',
    ],
  },
  {
    key: 'replicable',
    label: 'is the solution replicable?',
    weight: 25,
    components: [
      'What is their strategy for replicating the solution across geographies and markets? How robust is the plan? Is there movement on it?',
      'How easy or difficult is it to add a new user/programme participant to the existing solution?',
    ],
    lens: [
      'What breaks first at 10x the number of foodpreneurs, or in a new state?',
      'Which parts of the model are portable, and which depend on a specific place, partner or person?',
      'What does it cost, in time and money, to onboard one more foodpreneur?',
    ],
  },
  {
    key: 'team',
    label: 'is the model backed by the founding team and supported by requisite org depth?',
    weight: 20,
    components: [
      'How involved is the founding team in addressing the core problem of the challenge?',
      "How aligned are the challenge's goals with the organisation's overall vision and strategy?",
      'Are enough resources (people and capital) being allocated to functional areas (field team), R&D (food tech, labs, etc.) and business management?',
    ],
    lens: [
      'Would we bet on these people? Do they own this problem beyond the life of the challenge?',
      'Is there leadership depth beyond the founder, and who would carry the work if they stepped back?',
      'How do they respond to hard questions: with candour about what has not worked, or with defensiveness?',
    ],
  },
];

if (PARAMETERS.reduce((s, p) => s + p.weight, 0) !== JURY_RAW_MAX) {
  throw new Error('rubric weightages must sum to JURY_RAW_MAX');
}

/** How a score out of 10 reads, from the rubric. */
export const SCORE_SCALE: { range: string; name: string; meaning: string }[] = [
  { range: '9-10', name: 'exceptional', meaning: 'Specific, compelling and well reasoned. We would back this with confidence.' },
  { range: '7-8', name: 'strong', meaning: 'Clear and credible, with minor gaps.' },
  { range: '5-6', name: 'adequate', meaning: 'Plausible, but generic or largely untested.' },
  { range: '3-4', name: 'weak', meaning: 'Significant gaps; answers are vague or inconsistent.' },
  { range: '1-2', name: 'insufficient', meaning: 'No credible answer, or misaligned with the challenge.' },
];

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Points a score earns on one criterion, e.g. 8 on a 25-point criterion is 20. */
export function weightedPoints(p: Parameter, score: number): number {
  return round1((score / SCORE_MAX) * p.weight);
}

/** A juror's total out of 100 from their raw scores (out of 10), keyed by criterion. */
export function computeTotal(scores: Record<string, number>): number {
  return round1(PARAMETERS.reduce((sum, p) => sum + ((scores[p.key] ?? 0) / SCORE_MAX) * p.weight, 0));
}

/** One saved criterion: `score` is the juror's raw score out of 10. */
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
