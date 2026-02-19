const API_BASE = process.env.REACT_APP_API_BASE || '';

export async function getUsers() {
  const res = await fetch(
     `${API_BASE}/api/Users`);
  if (!res.ok) throw new Error("Не удалось загрузить пользователей");
  return res.json();
}
