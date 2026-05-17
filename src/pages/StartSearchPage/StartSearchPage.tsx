import { useState } from "react";
import { ContactInfo } from "../../ContactInfo";
import { UserRole } from "../../constants/roles";
import { User } from "../../types/user";
import { AddPlayerButton } from "./components/AddPlayerButton";
import { PasswordModal } from "./components/PasswordModal";
import { PlayerList } from "./components/PlayerList";
import { useUsersSearch } from "./hooks/useUsersSearch";
import { StartSearchPageProps } from "./types";

const getCurrentPassword = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear()).slice(-2);
  return `${month}${year}`;
};

const isSpecialRole = (user: User): boolean => user.role !== UserRole.Player;

export const StartSearchPage = ({ onSelect }: StartSearchPageProps) => {
  const { filteredUsers, loading, search, setSearch } = useUsersSearch();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [selectedSpecialUser, setSelectedSpecialUser] = useState<User | null>(null);

  const handleUserSelect = (user: User) => {
    if (isSpecialRole(user)) {
      setSelectedSpecialUser(user);
      setShowPasswordModal(true);
      setPasswordInput("");
      setPasswordError("");
      return;
    }

    onSelect(user);
  };

  const handlePasswordSubmit = () => {
    const correctPassword = getCurrentPassword();

    if (passwordInput === correctPassword) {
      if (selectedSpecialUser) {
        onSelect(selectedSpecialUser);
      }
      setShowPasswordModal(false);
      setPasswordError("");
      return;
    }

    setPasswordError("Неверный пароль. Попробуйте снова.");
  };

  return (
    <div
      style={{
        padding: "16px",
        minHeight: "100vh",
        background: "var(--hp-bg-gradient)",
        boxSizing: "border-box",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          textAlign: "center",
          marginBottom: "32px",
          paddingTop: "24px",
        }}
      >
        <h1
          style={{
            margin: "0 0 8px 0",
            fontSize: "28px",
            fontWeight: "700",
            color: "var(--hp-heading)",
            lineHeight: "1.2",
          }}
        >
          🏒 ХК Северная Столица
        </h1>
        <p
          style={{
            margin: "0",
            fontSize: "16px",
            color: "var(--hp-muted)",
            lineHeight: "1.4",
          }}
        >
          Найдите себя в списке или добавьте новую анкету
        </p>
      </div>

      <div
        style={{
          backgroundColor: "var(--hp-surface)",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "20px",
          boxShadow: "var(--hp-shadow-sm)",
        }}
      >
        <h2
          style={{
            margin: "0 0 16px 0",
            fontSize: "20px",
            fontWeight: "600",
            color: "var(--hp-text)",
          }}
        >
          Поиск игрока
        </h2>

        <div style={{ position: "relative", marginBottom: "16px" }}>
          <input
            placeholder="Поиск по номеру, имени или фамилии..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "16px 16px 16px 48px",
              border: "1px solid var(--hp-border)",
              borderRadius: "12px",
              fontSize: "16px",
              backgroundColor: "var(--hp-input-bg)",
              boxSizing: "border-box",
              WebkitAppearance: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "20px",
              color: "var(--hp-muted)",
            }}
          >
            🔍
          </div>
        </div>

        <PlayerList
          users={filteredUsers}
          loading={loading}
          onSelectUser={handleUserSelect}
        />

        <AddPlayerButton />
      </div>

      <PasswordModal
        isOpen={showPasswordModal}
        passwordInput={passwordInput}
        passwordError={passwordError}
        onChangePassword={setPasswordInput}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handlePasswordSubmit}
      />

      <ContactInfo />

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          input:focus {
            outline: none;
            border-color: var(--hp-primary) !important;
            box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
          }

          @media (max-width: 360px) {
            h1 {
              font-size: 24px !important;
            }

            div[style*="padding: 20px"] {
              padding: 16px !important;
            }
          }

          @media (min-width: 768px) {
            div[style*="minHeight: 100vh"] {
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 24px;
            }

            div[style*="backgroundColor: white"] {
              max-width: 500px;
              width: 100%;
              margin: 0 auto;
            }
          }
        `}
      </style>
    </div>
  );
};

export default StartSearchPage;
