import { useEffect, useMemo, useState } from "react";
import { getUsers, User as ApiUsersUser } from "../../../api/users";
import { normalizeRole } from "../../../constants/roles";
import { User } from "../../../types/user";

const mapApiUser = (user: ApiUsersUser): User => ({
  id: user.id,
  firstName: user.firstName ?? null,
  lastName: user.lastName ?? null,
  jerseyNumber: user.jerseyNumber ?? null,
  fullName: user.fullName ?? undefined,
  role: normalizeRole(user.role),
});

export const useUsersSearch = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    getUsers()
      .then((data) => {
        if (mounted) {
          setUsers(data.map(mapApiUser));
        }
      })
      .catch(console.error)
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) {
      return users;
    }

    return users.filter((u) => {
      return (
        u.firstName?.toLowerCase().includes(query) ||
        u.lastName?.toLowerCase().includes(query) ||
        u.jerseyNumber?.toString().includes(query)
      );
    });
  }, [search, users]);

  return {
    users,
    filteredUsers,
    search,
    setSearch,
    loading,
  };
};
