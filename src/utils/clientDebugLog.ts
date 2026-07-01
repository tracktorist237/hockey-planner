const DEBUG_LOG_KEY = "hpClientDebugLog";
const MAX_DEBUG_EVENTS = 200;

type DebugDetails = Record<string, unknown>;

const SECRET_KEY_PATTERN = /(token|jwt|auth|password|cookie|authorization|refresh|access)/i;

const safeString = (value: unknown): string => {
  if (value instanceof Error) {
    return `${value.name}: ${value.message}`;
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const sanitizeDetails = (details?: DebugDetails): DebugDetails | undefined => {
  if (!details) {
    return undefined;
  }

  return Object.entries(details).reduce<DebugDetails>((acc, [key, value]) => {
    if (SECRET_KEY_PATTERN.test(key)) {
      acc[key] = "[redacted]";
      return acc;
    }

    if (value instanceof Error) {
      acc[key] = {
        name: value.name,
        message: value.message,
        stack: value.stack ? value.stack.slice(0, 1800) : undefined,
      };
      return acc;
    }

    if (typeof value === "string") {
      acc[key] = SECRET_KEY_PATTERN.test(value) ? "[redacted]" : value.slice(0, 1800);
      return acc;
    }

    acc[key] = value;
    return acc;
  }, {});
};

export function readClientDebugLog(): unknown[] {
  try {
    const raw = window.localStorage.getItem(DEBUG_LOG_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeClientDebugEvent(event: string, details?: DebugDetails): void {
  try {
    const current = readClientDebugLog();
    current.push({
      ts: new Date().toISOString(),
      event,
      path: window.location.pathname,
      details: sanitizeDetails(details),
    });
    window.localStorage.setItem(DEBUG_LOG_KEY, JSON.stringify(current.slice(-MAX_DEBUG_EVENTS)));
  } catch {
    // Diagnostics must never break the app.
  }
}

export function installClientDebugLog(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.addEventListener("error", (event) => {
    writeClientDebugEvent("window.error", {
      message: event.message,
      source: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    writeClientDebugEvent("window.unhandledrejection", {
      reason: safeString(event.reason).slice(0, 1800),
      stack: event.reason && event.reason.stack ? String(event.reason.stack).slice(0, 1800) : undefined,
    });
  });

  writeClientDebugEvent("app.debugLogInstalled", {
    userAgent: navigator.userAgent,
    serviceWorkerSupported: "serviceWorker" in navigator,
    notificationSupported: "Notification" in window,
    pushManagerSupported: "PushManager" in window,
  });
}
