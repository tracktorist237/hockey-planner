export const APP_VERSION =
  process.env.REACT_APP_VERSION ||
  (typeof window !== "undefined" && (window as any).appVersion) ||
  "0.0.0-dev";

export const BUILD_TIME =
  process.env.REACT_APP_BUILD_TIME ||
  new Date().toISOString();

export const ENVIRONMENT = process.env.NODE_ENV || "development";
