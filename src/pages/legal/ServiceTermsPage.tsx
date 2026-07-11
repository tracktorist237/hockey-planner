import { LegalLayout, headingStyle, paragraphStyle, sectionStyle } from "./LegalLayout";

export function ServiceTermsPage() {
  return (
    <LegalLayout title="Условия оказания услуг">
      <section style={sectionStyle}>
        <h2 style={headingStyle}>Что получает пользователь</h2>
        <p style={paragraphStyle}>
          После успешной оплаты пользователь получает доступ к выбранной цифровой услуге или набору функций Hockey Planner.
          Состав доступных функций зависит от выбранной услуги и отображается перед оплатой.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Форма оказания услуг</h2>
        <p style={paragraphStyle}>
          Доступ предоставляется в электронном виде через сайт или приложение Hockey Planner. Физическая доставка товаров не осуществляется.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Начало оказания услуги</h2>
        <p style={paragraphStyle}>
          Момент начала оказания услуги определяется успешным подтверждением платежа платёжной системой и отображением соответствующего доступа в сервисе.
        </p>
      </section>
    </LegalLayout>
  );
}
