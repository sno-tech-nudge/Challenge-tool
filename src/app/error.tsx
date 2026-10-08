'use client';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="wrap">
      <div className="card accent" style={{ maxWidth: 520 }}>
        <h2>something went wrong</h2>
        <p className="small muted" style={{ margin: 'var(--space-2) 0 var(--space-4)' }}>the page could not load. try again, or go back to the start.</p>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button type="button" className="btn" onClick={reset}>try again</button>
          <a className="btn secondary" href="/">go home</a>
        </div>
      </div>
    </div>
  );
}
