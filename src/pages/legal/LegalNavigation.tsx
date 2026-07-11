import { CSSProperties } from "react";
import { Link } from "react-router-dom";

const legalLinks = [
  ["О сервисе", "/about"],
  ["Оплата", "/payment"],
  ["Условия оказания услуг", "/service-terms"],
  ["Возврат денежных средств", "/refund"],
  ["Контакты", "/contacts"],
  ["Политика конфиденциальности", "/privacy"],
  ["Пользовательское соглашение", "/terms"],
  ["Реквизиты", "/seller-details"],
] as const;

const navStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 18,
  paddingTop: 18,
  borderTop: "1px solid var(--hp-border)",
};

const chipStyle: CSSProperties = {
  border: "1px solid var(--hp-border)",
  borderRadius: 999,
  padding: "7px 10px",
  background: "var(--hp-surface-soft)",
  color: "var(--hp-heading)",
  fontSize: 13,
  fontWeight: 800,
  textDecoration: "none",
};

export function LegalNavigation() {
  return (
    <nav aria-label="Документы Hockey Planner" style={navStyle}>
      {legalLinks.map(([label, path]) => (
        <Link key={path} to={path} style={chipStyle}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
