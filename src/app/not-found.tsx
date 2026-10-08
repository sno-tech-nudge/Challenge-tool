import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="wrap">
      <div className="card accent" style={{ maxWidth: 520 }}>
        <h2>not found</h2>
        <p className="small muted" style={{ margin: 'var(--space-2) 0 var(--space-4)' }}>that page or organisation does not exist.</p>
        <Link className="btn" href="/">go home</Link>
      </div>
    </div>
  );
}
