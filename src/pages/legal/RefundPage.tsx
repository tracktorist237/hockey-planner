import { LegalLayout, headingStyle, paragraphStyle, sectionStyle, SupportEmail } from "./LegalLayout";

export function RefundPolicyPage() {
  return (
    <LegalLayout title="Возврат денежных средств">
      <section style={sectionStyle}>
        <h2 style={headingStyle}>Обращения по возвратам</h2>
        <p style={paragraphStyle}>
          Пользователь может обратиться по вопросам возврата денежных средств, написав в службу поддержки на <SupportEmail />.
          В обращении рекомендуется указать email аккаунта, дату платежа, сумму платежа и краткое описание ситуации.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Порядок рассмотрения</h2>
        <p style={paragraphStyle}>
          Обращение рассматривается индивидуально с учётом выбранной услуги, факта предоставления доступа, технических обстоятельств и применимого законодательства.
          При необходимости поддержка может запросить дополнительную информацию для идентификации платежа.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Срок ответа</h2>
        <p style={paragraphStyle}>
          Ответ по обращению направляется в разумный срок на email, указанный пользователем, либо на email аккаунта Hockey Planner.
        </p>
      </section>
    </LegalLayout>
  );
}
