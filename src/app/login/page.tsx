import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="brand" style={{ marginBottom: 'var(--space-5)' }}>
          <span className="brand-mark" aria-hidden="true">^</span>
          midline review
        </div>
        <h1 style={{ fontSize: 28, textTransform: 'lowercase' }}>welcome <span className="em">back</span></h1>
        <p className="small muted" style={{ margin: 'var(--space-2) 0 var(--space-5)' }}>sign in with your email and password.</p>
        <LoginForm />
      </div>
    </div>
  );
}
