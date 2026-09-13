import { FileSpreadsheet, Check } from "lucide-react";

export default function AuthLayout({ heroTitle, heroItems, children }) {
  return (
    <div className="auth-shell">
      <section className="auth-hero">
        <div className="auth-hero-brand">
          <span className="auth-hero-logo">
            <FileSpreadsheet size={22} />
          </span>
          <span>FactureAI</span>
        </div>

        <div className="auth-hero-copy">
          <h1>{heroTitle}</h1>
          <ul className="auth-hero-list">
            {heroItems.map((item) => (
              <li key={item}>
                <span className="check">
                  <Check size={13} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div />
      </section>

      <section className="auth-form-side">
        <div className="auth-form-card">{children}</div>
      </section>
    </div>
  );
}
