import { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { LEGAL_DOCUMENT_VERSION, LEGAL_LAST_UPDATED, SUPPORT_EMAIL } from "./constants";
import { LegalNavigation } from "./LegalNavigation";

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  padding: "24px 14px 40px",
  background: "var(--hp-bg-gradient)",
  color: "var(--hp-text)",
  boxSizing: "border-box",
};

const articleStyle: CSSProperties = {
  width: "100%",
  maxWidth: 780,
  margin: "0 auto",
  padding: "24px",
  borderRadius: 18,
  background: "var(--hp-surface)",
  border: "1px solid var(--hp-border)",
  boxShadow: "var(--hp-shadow-md)",
  boxSizing: "border-box",
};

export const sectionStyle: CSSProperties = {
  marginTop: 22,
};

export const headingStyle: CSSProperties = {
  margin: "0 0 10px",
  fontSize: 20,
  color: "var(--hp-heading)",
};

export const paragraphStyle: CSSProperties = {
  margin: "8px 0",
  fontSize: 16,
  lineHeight: 1.65,
  color: "var(--hp-text)",
};

export const listStyle: CSSProperties = {
  margin: "8px 0 0",
  paddingLeft: 22,
  fontSize: 16,
  lineHeight: 1.65,
};

export const linkStyle: CSSProperties = {
  color: "var(--hp-primary)",
  fontWeight: 800,
};

export function SupportEmail() {
  return (
    <a href={`mailto:${SUPPORT_EMAIL}`} style={linkStyle}>
      {SUPPORT_EMAIL}
    </a>
  );
}

export function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main style={pageStyle}>
      <article style={articleStyle}>
        <Link to="/login" style={linkStyle}>
          Вернуться в Hockey Planner
        </Link>
        <h1 style={{ margin: "18px 0 8px", fontSize: 32, lineHeight: 1.15, color: "var(--hp-text-strong)" }}>
          {title}
        </h1>
        <p style={{ ...paragraphStyle, marginTop: 0, color: "var(--hp-muted)" }}>
          Версия документа: {LEGAL_DOCUMENT_VERSION}
          <br />
          Последнее обновление: {LEGAL_LAST_UPDATED}
          <br />
          Действует для сайта https://hockeyplanner.ru и связанных адресов сервиса.
        </p>
        {children}
        <LegalNavigation />
      </article>
    </main>
  );
}
