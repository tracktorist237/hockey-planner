import { buildApiUrl } from "src/api/client";

export interface InstructionListItemDto {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
  publishedAt?: string | null;
}

export interface InstructionArticleDto extends InstructionListItemDto {
  content: string;
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string | null;
  createdByUserId?: string | null;
}

export interface CreateUpdateInstructionArticleRequest {
  slug: string;
  title: string;
  summary?: string | null;
  content: string;
  imageUrl?: string | null;
  isPublished: boolean;
  sortOrder: number;
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

const requireJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as T;
};

export async function getInstructions(): Promise<InstructionListItemDto[]> {
  return requireJson(await fetch(buildApiUrl("/api/instructions"), { credentials: "include" }));
}

export async function getInstruction(slug: string): Promise<InstructionArticleDto> {
  return requireJson(await fetch(buildApiUrl(`/api/instructions/${encodeURIComponent(slug)}`), { credentials: "include" }));
}
