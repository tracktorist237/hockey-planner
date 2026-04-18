import { useCallback, useState } from "react";
import { getUserById } from "src/api/users";
import { PlayerDetails } from "src/pages/EventPage/types";

interface UsePlayerModalOptions {
  onError?: (message: string) => void;
}

interface UsePlayerModalResult {
  selectedPlayer: PlayerDetails | null;
  isPlayerModalOpen: boolean;
  loadingPlayer: boolean;
  handleOpenPlayerInfo: (userId: string) => Promise<void>;
  handleCloseModal: () => void;
}

export const usePlayerModal = ({ onError }: UsePlayerModalOptions = {}): UsePlayerModalResult => {
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerDetails | null>(null);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [loadingPlayer, setLoadingPlayer] = useState(false);

  const handleOpenPlayerInfo = useCallback(
    async (userId: string) => {
      setLoadingPlayer(true);

      try {
        const playerData = await getUserById(userId);
        setSelectedPlayer(playerData);
        setIsPlayerModalOpen(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Не удалось загрузить данные игрока";
        onError?.(message);
      } finally {
        setLoadingPlayer(false);
      }
    },
    [onError],
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
