import { ECOCIATE_MAX, JURY_MAX, JURY_RAW_MAX } from './constants';

const round1 = (n: number) => Math.round(n * 10) / 10;

export interface Snapshot {
  ecociate: number | null; // out of 60
  juryAvgRaw: number | null; // out of 100, mean of the submitted juror totals
  juryAvg: number | null; // out of 40, that mean scaled down: this is the part that goes into the final
  juryCount: number;
  final: number | null; // out of 100, null until both parts exist
}

/** The one place the final score is computed. Jurors score out of 100; their average is scaled to 40
 *  and added to the ecociate score (out of 60). A missing part shows as null rather than being
 *  treated as zero. */
export function snapshot(ecociate: number | null, juryTotals: number[]): Snapshot {
  const e = ecociate === null ? null : Math.min(Math.max(ecociate, 0), ECOCIATE_MAX);
  const raw = juryTotals.length ? juryTotals.reduce((a, b) => a + b, 0) / juryTotals.length : null;
  const scaled = raw === null ? null : (raw * JURY_MAX) / JURY_RAW_MAX;
  return {
    ecociate: e === null ? null : round1(e),
    juryAvgRaw: raw === null ? null : round1(raw),
    juryAvg: scaled === null ? null : round1(scaled),
    juryCount: juryTotals.length,
    final: e !== null && scaled !== null ? round1(e + scaled) : null,
  };
}

/** One juror's weighted total (stored out of 100) shown on the jury scale, out of 40. */
export const toJuryScale = (raw: number) => round1((raw * JURY_MAX) / JURY_RAW_MAX);

export const fmt = (n: number | null, dash = '-') => (n === null ? dash : String(n));
