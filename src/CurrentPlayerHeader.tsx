// CurrentPlayerHeader.tsx
import { AttendanceLookUpDto } from "./types/events";

interface CurrentPlayerHeaderProps {
  attendance?: AttendanceLookUpDto | null;
  onBack: () => void;
}

export function CurrentPlayerHeader({
  attendance,
  onBack,
}: CurrentPlayerHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
      }}
    >
      <button onClick={onBack}>⬅ Назад</button>

      {attendance ? (
        <div style={{ fontWeight: "bold" }}>
          {attendance.lastName} {attendance.firstName}
          {attendance.jerseyNumber ? ` #${attendance.jerseyNumber}` : ""}
        </div>
      ) : (
        <div style={{ color: "#888" }}>Игрок не выбран</div>
      )}
    </div>
  );
}
