import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <div className="login-split">
      <aside className="login-right" aria-label="about the challenge">
        <div className="dp-logo" aria-label="the delta prize">
          <span className="dp-the">the</span>
          <span className="dp-caret">^</span>
          <span className="dp-delta">delta</span>
          <span className="dp-prize">prize</span>
        </div>

        <div className="dp-headline">
          <span className="dp-small">the</span>
          <span className="dp-big">aahaar</span>
          <span className="dp-big">bazaar</span>
          <span className="dp-mid">challenge</span>
        </div>

        <p className="dp-tagline">Her recipe. Your tech. One massive opportunity.</p>
      </aside>

      <section className="login-left">
        <div className="login-card">
          <div className="brand" style={{ marginBottom: 'var(--space-6)' }}>
            <span className="brand-mark" aria-hidden="true">A</span>
            the aahaar bazaar challenge
          </div>
          <h1 style={{ fontSize: 30, textTransform: 'lowercase' }}>welcome <span className="em">back</span></h1>
          <p className="small muted" style={{ margin: 'var(--space-2) 0 var(--space-6)' }}>sign in with your email and password.</p>
          <LoginForm />
        </div>
      </section>
    </div>
  );
}
