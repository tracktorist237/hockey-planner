import { LegalLayout, headingStyle, paragraphStyle, sectionStyle } from "./LegalLayout";

export function PaymentInfoPage() {
  return (
    <LegalLayout title="Оплата">
      <section style={sectionStyle}>
        <h2 style={headingStyle}>Платные цифровые услуги</h2>
        <p style={paragraphStyle}>
          Hockey Planner может предоставлять платные цифровые услуги, связанные с использованием дополнительных функций сервиса,
          расширенных возможностей команд или иных цифровых инструментов приложения.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Информация перед оплатой</h2>
        <p style={paragraphStyle}>
          Перечень доступных услуг, стоимость, срок действия и иные существенные условия будут отображаться пользователю непосредственно перед оплатой.
          Перед подтверждением платежа пользователь всегда увидит актуальную стоимость и описание выбранной услуги.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Платёжные системы</h2>
        <p style={paragraphStyle}>
          Оплата может проводиться через подключённые платёжные сервисы и банки. Конкретные способы оплаты отображаются на платёжной форме.
        </p>
      </section>
    </LegalLayout>
  );
}
