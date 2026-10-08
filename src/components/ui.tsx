import React from 'react';

/** Page header with the angled corner cuts. Server-safe (no hooks). */
export function PageBanner({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <section className="banner">
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

/** Horizontal score bar; colour follows the share of the maximum (>=70% green, >=50% amber). */
export function ScoreBar({ value, max }: { value: number | null; max: number }) {
  if (value === null) return <span className="muted">-</span>;
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const tone = pct >= 70 ? '' : pct >= 50 ? 'warn' : 'bad';
  return (
    <div className={`bar ${tone}`} role="img" aria-label={`${value} out of ${max}`}>
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
