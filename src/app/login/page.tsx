import bg from './login-bg.jpg';
import logo from './logo.png';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <div className="login-hero">
      <div className="login-photo" style={{ backgroundImage: `url(${bg.src})` }} aria-hidden="true" />
      <div className="login-shade" aria-hidden="true" />

      <div className="login-content">
        <img className="dp-logo" src={logo.src} alt="the delta prize" width={logo.width} height={logo.height} />

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
