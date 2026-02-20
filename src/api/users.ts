const API_BASE = process.env.REACT_APP_API_BASE || '';

export interface CreateUserData {
  firstName: string;
  lastName: string;
  jerseyNumber?: number | null;
  primaryPosition: number; // 1: Goalie, 2: Defender, 3: Forward
  handedness: number; // 1: Left, 2: Right
  height?: number | null;
  weight?: number | null;
  birthDate?: string | null;
}

export interface User extends CreateUserData {
  id: string;
  role: number;
  createdAt: string;
  updatedAt: string | null;
  email?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
  fullName: string;
}

// Получить всех пользователей
export async function getUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/api/Users`);
  
  if (!res.ok) {
    throw new Error(`Не удалось загрузить пользователей: ${res.status}`);
  }
  
  return res.json();
}

// Получить пользователя по ID
export async function getUserById(id: string): Promise<User> {
  const res = await fetch(`${API_BASE}/api/Users/${id}`);
  
  if (!res.ok) {
    throw new Error(`Не удалось загрузить пользователя: ${res.status}`);
  }
  
  return res.json();
}

// Создать нового пользователя
export async function createUser(userData: CreateUserData): Promise<User> {
  const res = await fetch(`${API_BASE}/api/Users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...userData,
      role: 3, // По умолчанию UserRole = 3
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || `Ошибка создания пользователя: ${res.status}`);
  }

  // Проверяем, есть ли тело ответа
  const text = await res.text();
  if (!text) {
    // Если сервер не вернул данные, но запрос успешен,
    // возвращаем объект с переданными данными
    return {
      ...userData,
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      role: 3,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      fullName: `${userData.lastName} ${userData.firstName}`,
    } as User;
  }

  return JSON.parse(text);
}

// Обновить пользователя
export async function updateUser(id: string, userData: Partial<CreateUserData>): Promise<User> {
  const res = await fetch(`${API_BASE}/api/Users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!res.ok) {
    throw new Error(`Ошибка обновления пользователя: ${res.status}`);
  }

  return res.json();
}

// Удалить пользователя
export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/Users/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error(`Ошибка удаления пользователя: ${res.status}`);
  }
}