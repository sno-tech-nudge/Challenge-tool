import bg from './login-bg.jpg';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <div className="login-hero">
      <div className="login-photo" style={{ backgroundImage: `url(${bg.src})` }} aria-hidden="true" />
      <div className="login-shade" aria-hidden="true" />

      <div className="login-content">
        <div className="dp-logo" aria-label="the delta prize">
          <span className="dp-the">the</span>
          <svg className="dp-caret" viewBox="0 0 24 14" aria-hidden="true">
            <path d="M2.2 12 L12 2.6 L21.8 12" fill="none" stroke="currentColor" strokeWidth="3.8" strokeLinejoin="miter" strokeLinecap="butt" />
          </svg>
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

        <div className="login-card">
          <h1>welcome <span className="em">back</span></h1>
          <p className="small muted">sign in with your email and password.</p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
