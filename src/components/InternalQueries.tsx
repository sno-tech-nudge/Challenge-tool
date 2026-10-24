/** The questions the team could ask an organisation about its current model. Stored as plain text:
 *  items separated by a blank line, each a statement followed by a "To probe:" line. */
export function InternalQueries({ text }: { text: string | null }) {
  const items = (text ?? '')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const [statement, ...rest] = block.split('\n');
      return { statement: statement.trim(), probe: rest.join(' ').replace(/^to probe:\s*/i, '').trim() };
    });

  return (
    <>
      <p className="hint" style={{ marginBottom: 'var(--space-3)' }}>
        these are questions which could be asked, in relation to the organisation's current model.
      </p>
      {items.length === 0 ? (
        <p className="muted">none yet</p>
      ) : (
        <ol className="queries">
          {items.map((q, i) => (
            <li key={i}>
              <strong>{q.statement}</strong>
              {q.probe && <p><span className="muted">to probe:</span> {q.probe}</p>}
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
