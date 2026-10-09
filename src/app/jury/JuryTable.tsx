'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ChevronRight } from 'lucide-react';
import { JURY_MAX } from '@/lib/constants';
import { Pill, ScoreBar } from '@/components/ui';

interface Row {
  id: string;
  name: string;
  slot: string | null;
  sector: string | null;
  myTotal: number | null;
}

type Filter = 'all' | 'todo' | 'done';

export function JuryTable({ orgs, done }: { orgs: Row[]; done: number }) {
  const router = useRouter();
  const [q, setQ] = React.useState('');
  const [filter, setFilter] = React.useState<Filter>('all');
  // shows "opening..." on the row straight away, so a slow page load never looks like the click was missed
  const [opening, setOpening] = React.useState<string | null>(null);

  const rows = orgs.filter((o) => {
    if (filter === 'todo' && o.myTotal !== null) return false;
    if (filter === 'done' && o.myTotal === null) return false;
    return !q || o.name.toLowerCase().includes(q.toLowerCase());
  });
  const pct = orgs.length ? Math.round((done / orgs.length) * 100) : 0;

  return (
    <>
      <div className="card accent" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="row" style={{ marginBottom: 'var(--space-2)' }}>
          <strong>your progress</strong>
          <span className="small muted">{done} of {orgs.length} organisations scored ({pct}%)</span>
        </div>
        <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="your review progress">
          <span style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="toolbar">
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 360 }}>
          <Search size={14} aria-hidden="true" style={{ position: 'absolute', left: 10, top: 12, color: 'var(--text-muted)' }} />
          <input type="search" placeholder="search organisation" aria-label="search organisations" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: '100%', paddingLeft: 32 }} />
        </div>
        <div className="chips" role="group" aria-label="filter by status">
          {([['all', 'all'], ['todo', 'to do'], ['done', 'scored']] as [Filter, string][]).map(([v, label]) => (
            <button key={v} type="button" aria-pressed={filter === v} onClick={() => setFilter(v)}>{label}</button>
          ))}
        </div>
      </div>

      <div className="card scroll" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: 48 }}>#</th>
              <th>organisation</th>
              <th>slot</th>
              <th>status</th>
              <th className="num" style={{ minWidth: 150 }}>your score</th>
              <th style={{ width: 32 }}><span className="sr-only">open</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="clickable" onClick={() => { setOpening(o.id); router.push(`/jury/${o.id}`); }}>
                <td className="muted">{orgs.indexOf(o) + 1}</td>
                <td><Link href={`/jury/${o.id}`} className="org-link" onClick={(e) => { e.stopPropagation(); setOpening(o.id); }}>{o.name}</Link></td>
                <td>{o.slot ?? '-'}</td>
                <td>{opening === o.id ? <Pill>opening…</Pill> : o.myTotal === null ? <Pill tone="warn">not scored</Pill> : <Pill tone="good">scored</Pill>}</td>
                <td className="num">
                  {o.myTotal === null ? <span className="muted">-</span> : (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'flex-end' }}>
                      <ScoreBar value={o.myTotal} max={JURY_MAX} />
                      <strong>{o.myTotal}</strong><span className="muted">/ {JURY_MAX}</span>
                    </div>
                  )}
                </td>
                <td><ChevronRight size={16} aria-hidden="true" color="var(--text-muted)" /></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="muted" style={{ textAlign: 'center', padding: 32 }}>no organisations match.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
