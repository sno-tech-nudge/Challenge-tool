import { Pill } from '@/components/ui';
import { RemarkTip } from '@/components/RemarkTip';

interface Row {
  id: string;
  name: string;
  verdict: string | null;
  juryAvg: number | null;
  jurors: Record<string, { verdict: string | null; comment: string | null }>;
}

/** Every juror's yes / no for every organisation, with the count of each and the admin's own call. The "i" on a
 *  verdict opens the comment that juror left with it. Highest jury average first. */
export function VerdictGrid({ rows, jurors }: { rows: Row[]; jurors: { id: string; name: string }[] }) {
  const ordered = [...rows].sort((a, b) => {
    if (a.juryAvg === null && b.juryAvg === null) return a.name.localeCompare(b.name);
    if (a.juryAvg === null) return 1;
    if (b.juryAvg === null) return -1;
    return b.juryAvg - a.juryAvg;
  });
  const count = (r: Row, v: 'Y' | 'N') => jurors.filter((j) => r.jurors[j.id]?.verdict === v).length;
  const perJuror = jurors.map((j) => ({
    yes: rows.filter((r) => r.jurors[j.id]?.verdict === 'Y').length,
    no: rows.filter((r) => r.jurors[j.id]?.verdict === 'N').length,
  }));

  return (
    <section className="card" id="verdicts" style={{ padding: 0 }} aria-label="verdicts by juror">
      <div style={{ padding: 'var(--space-5) var(--space-5) var(--space-3)' }}>
        <h2 style={{ margin: 0 }}>verdicts by juror</h2>
        <p className="hint" style={{ marginTop: 4 }}>each juror&apos;s final yes or no, highest jury average first. press the i beside a verdict to read the comment that juror left with it.</p>
      </div>
      <div className="scroll">
        <table className="snap verdicts">
          <thead>
            <tr>
              <th>organisation</th>
              {jurors.map((j) => <th key={j.id} className="num">{j.name}</th>)}
              <th className="num">yes</th>
              <th className="num">no</th>
              <th>admin verdict</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                {jurors.map((j) => {
                  const v = r.jurors[j.id];
                  const tone = v?.verdict === 'Y' ? 'v-yes' : v?.verdict === 'N' ? 'v-no' : '';
                  return (
                    <td key={j.id} className={`num vcell ${tone}`}>
                      <span className="score-cell">
                        {v?.verdict ? (v.verdict === 'Y' ? 'yes' : 'no') : <span className="muted">-</span>}
                        {v?.comment ? <RemarkTip text={v.comment} juror={`${j.name} (final comment)`} /> : <span className="remark-spacer" aria-hidden="true" />}
                      </span>
                    </td>
                  );
                })}
                <td className="num">{count(r, 'Y')}</td>
                <td className="num">{count(r, 'N')}</td>
                <td>{r.verdict ? <Pill tone={r.verdict === 'Y' ? 'good' : 'bad'}>{r.verdict === 'Y' ? 'yes' : 'no'}</Pill> : <span className="muted small">undecided</span>}</td>
              </tr>
            ))}
            <tr className="total-row">
              <td><strong>yes / no given by juror</strong></td>
              {perJuror.map((p, i) => <td key={jurors[i].id} className="num"><strong>{p.yes}</strong> <span className="muted">/ {p.no}</span></td>)}
              <td className="num" /><td className="num" /><td />
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
