'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ChevronRight, ArrowDown, ArrowUp } from 'lucide-react';
import { ECOCIATE_MAX, JURY_MAX, EXPECTED_JURORS } from '@/lib/constants';
import { Pill, ScoreBar } from '@/components/ui';

interface Row {
  id: string;
  name: string;
  slot: string | null;
  verdict: string | null;
  ecociate: number | null;
  juryAvg: number | null;
  juryCount: number;
  final: number | null;
}

type SortKey = 'name' | 'ecociate' | 'juryAvg' | 'final';
type VerdictFilter = 'all' | 'Y' | 'N' | 'none';

const show = (n: number | null) => (n === null ? '-' : String(n));

export function SnapshotTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [q, setQ] = React.useState('');
  const [verdict, setVerdict] = React.useState<VerdictFilter>('all');
  const [sort, setSort] = React.useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'name', dir: 'asc' });

  const visible = rows
    .filter((r) => {
      if (verdict === 'Y' && r.verdict !== 'Y') return false;
      if (verdict === 'N' && r.verdict !== 'N') return false;
      if (verdict === 'none' && r.verdict) return false;
      return !q || r.name.toLowerCase().includes(q.toLowerCase());
    })
    .sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      if (sort.key === 'name') return a.name.localeCompare(b.name) * dir;
      const x = a[sort.key];
      const y = b[sort.key];
      if (x === null && y === null) return 0;
      if (x === null) return 1; // unscored rows always sink to the bottom
      if (y === null) return -1;
      return (x - y) * dir;
    });

  function toggle(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'name' ? 'asc' : 'desc' }));
  }
  const Head = ({ k, children, num }: { k: SortKey; children: React.ReactNode; num?: boolean }) => (
    <th className={num ? 'num' : undefined} aria-sort={sort.key === k ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className="sort" onClick={() => toggle(k)}>
        {children}
        {sort.key === k && (sort.dir === 'asc' ? <ArrowUp size={12} aria-hidden="true" /> : <ArrowDown size={12} aria-hidden="true" />)}
      </button>
    </th>
  );

  return (
    <>
      <div className="toolbar" style={{ marginBottom: 0 }}>
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 360 }}>
          <Search size={14} aria-hidden="true" style={{ position: 'absolute', left: 10, top: 12, color: 'var(--text-muted)' }} />
          <input type="search" placeholder="search organisation" aria-label="search organisations" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: '100%', paddingLeft: 32 }} />
        </div>
        <div className="chips" role="group" aria-label="filter by verdict">
          {([['all', 'all'], ['Y', 'yes'], ['N', 'no'], ['none', 'undecided']] as [VerdictFilter, string][]).map(([v, label]) => (
            <button key={v} type="button" aria-pressed={verdict === v} onClick={() => setVerdict(v)}>{label}</button>
          ))}
        </div>
        <span className="small muted">{visible.length} of {rows.length} shown</span>
      </div>

      <div className="card scroll" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: 48 }}>#</th>
              <Head k="name">organisation</Head>
              <th>slot</th>
              <Head k="ecociate" num>ecociate /{ECOCIATE_MAX}</Head>
              <Head k="juryAvg" num>jury avg /{JURY_MAX}</Head>
              <th className="num">jurors</th>
              <Head k="final" num>final /100</Head>
              <th style={{ minWidth: 110 }}>score</th>
              <th>verdict</th>
              <th style={{ width: 32 }}><span className="sr-only">open</span></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id} className="clickable" onClick={() => router.push(`/admin/${r.id}`)}>
                <td className="muted">{rows.indexOf(r) + 1}</td>
                <td><Link href={`/admin/${r.id}`} className="org-link" onClick={(e) => e.stopPropagation()}>{r.name}</Link></td>
                <td>{r.slot ?? '-'}</td>
                <td className="num">{show(r.ecociate)}</td>
                <td className="num">{show(r.juryAvg)}</td>
                <td className="num">{r.juryCount} / {EXPECTED_JURORS}</td>
                <td className="num"><strong>{show(r.final)}</strong></td>
                <td><ScoreBar value={r.final} max={100} /></td>
                <td>{r.verdict ? <Pill tone={r.verdict === 'Y' ? 'good' : 'bad'}>{r.verdict === 'Y' ? 'yes' : 'no'}</Pill> : <span className="muted small">undecided</span>}</td>
                <td><ChevronRight size={16} aria-hidden="true" color="var(--text-muted)" /></td>
              </tr>
            ))}
            {visible.length === 0 && <tr><td colSpan={10} className="muted" style={{ textAlign: 'center', padding: 32 }}>no organisations match.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
