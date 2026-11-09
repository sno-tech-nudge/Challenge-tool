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

/** Final score out of 100 when the ecociate score counts for `ecociatePct` percent and the jury for the rest.
 *  Both parts are first put on a scale of 100 (the ecociate score is stored out of 60, a juror's total out of 100).
 *  60 / 40 gives the same number as the final score everywhere else. Null until both parts exist. */
export function finalAtWeight(ecociate: number | null, juryAvg100: number | null, ecociatePct: number): number | null {
  if (ecociate === null || juryAvg100 === null) return null;
  const e100 = (Math.min(Math.max(ecociate, 0), ECOCIATE_MAX) / ECOCIATE_MAX) * 100;
  const w = Math.min(Math.max(ecociatePct, 0), 100) / 100;
  return round1(w * e100 + (1 - w) * juryAvg100);
}

/** The ecociate score on a scale of 100, for showing next to the juror scores. */
export const ecociateOn100 = (ecociate: number | null) => (ecociate === null ? null : round1((ecociate / ECOCIATE_MAX) * 100));
