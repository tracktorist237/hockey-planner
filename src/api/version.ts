import { apiGet } from "src/api/client";

export interface VersionInfo {
  version: string;
  timestamp: string;
  environment: string;
}

export const getVersionInfo = async (): Promise<VersionInfo> => {
  return apiGet<VersionInfo>("/version");
};
