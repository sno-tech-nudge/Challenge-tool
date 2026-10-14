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
                <div className="od-callout">
                  <h4>Barriers it addresses</h4>
                  <ul className="od-bullets">{b.barriers.map((t) => <li key={t}>{t}</li>)}</ul>
                </div>
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
                <div><h4>Before</h4><p>{b.before}</p></div>
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
          case 'bullets':
            return <ul key={i} className="od-bullets">{b.items.map((t) => <li key={t}>{t}</li>)}</ul>;
          case 'rows':
            return (
              <div key={i} className="od-rows">
                {b.rows.map((r) => (
                  <div key={r.heading} className="od-row"><h4>{r.heading}</h4><p>{r.text}</p></div>
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

/** Body of the "organisation details" card: one tidy block per section, with a sticky contents
 *  bar to jump between them. Content is placeholder sample text for now. */
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
          <a key={s.key} href={`#${idPrefix}-${s.key}`}>{s.short}</a>
        ))}
      </nav>

      {ORG_SECTIONS.map((s) => (
        <section key={s.key} id={`${idPrefix}-${s.key}`} className="od-section">
          <h3 className="od-title">
            {s.title}
            {s.note && <span className="od-note"> ({s.note})</span>}
          </h3>
          <div className="od-body">
            <Blocks blocks={SAMPLE[s.key] ?? []} />
          </div>
        </section>
      ))}
    </div>
  );
}
