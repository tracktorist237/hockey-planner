interface AdaptiveFontSizeOptions {
  base: number;
  min: number;
  startShrinkAt: number;
  maxLength: number;
}

const DEFAULT_OPTIONS: AdaptiveFontSizeOptions = {
  base: 16,
  min: 11,
  startShrinkAt: 16,
  maxLength: 40,
};

export const getAdaptiveFontSize = (
  text: string | null | undefined,
  options?: Partial<AdaptiveFontSizeOptions>,
): number => {
  const normalized = (text ?? "").trim();
  const value = { ...DEFAULT_OPTIONS, ...options };

  if (!normalized) {
    return value.base;
  }

  const length = normalized.length;
  if (length <= value.startShrinkAt) {
    return value.base;
  }

  if (length >= value.maxLength) {
    return value.min;
  }

  const ratio =
    (length - value.startShrinkAt) /
    Math.max(1, value.maxLength - value.startShrinkAt);

  return Math.round((value.base - (value.base - value.min) * ratio) * 10) / 10;
};

