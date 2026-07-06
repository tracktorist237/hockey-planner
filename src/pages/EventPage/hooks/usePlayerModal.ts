import { useCallback, useState } from "react";
import { getUserById } from "src/api/users";
import { PlayerDetails } from "src/pages/EventPage/types";

interface UsePlayerModalOptions {
  onError?: (message: string) => void;
  currentUserId?: string | null;
  teamId?: string | null;
}

interface UsePlayerModalResult {
  selectedPlayer: PlayerDetails | null;
  isPlayerModalOpen: boolean;
  loadingPlayer: boolean;
  handleOpenPlayerInfo: (userId: string, jerseyNumberOverride?: number | null) => Promise<void>;
  handleCloseModal: () => void;
}

export const usePlayerModal = ({ onError, currentUserId, teamId }: UsePlayerModalOptions = {}): UsePlayerModalResult => {
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerDetails | null>(null);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [loadingPlayer, setLoadingPlayer] = useState(false);

  const handleOpenPlayerInfo = useCallback(
    async (userId: string, jerseyNumberOverride?: number | null) => {
      setLoadingPlayer(true);

      try {
        const playerData = await getUserById(userId, { currentUserId, teamId });
        setSelectedPlayer({
          ...playerData,
          jerseyNumber: jerseyNumberOverride ?? playerData.jerseyNumber,
        });
        setIsPlayerModalOpen(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Не удалось загрузить данные игрока";
        onError?.(message);
      } finally {
        setLoadingPlayer(false);
      }
    },
    [currentUserId, onError, teamId],
  );

  const handleCloseModal = useCallback(() => {
    setIsPlayerModalOpen(false);
  }, []);

  return {
    selectedPlayer,
    isPlayerModalOpen,
    loadingPlayer,
    handleOpenPlayerInfo,
    handleCloseModal,
  };
};
