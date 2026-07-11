import { LegalLayout, headingStyle, paragraphStyle, sectionStyle, listStyle } from "./LegalLayout";

export function ProductOverviewPage() {
  return (
    <LegalLayout title="О сервисе Hockey Planner">
      <section style={sectionStyle}>
        <h2 style={headingStyle}>Что такое Hockey Planner</h2>
        <p style={paragraphStyle}>
          Hockey Planner - цифровой сервис для организации хоккейных команд, тренировок, матчей и командной коммуникации.
          Приложение помогает участникам команды видеть актуальное расписание, отмечаться на мероприятия и получать важные уведомления.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Для кого предназначен сервис</h2>
        <p style={paragraphStyle}>
          Сервис предназначен для любительских и спортивных хоккейных команд, игроков, тренеров, администраторов команд и приглашённых участников мероприятий.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Какие задачи решает</h2>
        <ul style={listStyle}>
          <li>ведение календаря тренировок, матчей и встреч;</li>
          <li>сбор явки игроков и гостей на мероприятия;</li>
          <li>создание и просмотр составов и звеньев;</li>
          <li>публикация командных новостей;</li>
          <li>уведомления о важных событиях команды;</li>
          <li>управление командами, ролями и участниками;</li>
          <li>работа с вратарскими заявками и откликами.</li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Основные возможности</h2>
        <p style={paragraphStyle}>
          В Hockey Planner доступны аккаунты пользователей, страницы команд, мероприятия, явка, составы, гости, новости, центр уведомлений,
          настройки приватности и мобильный PWA-интерфейс. Набор возможностей может изменяться и расширяться по мере развития сервиса.
        </p>
      </section>
    </LegalLayout>
  );
}
