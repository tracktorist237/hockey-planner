import { useState } from 'react';

export function useManualUpdate() {
  const [isUpdating, setIsUpdating] = useState(false);

  const manualUpdate = async (): Promise<boolean> => {
    setIsUpdating(true);
    
    try {
      if (!('serviceWorker' in navigator)) {
        console.log('Service Worker не поддерживается');
        return false;
      }

      const registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        console.log('Service Worker не зарегистрирован');
        return false;
      }

      // Проверяем обновления
      await registration.update();
      
      if (registration.waiting) {
        // Есть ожидающее обновление
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        
        // Ждем активации нового worker
        await new Promise<void>((resolve) => {
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            resolve();
          }, { once: true });
        });
        
        // Перезагружаем страницу
        window.location.reload();
        return true;
      } else {
        // Нет обновлений
        return false;
      }
    } catch (error) {
      console.error('Ошибка при обновлении:', error);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return { manualUpdate, isUpdating };
}