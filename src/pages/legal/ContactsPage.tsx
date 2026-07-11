import { LegalLayout, headingStyle, paragraphStyle, sectionStyle, SupportEmail } from "./LegalLayout";

export function ContactsPage() {
  return (
    <LegalLayout title="Контакты">
      <section style={sectionStyle}>
        <h2 style={headingStyle}>Служба поддержки</h2>
        <p style={paragraphStyle}>
          Email для обращений пользователей, вопросов по работе сервиса, оплате, возвратам и данным: <SupportEmail />.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Форма обратной связи</h2>
        <p style={paragraphStyle}>
          Авторизованные пользователи могут отправить обращение через форму "Сообщить о проблеме" в настройках приложения или на странице входа.
          Такие обращения попадают в административный раздел Hockey Planner.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Телефон</h2>
        <p style={paragraphStyle}>
          Телефон службы поддержки будет опубликован на этой странице после утверждения канала телефонной связи.
        </p>
      </section>
    </LegalLayout>
  );
}
