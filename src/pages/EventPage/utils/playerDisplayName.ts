interface PlayerName {
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
}

const normalizeLastName = (lastName?: string | null): string => lastName?.trim().toLocaleLowerCase("ru") ?? "";

export const findDuplicateLastNames = (players?: PlayerName[] | null): Set<string> => {
  const userIdsByLastName = new Map<string, Set<string>>();

  players?.forEach((player) => {
    const lastName = normalizeLastName(player.lastName);
    if (!lastName) return;

    const userIds = userIdsByLastName.get(lastName) ?? new Set<string>();
    userIds.add(player.userId);
    userIdsByLastName.set(lastName, userIds);
  });

  return new Set(
    Array.from(userIdsByLastName.entries())
      .filter(([, userIds]) => userIds.size > 1)
      .map(([lastName]) => lastName),
  );
};

export const getRosterPlayerName = (player: PlayerName, duplicateLastNames: Set<string>): string => {
  const lastName = player.lastName?.trim() || "—";
  const firstNameInitial = player.firstName?.trim().charAt(0);

  if (!duplicateLastNames.has(normalizeLastName(player.lastName)) || !firstNameInitial) {
    return lastName;
  }

  return `${firstNameInitial.toLocaleUpperCase("ru")}. ${lastName}`;
};
