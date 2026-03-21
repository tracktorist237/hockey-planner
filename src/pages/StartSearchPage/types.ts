import { User } from "../../types/user";

export interface StartSearchPageProps {
  onSelect: (user: User) => void;
}
