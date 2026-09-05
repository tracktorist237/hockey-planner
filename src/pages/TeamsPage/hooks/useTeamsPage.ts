import { useCallback, useMemo, useRef, useState } from "react";
import {
  createTeam,
  getMyTeams,
  getPublicTeams,
  getTeamMembers,
  joinPublicTeam,
  joinTeamByCode,
  TeamsApiError,
  updateTeamMember,
} from "src/api/teams";
import { createTeamExternalLeagueLink, syncTeamExternalLeagueLink } from "src/api/externalLeagueTeams";
import { TeamDto, TeamMemberDto, TeamVisibility, UpdateTeamMemberRequest } from "src/types/teams";
import { User } from "src/types/user";
import { TeamsTab } from "../types";
import type { SelectedExternalTeam } from "../types";

export interface CreateTeamOutcome {
  team: TeamDto;
  linked: SelectedExternalTeam[];
  failed: SelectedExternalTeam[];
}

export function useTeamsPage(currentUser: User | null) {
  const [myTeams, setMyTeams] = useState<TeamDto[]>([]);
  const [publicTeams, setPublicTeams] = useState<TeamDto[]>([]);
  const [activeTab, setActiveTab] = useState<TeamsTab>("my");
  const [selectedPublicTeam, setSelectedPublicTeam] = useState<TeamDto | null>(null);
  const [managedTeam, setManagedTeam] = useState<TeamDto | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMemberDto[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSavingId, setMemberSavingId] = useState<string | null>(null);
  const [createName, setCreateName] = useState("");
  const [createPublic, setCreatePublic] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [joinTeamNumber, setJoinTeamNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [apiUnavailable, setApiUnavailable] = useState(false);
  const creatingTeam = useRef(false);
  const [pinnedTeamIds, setPinnedTeamIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("pinnedTeamIds");
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });

  const myTeamIds = useMemo(() => new Set(myTeams.map((team) => team.id)), [myTeams]);

  const availablePublicTeams = useMemo(
    () => publicTeams.filter((team) => !myTeamIds.has(team.id)).sort((a, b) => a.name.localeCompare(b.name, "ru")),
    [myTeamIds, publicTeams],
  );

  const sortedMyTeams = useMemo(
    () =>
      [...myTeams].sort((a, b) => {
        const aPinned = pinnedTeamIds.includes(a.id);
        const bPinned = pinnedTeamIds.includes(b.id);
        if (aPinned !== bPinned) {
          return aPinned ? -1 : 1;
        }
        return a.name.localeCompare(b.name, "ru");
      }),
    [myTeams, pinnedTeamIds],
  );

  const togglePinnedTeam = useCallback((teamId: string) => {
    setPinnedTeamIds((previous) => {
      const next = previous.includes(teamId)
        ? previous.filter((value) => value !== teamId)
        : [...previous, teamId];
      localStorage.setItem("pinnedTeamIds", JSON.stringify(next));
      return next;
    });
  }, []);

  const reloadTeams = useCallback(async () => {
    if (!currentUser?.id) {
      setMyTeams([]);
      setPublicTeams([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [loadedMyTeams, loadedPublicTeams] = await Promise.all([getMyTeams(currentUser.id), getPublicTeams()]);
      setMyTeams(loadedMyTeams);
      setPublicTeams(loadedPublicTeams);
      setApiUnavailable(false);

      setManagedTeam((previous) => {
        if (!previous) {
          return null;
        }
        return loadedMyTeams.find((team) => team.id === previous.id) ?? null;
      });
    } catch (requestError) {
      if (requestError instanceof TeamsApiError && (requestError.status === 404 || requestError.status === 405)) {
        setApiUnavailable(true);
        setError("Раздел команд недоступен: backend ещё не обновлён.");
      } else {
        console.error(requestError);
        setError("Не удалось загрузить команды. Попробуйте обновить.");
      }
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [currentUser?.id]);

  const openTeamManagement = useCallback(async (team: TeamDto) => {
    setManagedTeam(team);
    setMembersLoading(true);
    setError(null);
    try {
      setTeamMembers(await getTeamMembers(team.id));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось загрузить участников команды.");
    } finally {
      setMembersLoading(false);
    }
  }, []);

  const closeTeamManagement = useCallback(() => {
    setManagedTeam(null);
    setTeamMembers([]);
  }, []);

  const saveTeamMember = useCallback(
    async (member: TeamMemberDto, request: UpdateTeamMemberRequest) => {
      if (!currentUser?.id || !managedTeam) {
        return;
      }

      setMemberSavingId(member.userId);
      setError(null);
      setMessage(null);
      try {
        const updated = await updateTeamMember(managedTeam.id, member.userId, request, currentUser.id);
        setTeamMembers((previous) => previous.map((value) => (value.userId === updated.userId ? updated : value)));
        setMessage("Участник обновлён.");
        await reloadTeams();
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Не удалось обновить участника.");
      } finally {
        setMemberSavingId(null);
      }
    },
    [currentUser?.id, managedTeam, reloadTeams],
  );

  const createNewTeam = useCallback(async (externalTeams: SelectedExternalTeam[]): Promise<CreateTeamOutcome | null> => {
    if (creatingTeam.current) return null;

    if (!currentUser?.id) {
      setError("Сначала войдите в профиль.");
      return null;
    }

    if (!createName.trim()) {
      setError("Введите название команды.");
      return null;
    }

    creatingTeam.current = true;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const created = await createTeam(
        {
          name: createName.trim(),
          visibility: createPublic ? TeamVisibility.Public : TeamVisibility.Private,
        },
        currentUser.id,
      );
      const linked: SelectedExternalTeam[] = [];
      const failed: SelectedExternalTeam[] = [];
      for (const externalTeam of externalTeams) {
        try {
          const link = await createTeamExternalLeagueLink(created.id, {
            provider: externalTeam.provider,
            externalTeamId: externalTeam.externalTeamId,
            isPrimary: externalTeam.isPrimary,
          });
          await syncTeamExternalLeagueLink(created.id, link.id);
          linked.push(externalTeam);
        } catch {
          failed.push(externalTeam);
        }
      }
      setCreateName("");
      setMessage(failed.length > 0
        ? "Команда создана, но часть привязок лиги не удалось добавить."
        : `Команда "${created.name}" создана и добавлена в "Мои команды".`);
      setActiveTab("my");
      await reloadTeams();
      return { team: created, linked, failed };
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось создать команду.");
      return null;
    } finally {
      creatingTeam.current = false;
      setLoading(false);
    }
  }, [createName, createPublic, currentUser?.id, reloadTeams]);

  const joinByCode = useCallback(async () => {
    if (!currentUser?.id) {
      setError("Сначала войдите в профиль.");
      return;
    }

    if (!joinCode.trim()) {
      setError("Введите код приглашения.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const joined = await joinTeamByCode({ code: joinCode.trim(), teamJerseyNumber: joinTeamNumber === "" ? null : Number(joinTeamNumber) }, currentUser.id);
      setJoinCode("");
      setJoinTeamNumber("");
      setMessage(`Вы вступили в команду "${joined.name}".`);
      setActiveTab("my");
      await reloadTeams();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось вступить в команду.");
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, joinCode, joinTeamNumber, reloadTeams]);

  const joinSelectedPublicTeam = useCallback(async () => {
    if (!currentUser?.id || !selectedPublicTeam) {
      return;
    }

    setJoining(true);
    setError(null);
    setMessage(null);
    try {
      await joinPublicTeam(selectedPublicTeam.id, currentUser.id);
      setMessage(`Вы вступили в команду "${selectedPublicTeam.name}".`);
      setSelectedPublicTeam(null);
      setActiveTab("my");
      await reloadTeams();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось вступить в команду.");
    } finally {
      setJoining(false);
    }
  }, [currentUser?.id, reloadTeams, selectedPublicTeam]);

  return {
    activeTab,
    apiUnavailable,
    availablePublicTeams,
    closeTeamManagement,
    createName,
    createNewTeam,
    createPublic,
    error,
    joinByCode,
    joining,
    joinCode,
    joinTeamNumber,
    joinSelectedPublicTeam,
    loading,
    loaded,
    managedTeam,
    memberSavingId,
    membersLoading,
    message,
    myTeams: sortedMyTeams,
    openTeamManagement,
    reloadTeams,
    saveTeamMember,
    selectedPublicTeam,
    setActiveTab,
    setCreateName,
    setCreatePublic,
    setError,
    setJoinCode,
    setJoinTeamNumber,
    setMessage,
    setSelectedPublicTeam,
    teamMembers,
    pinnedTeamIds,
    togglePinnedTeam,
  };
}
