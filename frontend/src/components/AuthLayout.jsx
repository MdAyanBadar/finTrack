import { Link } from "react-router-dom";

// Centred card for login / register
function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-dvh flex flex-col justify-center px-5 py-10 bg-bg">
      <div className="w-full max-w-sm mx-auto">
        <Link to="/about" className="inline-flex items-center gap-2.5 mb-10">
          <span className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center text-white text-lg font-bold">₹</span>
          <span className="text-lg font-bold tracking-tight">FinTrack</span>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-ink-3 mt-2">{subtitle}</p>}
        <div className="mt-8">{children}</div>
        {footer && <p className="text-sm text-ink-3 text-center mt-8">{footer}</p>}
      </div>
    </div>
  );
}

export default AuthLayout;
