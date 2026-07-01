import { buildApiUrl } from "src/api/client";

export interface CreateUserData {
  firstName: string;
  lastName: string;
  jerseyNumber?: number | null;
  primaryPosition: number;
  handedness: number;
  height?: number | null;
  weight?: number | null;
  birthDate?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
  spbhlPlayerId?: string | null;
}

export interface UpdateUserData extends Partial<CreateUserData> {
  photoUrl?: string | null;
  spbhlPlayerId?: string | null;
}

export interface User extends CreateUserData {
  id: string;
  role: number;
  createdAt: string;
  updatedAt: string | null;
  email?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
  spbhlPlayerId?: string | null;
  fullName: string;
}

const ensureOk = async (res: Response, fallbackMessage: string): Promise<void> => {
  if (res.ok) {
    return;
  }

  const errorData = await res.json().catch(() => null);
  throw new Error(errorData?.message || `${fallbackMessage}: ${res.status}`);
};

const createFallbackUserId = (): string => {
  const randomUuid = globalThis.crypto?.randomUUID;
  return randomUuid ? randomUuid.call(globalThis.crypto) : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export async function getUsers(): Promise<User[]> {
  const res = await fetch(buildApiUrl("/api/Users"));
  await ensureOk(res, "Не удалось загрузить пользователей");
  return res.json();
}

export async function getUserById(id: string): Promise<User> {
  const res = await fetch(buildApiUrl(`/api/Users/${id}`));
  await ensureOk(res, "Не удалось загрузить пользователя");
  return res.json();
}

export async function createUser(userData: CreateUserData): Promise<User> {
  const res = await fetch(buildApiUrl("/api/Users"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...userData,
      role: 3,
    }),
  });

  await ensureOk(res, "Ошибка создания пользователя");

  const text = await res.text();
  if (!text) {
    return {
      ...userData,
      id: createFallbackUserId(),
      role: 3,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      fullName: `${userData.lastName} ${userData.firstName}`,
    } as User;
  }

  return JSON.parse(text) as User;
}

export async function updateUser(id: string, userData: UpdateUserData): Promise<User> {
  const res = await fetch(buildApiUrl(`/api/Users/${id}`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  await ensureOk(res, "Ошибка обновления пользователя");
  return res.json();
}

export async function uploadUserAvatar(id: string, file: File): Promise<User> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(buildApiUrl(`/api/Users/${id}/avatar/upload`), {
    method: "POST",
    body: formData,
  });

  await ensureOk(res, "Ошибка загрузки аватара");
  return res.json();
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(buildApiUrl(`/api/Users/${id}`), {
    method: "DELETE",
  });

  await ensureOk(res, "Ошибка удаления пользователя");
}

