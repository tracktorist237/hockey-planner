import { readApiErrorMessage as readErrorMessage } from "src/api/errors";
import { authFetch } from "src/api/auth";

export interface PublicReleaseNotice {
  id: string;
  version: string;
  title: string;
  body: string;
  publishedAt?: string | null;
}


export async function getPublishedReleases(): Promise<PublicReleaseNotice[]> {
  const response = await authFetch("/api/releases");
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as PublicReleaseNotice[];
}
