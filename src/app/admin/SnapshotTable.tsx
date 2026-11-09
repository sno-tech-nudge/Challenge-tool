'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ArrowDown, ArrowUp } from 'lucide-react';
import { EXPECTED_JURORS } from '@/lib/constants';
import { ecociateOn100, finalAtWeight } from '@/lib/scoring';
import { Pill, scoreTone } from '@/components/ui';

interface Row {
  id: string;
  name: string;
  verdict: string | null;
  rescored: number;
  ecociateScore: number | null;
  juryAvg100: number | null;
  juryAvg: number | null;
  juryCount: number;
  jurors: Record<string, { total: number; rescored: boolean }>;
}
interface Juror { id: string; name: string }

type VerdictFilter = 'all' | 'Y' | 'N' | 'none';
type Sort = { key: string; dir: 'asc' | 'desc' };

/** Ecociate : jury, as percentages. 60 : 40 is how the final score is worked out everywhere else. */
const PRESETS = [60, 50, 40];
const show = (n: number | null) => (n === null ? '-' : String(n));
const clampPct = (n: number) => Math.min(100, Math.max(0, Math.round(n)));

/** The whole snapshot: one line per organisation with every number that goes into its score. The organisation
 *  names stay in view while the rest scrolls, and the weighting between ecociate and jury can be changed. */
export function SnapshotTable({ rows, jurors }: { rows: Row[]; jurors: Juror[] }) {
  const router = useRouter();
  const [q, setQ] = React.useState('');
  const [verdict, setVerdict] = React.useState<VerdictFilter>('all');
  const [sort, setSort] = React.useState<Sort>({ key: 'name', dir: 'asc' });
  const [sel, setSel] = React.useState(60); // the weighting the highlighted columns and "score" sorting follow
  const [custom, setCustom] = React.useState<number | null>(null); // an extra weighting typed by the admin
  const [customText, setCustomText] = React.useState('');

  const weights = custom !== null && !PRESETS.includes(custom) ? [...PRESETS, custom] : PRESETS;

  // rank of every organisation for each weighting (1 = best; equal scores share a rank)
  const ranks = React.useMemo(() => {
    const out: Record<number, Map<string, number>> = {};
    for (const w of weights) {
      const scored = rows.map((r) => ({ id: r.id, f: finalAtWeight(r.ecociateScore, r.juryAvg100, w) })).filter((x): x is { id: string; f: number } => x.f !== null);
      const m = new Map<string, number>();
      for (const x of scored) m.set(x.id, 1 + scored.filter((y) => y.f > x.f).length);
      out[w] = m;
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, custom]);

  const value = (r: Row, key: string): string | number | null => {
    if (key === 'name') return r.name;
    if (key === 'eco') return ecociateOn100(r.ecociateScore);
    if (key === 'avg') return r.juryAvg;
    if (key.startsWith('j:')) return r.jurors[key.slice(2)]?.total ?? null;
    if (key.startsWith('f:')) return finalAtWeight(r.ecociateScore, r.juryAvg100, Number(key.slice(2)));
    if (key.startsWith('r:')) return ranks[Number(key.slice(2))]?.get(r.id) ?? null;
    return null;
  };

  const visible = rows
    .filter((r) => {
      if (verdict === 'Y' && r.verdict !== 'Y') return false;
      if (verdict === 'N' && r.verdict !== 'N') return false;
      if (verdict === 'none' && r.verdict) return false;
      return !q || r.name.toLowerCase().includes(q.toLowerCase());
    })
    .sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      const x = value(a, sort.key);
      const y = value(b, sort.key);
      if (sort.key === 'name') return String(x).localeCompare(String(y)) * dir;
      if (x === null && y === null) return 0;
      if (x === null) return 1; // unscored rows always sink to the bottom
      if (y === null) return -1;
      return ((x as number) - (y as number)) * dir;
    });

  function toggle(key: string) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'name' || key.startsWith('r:') ? 'asc' : 'desc' }));
  }
  const Head = ({ k, children, num, cls }: { k: string; children: React.ReactNode; num?: boolean; cls?: string }) => (
    <th className={[num ? 'num' : '', cls ?? ''].join(' ').trim() || undefined} aria-sort={sort.key === k ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className="sort" onClick={() => toggle(k)}>
        {children}
        {sort.key === k && (sort.dir === 'asc' ? <ArrowUp size={12} aria-hidden="true" /> : <ArrowDown size={12} aria-hidden="true" />)}
      </button>
    </th>
  );
  const selCls = (w: number) => (w === sel ? 'col-sel' : undefined);

  function applyCustom(text: string) {
    setCustomText(text);
    const n = Number(text);
    if (text.trim() === '' || !Number.isFinite(n)) return;
    const pct = clampPct(n);
    setCustom(pct);
    setSel(pct);
  }

  return (
    <>
      <div className="toolbar">
        <div className="grow">
          <Search size={14} aria-hidden="true" style={{ position: 'absolute', left: 10, top: 12, color: 'var(--text-muted)' }} />
          <input type="search" placeholder="search organisation" aria-label="search organisations" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: '100%', paddingLeft: 32 }} />
        </div>
        <div className="chips" role="group" aria-label="filter by verdict">
          {([['all', 'all'], ['Y', 'yes'], ['N', 'no'], ['none', 'undecided']] as [VerdictFilter, string][]).map(([v, label]) => (
            <button key={v} type="button" aria-pressed={verdict === v} onClick={() => setVerdict(v)}>{label}</button>
          ))}
        </div>
        <div className="end">
          <label htmlFor="sort-by">sort by</label>
          <select
            id="sort-by"
            value={sort.key === 'name' || sort.key === `f:${sel}` ? `${sort.key === 'name' ? 'name' : 'final'}:${sort.dir}` : 'column'}
            onChange={(e) => {
              if (e.target.value === 'column') return;
              const [k, dir] = e.target.value.split(':');
              setSort({ key: k === 'name' ? 'name' : `f:${sel}`, dir: dir as 'asc' | 'desc' });
            }}
          >
            <option value="name:asc">alphabetical (A to Z)</option>
            <option value="name:desc">alphabetical (Z to A)</option>
            <option value="final:desc">score (high to low)</option>
            <option value="final:asc">score (low to high)</option>
            {!(sort.key === 'name' || sort.key === `f:${sel}`) && <option value="column">by column</option>}
          </select>
        </div>
      </div>

      <div className="weighting" role="group" aria-label="weighting of the final score">
        <span className="label">weighting (ecociate : jury)</span>
        <div className="chips">
          {PRESETS.map((w) => (
            <button key={w} type="button" aria-pressed={sel === w} onClick={() => setSel(w)}>{w} : {100 - w}</button>
          ))}
          {custom !== null && !PRESETS.includes(custom) && (
            <button type="button" aria-pressed={sel === custom} onClick={() => setSel(custom)}>{custom} : {100 - custom}</button>
          )}
        </div>
        <label className="custom-weight" htmlFor="custom-weight">
          custom, ecociate %
          <input id="custom-weight" type="number" min={0} max={100} step={5} inputMode="numeric" value={customText} placeholder="e.g. 70" onChange={(e) => applyCustom(e.target.value)} onWheel={(e) => e.currentTarget.blur()} />
        </label>
        <span className="hint">all weightings are shown below; the highlighted one drives the score sort.</span>
      </div>

      <div className="card scroll" style={{ padding: 0 }}>
        <table className="snap">
          <thead>
            <tr>
              <Head k="name">organisation</Head>
              <Head k="eco" num>ecociate /100</Head>
              {jurors.map((j) => <Head key={j.id} k={`j:${j.id}`} num>{j.name} /40</Head>)}
              <Head k="avg" num>jury avg /40</Head>
              <th className="num">jurors</th>
              {weights.map((w) => <Head key={`f${w}`} k={`f:${w}`} num cls={selCls(w)}>final {w} : {100 - w}<small className="head-sub">/100</small></Head>)}
              {weights.map((w) => <Head key={`r${w}`} k={`r:${w}`} num cls={selCls(w)}>rank {w} : {100 - w}</Head>)}
              <th>verdict</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id} className="clickable" onClick={() => router.push(`/admin/${r.id}`)}>
                <td><Link href={`/admin/${r.id}`} className="org-link" onClick={(e) => e.stopPropagation()}>{r.name}</Link>
                  {r.rescored > 0 && <span className="rescored-tag" title={`${r.rescored} juror${r.rescored === 1 ? '' : 's'} rescored this organisation`}>rescored</span>}</td>
                <td className="num">{show(ecociateOn100(r.ecociateScore))}</td>
                {jurors.map((j) => (
                  <td key={j.id} className="num">{r.jurors[j.id] ? r.jurors[j.id].total : <span className="muted">-</span>}</td>
                ))}
                <td className="num">{show(r.juryAvg)}</td>
                <td className="num">{r.juryCount} / {Math.max(EXPECTED_JURORS, jurors.length)}</td>
                {weights.map((w) => {
                  const f = finalAtWeight(r.ecociateScore, r.juryAvg100, w);
                  return <td key={`f${w}`} className={`num${w === sel ? ' col-sel' : ''}`}><strong className={f === null ? undefined : `tone-${scoreTone(f, 100)}`}>{show(f)}</strong></td>;
                })}
                {weights.map((w) => <td key={`r${w}`} className={`num${w === sel ? ' col-sel' : ''}`}>{ranks[w]?.get(r.id) ?? <span className="muted">-</span>}</td>)}
                <td>{r.verdict ? <Pill tone={r.verdict === 'Y' ? 'good' : 'bad'}>{r.verdict === 'Y' ? 'yes' : 'no'}</Pill> : <span className="muted small">undecided</span>}</td>
              </tr>
            ))}
            {visible.length === 0 && <tr><td colSpan={7 + jurors.length + weights.length * 2} className="muted" style={{ textAlign: 'center', padding: 32 }}>no organisations match.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
