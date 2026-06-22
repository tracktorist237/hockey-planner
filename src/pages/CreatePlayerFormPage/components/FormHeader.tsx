import { InternalPageHeader } from "src/components/InternalPageHeader";

interface FormHeaderProps {
  onBack: () => void;
  title?: string;
  subtitle?: string;
}

export function FormHeader({
  onBack,
  title = "Создание анкеты игрока",
  subtitle = "Заполните информацию о себе",
}: FormHeaderProps) {
  return <InternalPageHeader title={title} subtitle={subtitle} onBack={onBack} position="static" marginBottom={20} fullBleedInset={16} />;
}
