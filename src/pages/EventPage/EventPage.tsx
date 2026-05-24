import { useEffect, useMemo, useState } from "react";
import { updateAttendance } from "src/api/events";
import { getEventGoalies } from "src/api/goalies";
import { getMyTeams } from "src/api/teams";
import { getUsers } from "src/api/users";
import { LoadingIndicator } from "src/components/LoadingIndicator";
import { CurrentPlayerHeader } from "src/CurrentPlayerHeader";
import { ActionMenu } from "src/pages/EventPage/components/ActionMenu";
import { AttendanceList } from "src/pages/EventPage/components/AttendanceList";
import { AttendanceResponseCard } from "src/pages/EventPage/components/AttendanceResponseCard";
import { EventAdditionalInfo } from "src/pages/EventPage/components/EventAdditionalInfo";
import { EventInfoCard } from "src/pages/EventPage/components/EventInfoCard";
import { GoaliesPanel } from "src/pages/EventPage/components/GoaliesPanel";
import { GoalieResponseCard } from "src/pages/EventPage/components/GoalieResponseCard";
import { ErrorState, LoadingState, NotFoundState } from "src/pages/EventPage/components/PageState";
import { PlayerInfoModal } from "src/pages/EventPage/components/PlayerInfoModal";
import { RosterManager } from "src/pages/EventPage/components/RosterManager";
import { useAttendance } from "src/pages/EventPage/hooks/useAttendance";
import { useEventData } from "src/pages/EventPage/hooks/useEventData";
import { useLineManagement } from "src/pages/EventPage/hooks/useLineManagement";
import { usePlayerModal } from "src/pages/EventPage/hooks/usePlayerModal";
import { EventPageProps } from "src/pages/EventPage/types";

const GOALIE_POSITION = 1;

export function EventPage({ eventId, onBack, currentUser }: EventPageProps) {
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"attendance" | "roster" | "goalies">("attendance");
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});
  const [manageableTeamIds, setManageableTeamIds] = useState<Set<string>>(new Set());
  const [resolvedCurrentUserPosition, setResolvedCurrentUserPosition] = useState<number | null | undefined>(undefined);
  const [resolvedGoalieStatus, setResolvedGoalieStatus] = useState<boolean | undefined>(undefined);
  const selectedUserId = useMemo(() => currentUser?.id ?? null, [currentUser?.id]);
  const currentUserPrimaryPosition = currentUser?.primaryPosition ?? resolvedCurrentUserPosition;
  const { event, loading, error, copySuccess, copyEventLink, reloadEvent, setError } = useEventData(eventId);
  const canManageEvent = useMemo(
    () => Boolean(event?.teamId && manageableTeamIds.has(event.teamId)),
    [event?.teamId, manageableTeamIds],
  );
  const playerAttendances = useMemo(
    () => event?.attendances?.filter((attendanceItem) => attendanceItem.primaryPosition !== GOALIE_POSITION) ?? [],
    [event?.attendances],
  );
  const isCurrentUserGoalie = useMemo(
    () =>
      Boolean(
        selectedUserId &&
          (
            currentUser?.primaryPosition === GOALIE_POSITION ||
            resolvedCurrentUserPosition === GOALIE_POSITION ||
            resolvedGoalieStatus === true ||
            event?.attendances?.some(
              (attendanceItem) =>
                attendanceItem.userId === selectedUserId &&
                attendanceItem.primaryPosition === GOALIE_POSITION,
            )
          ),
      ),
    [currentUser?.primaryPosition, event?.attendances, resolvedCurrentUserPosition, resolvedGoalieStatus, selectedUserId],
  );

  const reportError = (message: string) => setError(message ? message : null);

  const handleManagedAttendanceStatus = async (userId: string, status: number, notes?: string | null) => {
    if (!event || !selectedUserId || !canManageEvent) {
      return;
    }

    try {
      await updateAttendance(event.id, userId, status, notes, selectedUserId);
      await reloadEvent();
    } catch (err) {
      reportError(err instanceof Error ? err.message : "Ошибка обновления явки");
    }
  };

  const attendance = useAttendance({ event, selectedUserId, reloadEvent, onError: reportError });
  const lineManagement = useLineManagement({ event, currentUserId: selectedUserId, reloadEvent, onError: reportError });
  const playerModal = usePlayerModal({ onError: reportError });

  useEffect(() => {
    if (!currentUser?.id) {
      setManageableTeamIds(new Set());
      return;
    }

    void getMyTeams(currentUser.id)
      .then((teams) => {
        setManageableTeamIds(new Set(teams.filter((team) => team.myRole === 1 || team.myRole === 2).map((team) => team.id)));
      })
      .catch(() => setManageableTeamIds(new Set()));
  }, [currentUser?.id]);

  useEffect(() => {
    if (!selectedUserId) {
      setResolvedCurrentUserPosition(null);
      return;
    }

    if (currentUser?.primaryPosition !== undefined) {
      setResolvedCurrentUserPosition(currentUser.primaryPosition ?? null);
      return;
    }

    let isMounted = true;
    setResolvedCurrentUserPosition(undefined);
    void getUsers()
      .then((users) => {
        if (!isMounted) {
          return;
        }

        setResolvedCurrentUserPosition(users.find((user) => user.id === selectedUserId)?.primaryPosition ?? null);
      })
      .catch(() => {
        if (isMounted) {
          setResolvedCurrentUserPosition(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser?.primaryPosition, selectedUserId]);

  useEffect(() => {
    if (!selectedUserId || !event?.id) {
      setResolvedGoalieStatus(false);
      return;
    }

    let isMounted = true;
    setResolvedGoalieStatus(undefined);
    void getEventGoalies(event.id, selectedUserId)
      .then((goalies) => {
        if (isMounted) {
          setResolvedGoalieStatus(goalies.isGoalie);
        }
      })
      .catch(() => {
        if (isMounted) {
          setResolvedGoalieStatus(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [event?.id, selectedUserId]);

  useEffect(() => {
    let isMounted = true;

    const loadAvatars = async () => {
      if (!event) {
        if (isMounted) {
          setAvatarUrls({});
        }
        return;
      }

      const userIds = new Set<string>();
      const knownPhotos: Record<string, string> = {};

      event.attendances?.forEach((attendanceItem) => {
        userIds.add(attendanceItem.userId);
        if (attendanceItem.photoUrl) {
          knownPhotos[attendanceItem.userId] = attendanceItem.photoUrl;
        }
      });

      event.roster?.forEach((line) => {
        line.members?.forEach((member) => {
          userIds.add(member.userId);
          if (member.photoUrl) {
            knownPhotos[member.userId] = member.photoUrl;
          }
        });
      });

      if (Object.keys(knownPhotos).length > 0 && isMounted) {
        setAvatarUrls((prev) => ({ ...prev, ...knownPhotos }));
      }

      if (userIds.size === 0) {
        return;
      }

      try {
        const users = await getUsers();
        if (!isMounted) {
          return;
        }

        const resolved: Record<string, string> = { ...knownPhotos };
        users.forEach((user) => {
          if (userIds.has(user.id) && user.photoUrl) {
            resolved[user.id] = user.photoUrl;
          }
        });

        setAvatarUrls(resolved);
      } catch (avatarError) {
        console.error("Ошибка загрузки аватаров игроков:", avatarError);
      }
    };

    void loadAvatars();

    return () => {
      isMounted = false;
    };
  }, [event]);

  if (loading) {
    return <LoadingState />;
  }

  if (error && !event) {
    return <ErrorState error={error} onBack={onBack} />;
  }

  if (!event) {
    return <NotFoundState onBack={onBack} />;
  }

  return (
    <div style={{ padding: "0", minHeight: "100vh", background: "var(--hp-bg-gradient)", color: "var(--hp-text)", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", boxSizing: "border-box" }}>
      <div style={{ backgroundColor: "var(--hp-surface)", padding: "16px", borderBottom: "1px solid var(--hp-border)", boxShadow: "var(--hp-shadow-sm)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
          <button
            onClick={onBack}
            style={{ width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--hp-border)", background: "var(--hp-surface)", fontSize: "20px", cursor: "pointer", borderRadius: "10px", marginRight: "12px", flexShrink: 0, transition: "all 0.2s ease" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--hp-surface-hover)";
              e.currentTarget.style.borderColor = "var(--hp-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--hp-surface)";
              e.currentTarget.style.borderColor = "var(--hp-border)";
            }}
          >
            ←
          </button>
          <div style={{ flex: 1 }}>
            <CurrentPlayerHeader />
          </div>
        </div>
      </div>

      <div style={{ padding: "16px", paddingBottom: "100px" }}>
        <EventInfoCard event={event} copySuccess={copySuccess} copyEventLink={copyEventLink} />

        {error && (
          <div
            style={{
              margin: "16px",
              padding: "12px 14px",
              borderRadius: "12px",
              border: "1px solid var(--hp-danger-border)",
              backgroundColor: "var(--hp-danger-soft)",
              color: "var(--hp-danger)",
              fontSize: "14px",
              fontWeight: 800,
            }}
          >
            {error}
          </div>
        )}
        <ActionMenu
          eventId={event.id}
          isOpen={isActionsOpen}
          onToggle={() => setIsActionsOpen((prev) => !prev)}
          canManage={canManageEvent}
        />
        <EventAdditionalInfo event={event} />
        {currentUserPrimaryPosition === undefined || resolvedGoalieStatus === undefined ? (
          <div style={{ backgroundColor: "var(--hp-surface)", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "var(--hp-shadow-sm)", color: "var(--hp-muted)" }}>
            <LoadingIndicator text="Загружаем профиль игрока..." />
          </div>
        ) : !isCurrentUserGoalie ? (
          <AttendanceResponseCard {...attendance} />
        ) : (
          <GoalieResponseCard eventId={event.id} currentUserId={selectedUserId} />
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "16px" }}>
          {[
            ["attendance", "Явка"],
            ["roster", "Состав"],
            ["goalies", "Вратари"],
          ].map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab as typeof activeTab)}
              style={{
                padding: "12px 8px",
                borderRadius: "12px",
                border: activeTab === tab ? "1px solid var(--hp-primary)" : "1px solid var(--hp-border)",
                backgroundColor: activeTab === tab ? "var(--hp-primary-soft)" : "var(--hp-surface)",
                color: activeTab === tab ? "var(--hp-primary-text)" : "var(--hp-muted)",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "attendance" && (
          <AttendanceList
            attendances={playerAttendances}
            onPlayerClick={playerModal.handleOpenPlayerInfo}
            avatarUrls={avatarUrls}
            eventCreatedAt={event.createdAt}
            canManage={canManageEvent}
            onStatusChange={handleManagedAttendanceStatus}
          />
        )}
        {activeTab === "roster" && (
          <RosterManager
            canManage={canManageEvent}
            {...lineManagement}
            onPlayerClick={playerModal.handleOpenPlayerInfo}
            avatarUrls={avatarUrls}
            eventType={event.type}
            teamId={event.teamId}
          />
        )}
        {activeTab === "goalies" && <GoaliesPanel eventId={event.id} currentUserId={selectedUserId} />}
      </div>

      <PlayerInfoModal player={playerModal.selectedPlayer} isOpen={playerModal.isPlayerModalOpen} onClose={playerModal.handleCloseModal} />

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
        button:focus, input:focus { outline: none; box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2); }
        div[style*="overflowY: auto"]::-webkit-scrollbar { width: 8px; }
        div[style*="overflowY: auto"]::-webkit-scrollbar-track { background: var(--hp-surface-muted); border-radius: 4px; }
        div[style*="overflowY: auto"]::-webkit-scrollbar-thumb { background: var(--hp-primary); border-radius: 4px; }
        div[style*="overflowY: auto"]::-webkit-scrollbar-thumb:hover { background: var(--hp-primary-hover); }
        @media (max-width: 360px) { div[style*="padding: 16px"] { padding: 12px !important; } div[style*="padding: 20px"] { padding: 16px !important; } button[style*="padding: 14px 16px"] { padding: 12px !important; font-size: 15px !important; } }
        @media (min-width: 768px) { div[style*="minHeight: 100vh"] { max-width: 600px; margin: 0 auto; border-left: 1px solid var(--hp-border); border-right: 1px solid var(--hp-border); min-height: 100vh; } }
        @supports (padding: max(0px)) { div[style*="position: sticky"] { padding-top: max(16px, env(safe-area-inset-top, 16px)); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px);} to { opacity: 1; transform: translateY(0);} }
      `}</style>
    </div>
  );
}

export default EventPage;
