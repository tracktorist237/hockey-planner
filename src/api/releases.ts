import { authFetch } from "src/api/auth";

export interface PublicReleaseNotice {
  id: string;
  version: string;
  title: string;
  body: string;
  publishedAt?: string | null;
}

const readErrorMessage = async (response: Response): Promise<string> => {
  const text = await response.text();
  if (!text) {
    return `${response.status} ${response.statusText}`;
  }

  try {
    const data = JSON.parse(text) as { message?: string; error?: string };
    return data.message ?? data.error ?? text;
  } catch {
    return text;
  }
};

export async function getPublishedReleases(): Promise<PublicReleaseNotice[]> {
  const response = await authFetch("/api/releases");
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as PublicReleaseNotice[];
}
