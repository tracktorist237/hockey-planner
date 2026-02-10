// ContactInfo.tsx
import React from 'react';

export const ContactInfo: React.FC = () => {
  const contactData = {
    telegram: '@SergeyUtkinEZ',
    phone: '+79080723092',
    email: 'utkin108@yandex.ru'
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert(`${type} скопирован в буфер обмена: ${text}`);
      })
      .catch(err => {
        console.error('Ошибка копирования: ', err);
      });
  };

  const openTelegram = () => {
    window.open(`https://t.me/${contactData.telegram.replace('@', '')}`, '_blank');
  };

  const openEmail = () => {
    window.location.href = `mailto:${contactData.email}`;
  };

  const openPhone = () => {
    window.location.href = `tel:${contactData.phone}`;
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Контактная информация</h2>
      
      <div style={styles.infoContainer}>
        {/* Телеграм */}
        <div style={styles.contactItem}>
          <div style={styles.iconContainer}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.57-1.38-.93-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.06-.2-.07-.06-.17-.04-.24-.02-.1.02-1.79 1.14-5.06 3.34-.48.33-.91.49-1.3.48-.43-.01-1.26-.24-1.88-.44-.76-.24-1.36-.37-1.31-.78.03-.24.37-.48 1-.74z"/>
            </svg>
          </div>
          <div style={styles.textContainer}>
            <div style={styles.label}>Мой Телеграм:</div>
            <div 
              style={styles.value}
              onClick={openTelegram}
              title="Открыть в Telegram"
            >
              {contactData.telegram}
            </div>
          </div>
          <button 
            onClick={() => handleCopy(contactData.telegram, 'Телеграм')}
            style={styles.copyButton}
            title="Скопировать"
          >
            📋
          </button>
        </div>

        {/* Телефон */}
        <div style={styles.contactItem}>
          <div style={styles.iconContainer}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
            </svg>
          </div>
          <div style={styles.textContainer}>
            <div style={styles.label}>Мой телефон:</div>
            <div 
              style={styles.value}
              onClick={openPhone}
              title="Позвонить"
            >
              {contactData.phone}
            </div>
          </div>
          <button 
            onClick={() => handleCopy(contactData.phone, 'Телефон')}
            style={styles.copyButton}
            title="Скопировать"
          >
            📋
          </button>
        </div>

        {/* Почта */}
        <div style={styles.contactItem}>
          <div style={styles.iconContainer}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
          </div>
          <div style={styles.textContainer}>
            <div style={styles.label}>Моя почта:</div>
            <div 
              style={styles.value}
              onClick={openEmail}
              title="Написать письмо"
            >
              {contactData.email}
            </div>
          </div>
          <button 
            onClick={() => handleCopy(contactData.email, 'Email')}
            style={styles.copyButton}
            title="Скопировать"
          >
            📋
          </button>
        </div>
      </div>

      <div style={styles.note}>
        <p>Нажмите на любой контакт, чтобы связаться со мной</p>
        <p>Или используйте кнопку 📋 для копирования</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '500px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  title: {
    textAlign: 'center' as const,
    color: '#333',
    marginBottom: '30px',
    fontSize: '24px',
  },
  infoContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
    },
  },
  iconContainer: {
    marginRight: '15px',
    color: '#007bff',
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '4px',
  },
  value: {
    fontSize: '16px',
    color: '#333',
    fontWeight: '500' as const,
  },
  copyButton: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '5px 10px',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#f0f0f0',
    },
  },
  note: {
    marginTop: '20px',
    textAlign: 'center' as const,
    fontSize: '12px',
    color: '#666',
    fontStyle: 'italic' as const,
  },
};

// Альтернативная версия с простым оформлением (если нужна более простая версия)
export const SimpleContactInfo: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ marginBottom: '20px' }}>Контактная информация</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li style={{ marginBottom: '15px' }}>
          <strong>Мой Телеграм:</strong>{' '}
          <a 
            href="https://t.me/SergeyUtkinEZ" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#007bff', textDecoration: 'none' }}
          >
            @SergeyUtkinEZ
          </a>
        </li>
        <li style={{ marginBottom: '15px' }}>
          <strong>Мой телефон:</strong>{' '}
          <a 
            href="tel:+79080723092" 
            style={{ color: '#007bff', textDecoration: 'none' }}
          >
            +79080723092
          </a>
        </li>
        <li style={{ marginBottom: '15px' }}>
          <strong>Моя почта:</strong>{' '}
          <a 
            href="mailto:utkin108@yandex.ru" 
            style={{ color: '#007bff', textDecoration: 'none' }}
          >
            utkin108@yandex.ru
          </a>
        </li>
      </ul>
      <p style={{ fontSize: '14px', color: '#666', marginTop: '20px' }}>
        Для связи со мной используйте любой удобный способ связи
      </p>
    </div>
  );
};