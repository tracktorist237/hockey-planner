import { apiGet } from "src/api/client";

export interface VersionInfo {
  version: string;
  environment: string;
  commit?: string | null;
  buildTime?: string | null;
  timestamp: string;
}

export const getVersionInfo = async (): Promise<VersionInfo> => {
  return apiGet<VersionInfo>("/version");
};
