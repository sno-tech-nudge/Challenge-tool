// Interview slots: when a juror may score an organisation. Shown in India time.
//
//   no slot set   scoring is open, as before
//   before start  scoring is blocked (the organisation can still be read)
//   from start    scoring is open, and stays open after the slot ends
//
// A submitted review is changed by pressing "rescore" and submitting again, at any time once scoring
// has opened (including after the slot has ended). The admin is told every time that happens.

export type SlotPhase = 'none' | 'before' | 'open' | 'ended';

const TZ = 'Asia/Kolkata';
const day = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: 'numeric', month: 'short' });
const time = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false });
const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: TZ });

export function slotPhase(start: Date | null, end: Date | null, now: Date): SlotPhase {
  if (!start) return 'none';
  if (now < start) return 'before';
  if (end && now > end) return 'ended';
  return 'open';
}

/** Whether a juror may submit (or rescore) right now: only once the slot has opened. */
export function reviewAccess(phase: SlotPhase): { canSubmit: boolean; why?: 'before' } {
  if (phase === 'before') return { canSubmit: false, why: 'before' };
  return { canSubmit: true };
}

/** "27 Oct, 10:00 to 10:45 IST" (or with both dates when the slot crosses midnight). */
export function formatSlot(start: Date, end: Date | null): string {
  if (!end) return `${day.format(start)}, ${time.format(start)} IST`;
  if (dayKey.format(start) === dayKey.format(end)) return `${day.format(start)}, ${time.format(start)} to ${time.format(end)} IST`;
  return `${day.format(start)}, ${time.format(start)} to ${day.format(end)}, ${time.format(end)} IST`;
}

/** "27 Oct, 10:45 IST" */
export function formatMoment(d: Date): string {
  return `${day.format(d)}, ${time.format(d)} IST`;
}

/** What to show as an organisation's slot: the real times when set, otherwise the free text. */
export function slotLabel(o: { slot: string | null; slotStart: Date | null; slotEnd: Date | null }): string | null {
  return o.slotStart ? formatSlot(o.slotStart, o.slotEnd) : o.slot;
}

/** Jurors' order: by slot start (earliest first, no slot last), then by name. */
export function compareBySlot(a: { name: string; slotStart: Date | null }, b: { name: string; slotStart: Date | null }): number {
  if (a.slotStart && b.slotStart) {
    const d = a.slotStart.getTime() - b.slotStart.getTime();
    if (d !== 0) return d;
  } else if (a.slotStart || b.slotStart) {
    return a.slotStart ? -1 : 1;
  }
  return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
}
