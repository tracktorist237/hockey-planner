import { useEffect, useMemo, useState } from "react";
import { createEventGuest, updateAttendance, updateEventGuestAttendance } from "src/api/events";
import { getEventGoalies } from "src/api/goalies";
import { getMyTeams } from "src/api/teams";
import { getUsers } from "src/api/users";
import { EventTableProtocolsPanel } from "src/components/EventTableProtocolsPanel";
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
import { AttendanceLookUpDto } from "src/types/events";
import { useSwipeTabs } from "src/hooks/useSwipeTabs";

const GOALIE_POSITION = 1;
type EventTab = "attendance" | "roster" | "goalies";
const eventTabs: readonly EventTab[] = ["attendance", "roster", "goalies"];

export function EventPage({ eventId, onBack, currentUser }: EventPageProps) {
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<EventTab>("attendance");
  const eventTabsSwipeHandlers = useSwipeTabs({ tabs: eventTabs, activeTab, onChange: setActiveTab });
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});
  const [manageableTeamIds, setManageableTeamIds] = useState<Set<string>>(new Set());
  const [eventTeamJerseyNumber, setEventTeamJerseyNumber] = useState<number | null>(null);
  const [resolvedCurrentUserPosition, setResolvedCurrentUserPosition] = useState<number | null | undefined>(undefined);
  const [resolvedGoalieStatus, setResolvedGoalieStatus] = useState<boolean | undefined>(undefined);
  const selectedUserId = useMemo(() => currentUser?.id ?? null, [currentUser?.id]);
  const currentUserPrimaryPosition = currentUser?.primaryPosition ?? resolvedCurrentUserPosition;
  const { event, loading, error, copySuccess, copyEventLink, reloadEvent, setError } = useEventData(eventId);

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "roster" || tab === "goalies" || tab === "attendance") {
      setActiveTab(tab);
    }
  }, [eventId]);
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

  const handleManagedAttendanceStatus = async (attendanceItem: AttendanceLookUpDto, status: number, notes?: string | null) => {
    if (!event || !selectedUserId) {
      return;
    }

    try {
      if (attendanceItem.isGuest) {
        await updateEventGuestAttendance(event.id, attendanceItem.userId, status, notes, selectedUserId);
      } else {
        if (!canManageEvent) {
          return;
        }
        await updateAttendance(event.id, attendanceItem.userId, status, notes, selectedUserId);
      }
      await reloadEvent();
    } catch (err) {
      reportError(err instanceof Error ? err.message : "Ошибка обновления явки");
    }
  };

  const handleAddGuest = async (guest: { firstName: string; lastName: string; handedness?: number | null; jerseyNumber?: number | null }) => {
    if (!event || !selectedUserId) {
      throw new Error("Необходимо авторизоваться");
    }

    await createEventGuest(event.id, guest, selectedUserId);
    await reloadEvent();
  };

  const attendance = useAttendance({ event, selectedUserId, reloadEvent, onError: reportError });
  const lineManagement = useLineManagement({ event, currentUserId: selectedUserId, reloadEvent, onError: reportError });
  const playerModal = usePlayerModal({ onError: reportError, currentUserId: selectedUserId, teamId: event?.teamId });
  const currentEventJerseyNumber = event?.attendances?.find((item) => item.userId === selectedUserId)?.jerseyNumber ?? eventTeamJerseyNumber;
  const handleOpenEventPlayerInfo = (userId: string) => {
    const attendanceNumber = event?.attendances?.find((item) => item.userId === userId)?.jerseyNumber;
    const rosterNumber = event?.roster?.flatMap((line) => line.members ?? []).find((member) => member.userId === userId)?.jerseyNumber;
    return playerModal.handleOpenPlayerInfo(userId, attendanceNumber ?? rosterNumber);
  };

  useEffect(() => {
    if (!currentUser?.id) {
      setManageableTeamIds(new Set());
      setEventTeamJerseyNumber(null);
      return;
    }

    void getMyTeams(currentUser.id)
      .then((teams) => {
        setManageableTeamIds(new Set(teams.filter((team) => team.myRole === 1 || team.myRole === 2).map((team) => team.id)));
        setEventTeamJerseyNumber(teams.find((team) => team.id === event?.teamId)?.myTeamJerseyNumber ?? null);
      })
      .catch(() => {
        setManageableTeamIds(new Set());
        setEventTeamJerseyNumber(null);
      });
  }, [currentUser?.id, event?.teamId]);

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
        if (attendanceItem.isGuest) {
          return;
        }
        userIds.add(attendanceItem.userId);
        if (attendanceItem.photoUrl) {
          knownPhotos[attendanceItem.userId] = attendanceItem.photoUrl;
        }
      });

      event.roster?.forEach((line) => {
        line.members?.forEach((member) => {
          if (member.isGuest) {
            return;
          }
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
      <div
        style={{
          background: "color-mix(in srgb, var(--hp-surface) 96%, transparent)",
          padding: "8px 12px",
          borderBottom: "1px solid var(--hp-border)",
          boxShadow: "var(--hp-shadow-sm)",
          backdropFilter: "blur(10px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ width: "100%", maxWidth: "600px", margin: "0 auto", display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            onClick={onBack}
            aria-label="Назад"
            style={{ width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--hp-border)", background: "var(--hp-surface-soft)", color: "var(--hp-heading)", fontSize: "19px", cursor: "pointer", borderRadius: "12px", padding: 0, flexShrink: 0, transition: "all 0.2s ease" }}
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
          <div style={{ flex: 1, minWidth: 0 }}>
            <CurrentPlayerHeader compact jerseyNumberOverride={currentEventJerseyNumber} />
          </div>
        </div>
      </div>

      <div style={{ padding: "16px", paddingBottom: "100px", overflowX: "clip" }}>
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

        <section
          {...eventTabsSwipeHandlers}
          style={{
            marginBottom: "20px",
            border: "1px solid var(--hp-border)",
            borderRadius: "16px",
            backgroundColor: "var(--hp-surface)",
            boxShadow: "var(--hp-shadow-sm)",
            overflow: "hidden",
            touchAction: "pan-y",
          }}
        >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "5px", padding: "5px", backgroundColor: "var(--hp-surface-muted)", borderBottom: "1px solid var(--hp-border)" }}>
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
                border: "none",
                backgroundColor: activeTab === tab ? "var(--hp-surface)" : "transparent",
                color: activeTab === tab ? "var(--hp-primary-text)" : "var(--hp-muted)",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: activeTab === tab ? "0 2px 8px rgba(15, 23, 42, 0.10)" : "none",
                transform: activeTab === tab ? "scale(1)" : "scale(0.985)",
                transition: "background-color 220ms cubic-bezier(0.22, 1, 0.36, 1), color 180ms ease, border-color 220ms ease, box-shadow 220ms ease, transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div data-swipe-tabs-content style={{ minWidth: 0 }}>
        {activeTab === "attendance" && (
          <AttendanceList
            attendances={playerAttendances}
            onPlayerClick={handleOpenEventPlayerInfo}
            avatarUrls={avatarUrls}
            eventCreatedAt={event.createdAt}
            canManage={canManageEvent}
            currentUserId={selectedUserId}
            onStatusChange={handleManagedAttendanceStatus}
            onAddGuest={handleAddGuest}
            embedded
          />
        )}
        {activeTab === "roster" && (
          <RosterManager
            canManage={canManageEvent}
            {...lineManagement}
            onPlayerClick={handleOpenEventPlayerInfo}
            avatarUrls={avatarUrls}
            eventType={event.type}
            teamId={event.teamId}
            attendances={event.attendances}
            embedded
          />
        )}
        {activeTab === "goalies" && <GoaliesPanel eventId={event.id} currentUserId={selectedUserId} embedded />}
        </div>
        </section>
        <EventTableProtocolsPanel
          eventId={event.id}
          teamId={event.teamId}
          currentUserId={selectedUserId}
          canManage={canManageEvent}
          onError={reportError}
        />
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
        @supports (padding: max(0px)) { div[style*="position: sticky"] { padding-top: max(8px, env(safe-area-inset-top, 8px)); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px);} to { opacity: 1; transform: translateY(0);} }
      `}</style>
    </div>
  );
}

export default EventPage;
