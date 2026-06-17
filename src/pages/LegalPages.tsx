import { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  padding: "24px 14px 40px",
  background: "var(--hp-bg-gradient)",
  color: "var(--hp-text)",
  boxSizing: "border-box",
};

const articleStyle: CSSProperties = {
  width: "100%",
  maxWidth: 760,
  margin: "0 auto",
  padding: "24px",
  borderRadius: 18,
  background: "var(--hp-surface)",
  border: "1px solid var(--hp-border)",
  boxShadow: "var(--hp-shadow-md)",
  boxSizing: "border-box",
};

const sectionStyle: CSSProperties = {
  marginTop: 22,
};

const headingStyle: CSSProperties = {
  margin: "0 0 10px",
  fontSize: 20,
  color: "var(--hp-heading)",
};

const paragraphStyle: CSSProperties = {
  margin: "8px 0",
  fontSize: 16,
  lineHeight: 1.65,
  color: "var(--hp-text)",
};

const listStyle: CSSProperties = {
  margin: "8px 0 0",
  paddingLeft: 22,
  fontSize: 16,
  lineHeight: 1.65,
};

const linkStyle: CSSProperties = {
  color: "var(--hp-primary)",
  fontWeight: 800,
};

function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
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
          Версия: 1.0
          <br />
          Дата вступления в силу: 17.06.2026
          <br />
          Последнее обновление: 17.06.2026
        </p>
        <p style={{ ...paragraphStyle, color: "var(--hp-muted)" }}>Действует для сайта https://hockeyplanner.ru и связанных адресов сервиса.</p>
        {children}
      </article>
    </main>
  );
}

export function PrivacyPolicyPage() {
  return (
    <LegalLayout title="Политика конфиденциальности">
      <section style={sectionStyle}>
        <h2 style={headingStyle}>Какие данные мы собираем</h2>
        <p style={paragraphStyle}>Hockey Planner хранит данные, которые нужны для работы сервиса:</p>
        <ul style={listStyle}>
          <li>email, имя и фамилию пользователя;</li>
          <li>информацию о командах, игроках и событиях;</li>
          <li>даты рождения игроков, если они указаны в карточках игроков;</li>
          <li>push-токены для отправки уведомлений;</li>
          <li>загруженные изображения, например аватары или другие материалы команды;</li>
          <li>технические данные, необходимые для авторизации, безопасности и стабильной работы приложения.</li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Зачем используются данные</h2>
        <p style={paragraphStyle}>
          Данные используются для регистрации и входа, управления командами и игроками, планирования тренировок и событий, отправки важных уведомлений, отображения изображений и поддержки работы сервиса.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Где хранятся данные</h2>
        <p style={paragraphStyle}>
          Основные данные приложения хранятся на инфраструктуре Timeweb в базе данных PostgreSQL. Изображения хранятся с использованием сервиса ImageKit.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Сторонние сервисы</h2>
        <p style={paragraphStyle}>Для работы Hockey Planner используются сторонние сервисы:</p>
        <ul style={listStyle}>
          <li>Timeweb VPS и PostgreSQL - размещение приложения и хранение основных данных;</li>
          <li>Resend - отправка email-сообщений;</li>
          <li>ImageKit - хранение и доставка изображений.</li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Передача и продажа данных</h2>
        <p style={paragraphStyle}>
          Мы не продаем персональные данные пользователей третьим лицам. Данные передаются сторонним сервисам только в объеме, необходимом для работы Hockey Planner.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Удаление данных</h2>
        <p style={paragraphStyle}>
          Пользователь может запросить удаление своих данных, написав на <a href="mailto:support@hockeyplanner.ru" style={linkStyle}>support@hockeyplanner.ru</a>. В запросе укажите email аккаунта и, если нужно, какие данные следует удалить.
        </p>
        <p style={paragraphStyle}>
          Запросы на удаление данных рассматриваются в разумный срок, как правило не более 30 календарных дней.
        </p>
        <p style={paragraphStyle}>
          После обработки запроса аккаунт и связанные с ним данные могут быть удалены без возможности восстановления.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Обновление политики</h2>
        <p style={paragraphStyle}>
          Политика конфиденциальности может обновляться. Актуальная версия всегда публикуется на этой странице.
        </p>
      </section>
    </LegalLayout>
  );
}

export function TermsOfServicePage() {
  return (
    <LegalLayout title="Пользовательское соглашение">
      <section style={sectionStyle}>
        <h2 style={headingStyle}>О сервисе</h2>
        <p style={paragraphStyle}>
          Hockey Planner - это сервис для управления хоккейными командами, игроками, тренировками и событиями. Сервис помогает вести расписание, составы, посещаемость и другую командную информацию.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Данные пользователя</h2>
        <p style={paragraphStyle}>
          Пользователь обязуется указывать корректные данные и не размещать информацию, которую он не имеет права использовать или передавать через сервис.
        </p>
        <p style={paragraphStyle}>
          Если пользователь размещает данные несовершеннолетних игроков, он подтверждает наличие необходимых прав и согласий на обработку таких данных.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Запрещенные действия</h2>
        <p style={paragraphStyle}>При использовании Hockey Planner запрещено:</p>
        <ul style={listStyle}>
          <li>использовать сервис для незаконных действий;</li>
          <li>рассылать спам или нежелательные сообщения;</li>
          <li>пытаться получить доступ к чужим аккаунтам, командам или данным;</li>
          <li>мешать работе сервиса, обходить ограничения или использовать уязвимости.</li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Условия работы сервиса</h2>
        <p style={paragraphStyle}>
          Сервис предоставляется "как есть". Владелец Hockey Planner старается поддерживать стабильную работу приложения, но не гарантирует абсолютную бесперебойность или отсутствие ошибок.
        </p>
        <p style={paragraphStyle}>
          Владелец сервиса может изменять функциональность, внешний вид, правила работы и доступные возможности Hockey Planner.
        </p>
        <p style={paragraphStyle}>
          Владелец сервиса вправе ограничить или прекратить доступ к сервису в случае нарушения настоящего соглашения.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Обновление правил</h2>
        <p style={paragraphStyle}>
          Пользовательское соглашение может обновляться. Актуальная версия всегда доступна на этой странице.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Контакты</h2>
        <p style={paragraphStyle}>
          По вопросам работы сервиса и соглашения можно написать на <a href="mailto:support@hockeyplanner.ru" style={linkStyle}>support@hockeyplanner.ru</a>.
        </p>
      </section>
    </LegalLayout>
  );
}
