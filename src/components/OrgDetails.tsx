import { ExternalLink } from 'lucide-react';
import { ORG_SECTIONS, SAMPLE, type Block } from '@/lib/orgSections';

function initials(name: string) {
  return name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.kind) {
          case 'p':
            return <p key={i} className="od-p">{b.text}</p>;
          case 'people':
            return (
              <ul key={i} className="od-people">
                {b.rows.map((r) => (
                  <li key={r.name}>
                    <span className="od-avatar" aria-hidden="true">{initials(r.name)}</span>
                    <span><strong>{r.name}</strong><br /><span className="muted small">{r.role}</span></span>
                  </li>
                ))}
              </ul>
            );
          case 'pairs':
            return (
              <div key={i} className="od-pairs">
                <div className="od-pairs-head"><span>barrier</span><span>support provided</span></div>
                {b.rows.map((r) => (
                  <div key={r.barrier} className="od-pair"><span>{r.barrier}</span><span>{r.support}</span></div>
                ))}
              </div>
            );
          case 'facts':
            return (
              <dl key={i} className="od-facts">
                {b.rows.map(([k, v]) => (
                  <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
                ))}
              </dl>
            );
          case 'steps':
            return (
              <ol key={i} className="od-steps">
                {b.items.map((t) => <li key={t}>{t}</li>)}
              </ol>
            );
          case 'bars': {
            const max = Math.max(...b.rows.map((r) => r[1]), 1);
            return (
              <div key={i} className="od-bars">
                {b.rows.map(([label, n]) => (
                  <div key={label} className="od-bar-row">
                    <span>{label}</span>
                    <div className="bar" role="img" aria-label={`${n}`}><span style={{ width: `${(n / max) * 100}%` }} /></div>
                    <strong>{n}</strong>
                  </div>
                ))}
              </div>
            );
          }
          case 'columns':
            return (
              <div key={i} className="od-cols">
                {b.cols.map((c) => (
                  <div key={c.title}>
                    <h4>{c.title}</h4>
                    <ul>{c.items.map((t) => <li key={t}>{t}</li>)}</ul>
                  </div>
                ))}
              </div>
            );
          case 'bullets':
            return <ul key={i} className="od-bullets">{b.items.map((t) => <li key={t}>{t}</li>)}</ul>;
          case 'remarks':
            return (
              <div key={i} className="od-remarks">
                {b.rows.map((r) => (
                  <div key={r.who} className="od-remark">
                    <div><strong>{r.who}</strong><p>{r.text}</p></div>
                    <span className="pill">{r.score}</span>
                  </div>
                ))}
              </div>
            );
          case 'swot':
            return (
              <div key={i} className="od-swot">
                <div className="s"><h4>Strengths</h4><p>{b.s}</p></div>
                <div className="w"><h4>Weaknesses</h4><p>{b.w}</p></div>
                <div className="o"><h4>Opportunities</h4><p>{b.o}</p></div>
                <div className="t"><h4>Threats</h4><p>{b.t}</p></div>
              </div>
            );
        }
      })}
    </>
  );
}

/** Body of the "organisation details" card: one tidy block per sheet heading, with a sticky
 *  contents bar to jump between them. Content is placeholder sample text for now. */
export function OrgDetails({ website, idPrefix }: { website: string | null; idPrefix: string }) {
  return (
    <div className="od">
      {website && (
        <p className="small" style={{ marginBottom: 'var(--space-3)' }}>
          <a href={website} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            {website} <ExternalLink size={13} aria-hidden="true" />
          </a>
        </p>
      )}

      <nav className="od-nav" aria-label="jump to a section">
        {ORG_SECTIONS.map((s) => (
          <a key={s.key} href={`#${idPrefix}-${s.key}`}>
            <b>{s.num}</b> {s.short}
          </a>
        ))}
      </nav>

      {ORG_SECTIONS.map((s) => (
        <section key={s.key} id={`${idPrefix}-${s.key}`} className="od-section">
          <header className="od-head">
            <span className="od-num">{s.num}</span>
            <h3>
              {s.title}
              {s.note && <span className="od-note"> ({s.note})</span>}
            </h3>
          </header>
          <div className="od-body">
            <Blocks blocks={SAMPLE[s.key] ?? []} />
          </div>
        </section>
      ))}
    </div>
  );
}
