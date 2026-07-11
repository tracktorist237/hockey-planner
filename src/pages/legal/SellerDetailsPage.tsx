import { LegalLayout, headingStyle, paragraphStyle, sectionStyle, listStyle } from "./LegalLayout";
import { SUPPORT_EMAIL } from "./constants";

export function SellerDetailsPage() {
  return (
    <LegalLayout title="Реквизиты продавца">
      <section style={sectionStyle}>
        <h2 style={headingStyle}>Информация о продавце</h2>
        <p style={paragraphStyle}>
          Реквизиты будут заполнены после завершения оформления продавца и подключения платёжной системы. Структура страницы подготовлена заранее,
          чтобы данные можно было добавить без изменения документов.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Реквизиты</h2>
        <ul style={listStyle}>
          <li>Организационно-правовая форма: будет указано дополнительно.</li>
          <li>ФИО или название организации: будет указано дополнительно.</li>
          <li>ИНН: будет указано дополнительно.</li>
          <li>ОГРНИП / ОГРН: будет указано при наличии.</li>
          <li>Юридический адрес: будет указан, если требуется.</li>
          <li>Email для связи: {SUPPORT_EMAIL}.</li>
        </ul>
      </section>
    </LegalLayout>
  );
}
