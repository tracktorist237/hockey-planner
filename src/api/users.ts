export async function getUsers() {
  const res = await fetch("https://localhost:44390/api/Users");
  if (!res.ok) throw new Error("Не удалось загрузить пользователей");
  return res.json();
}
