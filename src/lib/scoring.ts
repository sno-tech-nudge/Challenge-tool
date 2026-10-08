import { ECOCIATE_MAX } from './constants';

const round1 = (n: number) => Math.round(n * 10) / 10;

export interface Snapshot {
  ecociate: number | null; // out of 60
  juryAvg: number | null; // out of 40, mean of submitted jury totals
  juryCount: number;
  final: number | null; // out of 100, null until both parts exist
}

/** The one place the final score is computed. Final needs both parts; a missing part shows as null
 *  rather than silently treating it as zero. */
export function snapshot(ecociate: number | null, juryTotals: number[]): Snapshot {
  const e = ecociate === null ? null : Math.min(Math.max(ecociate, 0), ECOCIATE_MAX);
  const juryAvg = juryTotals.length ? juryTotals.reduce((a, b) => a + b, 0) / juryTotals.length : null;
  return {
    ecociate: e === null ? null : round1(e),
    juryAvg: juryAvg === null ? null : round1(juryAvg),
    juryCount: juryTotals.length,
    final: e !== null && juryAvg !== null ? round1(e + juryAvg) : null,
  };
}

export const fmt = (n: number | null, dash = '—') => (n === null ? dash : String(n));
