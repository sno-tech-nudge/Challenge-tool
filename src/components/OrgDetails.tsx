import { ExternalLink } from 'lucide-react';
import { ORG_SECTIONS, SAMPLE, type Block, type OrgDetailsData } from '@/lib/orgSections';

function initials(name: string) {
  return name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

/** A SWOT cell: one sentence, or a list of points. */
function Points({ v }: { v: string | string[] }) {
  if (typeof v === 'string') return <p>{v}</p>;
  return <ul className="od-bullets">{v.map((t) => <li key={t}>{t}</li>)}</ul>;
}

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.kind) {
          case 'p':
            return <p key={i} className="od-p">{b.text}</p>;
          case 'subhead':
            return <h4 key={i} className="od-sub">{b.text}</h4>;
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
          case 'brief':
            return (
              <div key={i} className="od-brief">
                <p className="od-p">{b.description}</p>
                <div className="od-callout">
                  <h4>The model</h4>
                  <p>{b.model}</p>
                </div>
                {SHOW_BARRIERS && (
                  <div className="od-callout">
                    <h4>Barriers it addresses</h4>
                    <ul className="od-bullets">{b.barriers.map((t) => <li key={t}>{t}</li>)}</ul>
                  </div>
                )}
              </div>
            );
          case 'names':
            return (
              <div key={i} className="od-names">
                <h4>{b.label}</h4>
                <div className="od-tags">{b.items.map((t) => <span key={t}>{t}</span>)}</div>
              </div>
            );
          case 'panels':
            return (
              <div key={i} className="od-panels">
                {b.panels.map((p) => (
                  <div key={p.title} className="od-panel">
                    <h4>{p.title}</h4>
                    <div className="od-total">{p.total}</div>
                    {p.lines.map(([k, v]) => (
                      <div key={k} className="od-line"><span>{k}</span><strong>{v}</strong></div>
                    ))}
                  </div>
                ))}
              </div>
            );
          case 'compare':
            return (
              <div key={i} className="od-compare">
                <div className="now"><h4>Now</h4><p>{b.now}</p></div>
              </div>
            );
          case 'items':
            return (
              <div key={i} className="od-items">
                {b.rows.map((r) => (
                  <div key={r.title} className="od-item">
                    <strong>{r.title}</strong>
                    <dl>
                      {r.lines.map(([k, v]) => (
                        <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            );
          case 'table':
            return (
              <div key={i} className="od-table-wrap">
                {b.rows.length === 1 ? (
                  // one record reads best as a long table: a label and its value on each row
                  <table className="od-table long">
                    <tbody>{b.head.map((h, hi) => <tr key={h}><th scope="row">{h}</th><td>{b.rows[0][hi]}</td></tr>)}</tbody>
                  </table>
                ) : (
                  <table className="od-table">
                    <thead><tr>{b.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
                    <tbody>{b.rows.map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci}>{c}</td>)}</tr>)}</tbody>
                  </table>
                )}
              </div>
            );
          case 'bullets':
            return <ul key={i} className="od-bullets">{b.items.map((t) => <li key={t}>{t}</li>)}</ul>;
          case 'rows':
            return (
              <div key={i} className="od-rows">
                {b.rows.filter((r) => SHOW_COST_MODEL || r.heading !== 'Organisational cost model').map((r) => (
                  <div key={r.heading} className="od-row"><h4>{r.heading}</h4><p>{r.text}</p></div>
                ))}
              </div>
            );
          case 'swot':
            return (
              <div key={i} className="od-swot">
                <div className="s"><h4>Strengths</h4><Points v={b.s} /></div>
                <div className="w"><h4>Weaknesses</h4><Points v={b.w} /></div>
                <div className="o"><h4>Opportunities</h4><Points v={b.o} /></div>
                <div className="t"><h4>Threats</h4><Points v={b.t} /></div>
              </div>
            );
        }
      })}
    </>
  );
}

/** Body of the "organisation details" card: one tidy block per section, with a sticky contents
 *  bar to jump between them. Content is placeholder sample text for now. */
/** Hidden for now at the team's request; the content stays in the data, so flip a flag to show it again. */
const SHOW_BARRIERS = false;
const SHOW_COST_MODEL = false;

export function OrgDetails({ website, idPrefix, details }: { website: string | null; idPrefix: string; details: OrgDetailsData | null }) {
  // an organisation with nothing loaded yet shows the sample text, clearly marked
  const data = details ?? SAMPLE;
  const sections = ORG_SECTIONS.filter((s) => (data[s.key]?.length ?? 0) > 0);
  return (
    <div className="od">
      {website && (
        <p className="small" style={{ marginBottom: 'var(--space-3)' }}>
          <a href={website} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            {website} <ExternalLink size={13} aria-hidden="true" />
          </a>
        </p>
      )}

      {!details && <p className="od-sample">sample content: this organisation's real details have not been loaded yet.</p>}

      <nav className="od-nav" aria-label="jump to a section">
        {sections.map((s) => (
          <a key={s.key} href={`#${idPrefix}-${s.key}`}>{s.short}</a>
        ))}
      </nav>

      {sections.map((s) => (
        <section key={s.key} id={`${idPrefix}-${s.key}`} className="od-section">
          <h3 className="od-title">
            {s.title}
            {s.note && <span className="od-note"> ({s.note})</span>}
          </h3>
          <div className="od-body">
            <Blocks blocks={data[s.key]} />
          </div>
        </section>
      ))}
    </div>
  );
}
