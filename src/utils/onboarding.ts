import { User } from "src/types/user";

const ONBOARDING_REQUIRED_KEY = "authOnboardingRequired";
const ONBOARDING_COMPLETED_USERS_KEY = "authOnboardingCompletedUsers";

export const markOnboardingRequired = (): void => {
  localStorage.setItem(ONBOARDING_REQUIRED_KEY, "true");
};

export const clearOnboardingRequired = (): void => {
  localStorage.removeItem(ONBOARDING_REQUIRED_KEY);
};

export const isOnboardingRequired = (): boolean =>
  localStorage.getItem(ONBOARDING_REQUIRED_KEY) === "true";

const readCompletedUserIds = (): string[] => {
  const rawValue = localStorage.getItem(ONBOARDING_COMPLETED_USERS_KEY);
  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue)
      ? parsedValue.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
};

export const markOnboardingCompleted = (userId?: string | null): void => {
  if (!userId) {
    return;
  }

  const completedUserIds = new Set(readCompletedUserIds());
  completedUserIds.add(userId);
  localStorage.setItem(ONBOARDING_COMPLETED_USERS_KEY, JSON.stringify(Array.from(completedUserIds)));
  clearOnboardingRequired();
};

export const isOnboardingCompleted = (userId?: string | null): boolean =>
  Boolean(userId && readCompletedUserIds().includes(userId));

const normalizeProfileName = (value?: string | null): string =>
  value?.trim().toLowerCase() ?? "";

export const isTechnicalAuthProfile = (user: User | null): boolean =>
  Boolean(
    user &&
      normalizeProfileName(user.firstName) === "новый" &&
      normalizeProfileName(user.lastName) === "игрок",
  );

export const shouldRunOnboarding = (user: User | null): boolean => {
  if (isOnboardingCompleted(user?.id)) {
    return false;
  }

  if (isTechnicalAuthProfile(user)) {
    return true;
  }

  if (!isOnboardingRequired()) {
    return false;
  }

  if (!user) {
    return true;
  }

  markOnboardingCompleted(user.id);
  return false;
};
