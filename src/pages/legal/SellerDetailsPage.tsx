import { LegalLayout, headingStyle, paragraphStyle, sectionStyle, listStyle } from "./LegalLayout";
import { SELLER_DETAILS, SUPPORT_EMAIL } from "./constants";

export function SellerDetailsPage() {
  return (
    <LegalLayout title="Реквизиты продавца">
      <section style={sectionStyle}>
        <h2 style={headingStyle}>Информация о продавце</h2>
        <p style={paragraphStyle}>
          Продавцом услуг Hockey Planner является {SELLER_DETAILS.name}.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Реквизиты продавца</h2>
        <ul style={listStyle}>
          <li>Наименование: {SELLER_DETAILS.name}.</li>
          <li>ИНН: {SELLER_DETAILS.inn}.</li>
          <li>Email для связи: {SUPPORT_EMAIL}.</li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Банковские реквизиты</h2>
        <ul style={listStyle}>
          <li>Банк: {SELLER_DETAILS.bank}.</li>
          <li>БИК: {SELLER_DETAILS.bik}.</li>
          <li>Корреспондентский счёт: {SELLER_DETAILS.correspondentAccount}.</li>
          <li>Расчётный счёт: {SELLER_DETAILS.settlementAccount}.</li>
        </ul>
      </section>
    </LegalLayout>
  );
}
