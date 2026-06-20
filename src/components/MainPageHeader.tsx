import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GlobalSearchDialog } from "src/components/GlobalSearchDialog";
import { NotificationBell } from "src/components/NotificationBell";
import { PlayerAvatar } from "src/components/PlayerAvatar";
import { useAuth } from "src/hooks/useAuth";
import { getRoleColor } from "src/utils/colors";

interface MainPageHeaderProps {
  title: string;
}

export function MainPageHeader({ title }: MainPageHeaderProps) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <header style={{ position: "sticky", top: 0, zIndex: 180, width: "100%", padding: "8px 12px", background: "color-mix(in srgb, var(--hp-surface) 96%, transparent)", borderBottom: "1px solid var(--hp-border)", boxShadow: "var(--hp-shadow-sm)", backdropFilter: "blur(10px)", boxSizing: "border-box" }}>
        <h1 style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 }}>{title}</h1>
        <div style={{ width: "100%", maxWidth: 600, margin: "0 auto", display: "grid", gridTemplateColumns: "40px minmax(0, 1fr) 40px", alignItems: "center", gap: 9 }}>
          <button
            type="button"
            onClick={() => navigate("/profile")}
            aria-label="Открыть профиль"
            title="Профиль"
            style={{ width: 40, height: 40, padding: 0, border: "1px solid var(--hp-border)", borderRadius: 13, background: "var(--hp-surface-soft)", cursor: "pointer", display: "grid", placeItems: "center", boxShadow: currentUser ? `0 2px 7px ${getRoleColor(currentUser.role)}30` : "none" }}
          >
            <PlayerAvatar
              size={36}
              shape="rounded"
              photoUrl={currentUser?.photoUrl}
              jerseyNumber={currentUser?.jerseyNumber}
              fallbackBg={currentUser ? getRoleColor(currentUser.role) : "var(--hp-muted)"}
              fontSize={13}
              badgeSizePx={15}
              badgeFontSizePx={8}
            />
          </button>

          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            aria-label={`Открыть поиск. Текущий раздел: ${title}`}
            style={{ minWidth: 0, height: 40, padding: "0 13px", border: "1px solid var(--hp-border)", borderRadius: 14, background: "var(--hp-input-bg)", color: "var(--hp-muted)", display: "flex", alignItems: "center", gap: 8, cursor: "text", textAlign: "left" }}
          >
            <span aria-hidden="true" style={{ fontSize: 17, lineHeight: 1 }}>⌕</span>
            <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 14 }}>Поиск</span>
          </button>

          <NotificationBell currentUserId={currentUser?.id} />
        </div>
      </header>

      <GlobalSearchDialog isOpen={isSearchOpen} currentUserId={currentUser?.id ?? null} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
