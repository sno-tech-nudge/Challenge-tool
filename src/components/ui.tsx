import React from 'react';

/** Page header with the angled corner cuts. Server-safe (no hooks). */
export function PageBanner({
  eyebrow,
  title,
  subtitle,
  actions,
  compact,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <section className={`banner${compact ? ' compact' : ''}`}>
      <div className="banner-inner">
        <div style={{ minWidth: 0 }}>
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          <h1>{title}</h1>
          {subtitle && <p className="sub">{subtitle}</p>}
        </div>
        {actions && <div className="banner-actions">{actions}</div>}
      </div>
    </section>
  );
}

export function Pill({ tone, children }: { tone?: 'good' | 'bad' | 'warn' | 'solid'; children: React.ReactNode }) {
  return <span className={`pill${tone ? ` ${tone}` : ''}`}>{children}</span>;
}

export type ScoreTone = 'good' | 'mid' | 'bad';

/** The one place the score colours are decided, as a share of the maximum: 71% and above green
 *  (for the final score out of 100 that is 71 and above), 50 to below 71 yellow, below 50 red. */
export function scoreTone(value: number, max: number): ScoreTone {
  const pct = (value / max) * 100;
  return pct >= 71 ? 'good' : pct >= 50 ? 'mid' : 'bad';
}

/** Horizontal score bar coloured by scoreTone. */
export function ScoreBar({ value, max }: { value: number | null; max: number }) {
  if (value === null) return <span className="muted">-</span>;
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const tone = scoreTone(value, max);
  return (
    <div className={`bar ${tone === 'good' ? '' : tone}`} role="img" aria-label={`${value} out of ${max}`}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Kpi({ label, value, note }: { label: string; value: React.ReactNode; note?: React.ReactNode }) {
  return (
    <div className="kpi">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {note && <div className="note">{note}</div>}
    </div>
  );
}
