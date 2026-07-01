import { useCallback, useEffect, useMemo, useState } from "react";

const CURRENT_TEAM_ID_KEY = "currentTeamId";
const CURRENT_TEAM_NAME_KEY = "currentTeamName";

const readStoredValue = (key: string): string | null => {
  try {
    const value = localStorage.getItem(key);
    return value && value.trim() ? value : null;
  } catch {
    return null;
  }
};

const getTeamStorageKeys = (userId: string | null | undefined) => {
  const normalizedUserId = userId?.trim();
  if (!normalizedUserId) {
    return null;
  }

  return {
    teamIdKey: `${CURRENT_TEAM_ID_KEY}:${normalizedUserId}`,
    teamNameKey: `${CURRENT_TEAM_NAME_KEY}:${normalizedUserId}`,
  };
};

export const useCurrentTeam = (userId?: string | null) => {
  const keys = useMemo(() => getTeamStorageKeys(userId), [userId]);
  const [teamId, setTeamIdState] = useState<string | null>(() => (keys ? readStoredValue(keys.teamIdKey) : null));
  const [teamName, setTeamNameState] = useState<string | null>(() => (keys ? readStoredValue(keys.teamNameKey) : null));

  useEffect(() => {
    setTeamIdState(keys ? readStoredValue(keys.teamIdKey) : null);
    setTeamNameState(keys ? readStoredValue(keys.teamNameKey) : null);
  }, [keys]);

  const setCurrentTeam = useCallback((nextTeamId: string | null, nextTeamName?: string | null) => {
    const normalizedTeamId = nextTeamId?.trim() || null;
    const normalizedTeamName = nextTeamName?.trim() || null;

    if (!keys) {
      setTeamIdState(null);
      setTeamNameState(null);
      return;
    }

    try {
      // Legacy global keys must not leak selected team between users.
      localStorage.removeItem(CURRENT_TEAM_ID_KEY);
      localStorage.removeItem(CURRENT_TEAM_NAME_KEY);

      if (normalizedTeamId) {
        localStorage.setItem(keys.teamIdKey, normalizedTeamId);
        if (normalizedTeamName) {
          localStorage.setItem(keys.teamNameKey, normalizedTeamName);
        }
      } else {
        localStorage.removeItem(keys.teamIdKey);
        localStorage.removeItem(keys.teamNameKey);
      }
    } catch {
      // Team selection can still work in memory when storage is unavailable.
    }

    if (normalizedTeamId && normalizedTeamName) {
      setTeamNameState(normalizedTeamName);
    }

    if (!normalizedTeamId) {
      setTeamNameState(null);
    }

    setTeamIdState(normalizedTeamId);
  }, [keys]);

  const value = useMemo(
    () => ({
      teamId,
      teamName,
      setCurrentTeam,
    }),
    [setCurrentTeam, teamId, teamName],
  );

  return value;
};
