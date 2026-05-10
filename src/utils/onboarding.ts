import { User } from "src/types/user";

const ONBOARDING_REQUIRED_KEY = "authOnboardingRequired";

export const markOnboardingRequired = (): void => {
  localStorage.setItem(ONBOARDING_REQUIRED_KEY, "true");
};

export const clearOnboardingRequired = (): void => {
  localStorage.removeItem(ONBOARDING_REQUIRED_KEY);
};

export const isOnboardingRequired = (): boolean =>
  localStorage.getItem(ONBOARDING_REQUIRED_KEY) === "true";

export const isTechnicalAuthProfile = (user: User | null): boolean =>
  Boolean(
    user &&
      user.firstName?.trim().toLowerCase() === "новый" &&
      user.lastName?.trim().toLowerCase() === "игрок",
  );

export const shouldRunOnboarding = (user: User | null): boolean =>
  isOnboardingRequired() || isTechnicalAuthProfile(user);
