import { useEffect, useState } from "react";
import { APP_VERSION, BUILD_TIME, ENVIRONMENT } from "src/config/version";

type LogLevel = "log" | "info" | "warn" | "error";

interface DebugLogEntry {
  id: number;
  level: LogLevel;
  timestamp: string;
  message: string;
}

interface NetworkLogEntry {
  id: number;
  timestamp: string;
  method: string;
  url: string;
  status?: number;
  durationMs?: number;
  ok: boolean;
  source: "fetch" | "xhr";
  error?: string;
}

interface DebugOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DebugOverlay({ isOpen, onClose }: DebugOverlayProps) {
  const [debugLogs, setDebugLogs] = useState<DebugLogEntry[]>([]);
  const [networkLogs, setNetworkLogs] = useState<NetworkLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"console" | "network">("console");
  const [panelWidth, setPanelWidth] = useState(520);
  const [panelPosition, setPanelPosition] = useState({ x: 12, y: 12 });

  useEffect(() => {
    let nextId = 1;
    let nextNetworkId = 1;
    const originals = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      fetch: window.fetch,
      xhrOpen: XMLHttpRequest.prototype.open,
      xhrSend: XMLHttpRequest.prototype.send,
    };

    const appendLog = (level: LogLevel, args: unknown[]) => {
      const messageText = args
        .map((arg) => {
          if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
          if (typeof arg === "string") return arg;
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        })
        .join(" ");

      setDebugLogs((previous) => {
        const next = [
          ...previous,
          {
            id: nextId++,
            level,
            timestamp: new Date().toLocaleTimeString("ru-RU"),
            message: messageText,
          },
        ];
        return next.length > 300 ? next.slice(next.length - 300) : next;
      });
    };

    const appendNetworkLog = (entry: Omit<NetworkLogEntry, "id" | "timestamp">) => {
      setNetworkLogs((previous) => {
        const next = [
          ...previous,
          {
            id: nextNetworkId++,
            timestamp: new Date().toLocaleTimeString("ru-RU"),
            ...entry,
          },
        ];
        return next.length > 300 ? next.slice(next.length - 300) : next;
      });
    };

    console.log = (...args: unknown[]) => {
      appendLog("log", args);
      originals.log(...args);
    };
    console.info = (...args: unknown[]) => {
      appendLog("info", args);
      originals.info(...args);
    };
    console.warn = (...args: unknown[]) => {
      appendLog("warn", args);
      originals.warn(...args);
    };
    console.error = (...args: unknown[]) => {
      appendLog("error", args);
      originals.error(...args);
    };

    window.fetch = async (...args) => {
      const startedAt = performance.now();
      const input = args[0];
      const init = args[1];
      const method = init?.method ?? "GET";
      const url = typeof input === "string" ? input : input instanceof Request ? input.url : "unknown";

      try {
        const response = await originals.fetch.call(window, ...args);
        appendNetworkLog({
          source: "fetch",
          method,
          url,
          status: response.status,
          ok: response.ok,
          durationMs: Math.round(performance.now() - startedAt),
        });
        return response;
      } catch (error) {
        appendNetworkLog({
          source: "fetch",
          method,
          url,
          ok: false,
          durationMs: Math.round(performance.now() - startedAt),
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    };

    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      async?: boolean,
      username?: string | null,
      password?: string | null,
    ) {
      (this as XMLHttpRequest & { __debugMethod?: string; __debugUrl?: string }).__debugMethod = method;
      (this as XMLHttpRequest & { __debugMethod?: string; __debugUrl?: string }).__debugUrl = String(url);
      return originals.xhrOpen.call(this, method, url, async ?? true, username ?? null, password ?? null);
    };

    XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
      const startedAt = performance.now();
      const xhr = this as XMLHttpRequest & { __debugMethod?: string; __debugUrl?: string };
      const method = xhr.__debugMethod ?? "GET";
      const url = xhr.__debugUrl ?? "unknown";

      const onLoadEnd = () => {
        appendNetworkLog({
          source: "xhr",
          method,
          url,
          status: xhr.status,
          ok: xhr.status >= 200 && xhr.status < 400,
          durationMs: Math.round(performance.now() - startedAt),
        });
      };

      const onError = () => {
        appendNetworkLog({
          source: "xhr",
          method,
          url,
          ok: false,
          durationMs: Math.round(performance.now() - startedAt),
          error: "Network error",
        });
      };

      xhr.addEventListener("loadend", onLoadEnd, { once: true });
      xhr.addEventListener("error", onError, { once: true });

      return originals.xhrSend.call(this, body as XMLHttpRequestBodyInit | null | undefined);
    };

    const handleError = (event: ErrorEvent) => {
      appendLog("error", [`[window.error] ${event.message}`]);
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      appendLog("error", [`[unhandledrejection] ${String(event.reason)}`]);
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      console.log = originals.log;
      console.info = originals.info;
      console.warn = originals.warn;
      console.error = originals.error;
      window.fetch = originals.fetch;
      XMLHttpRequest.prototype.open = originals.xhrOpen;
      XMLHttpRequest.prototype.send = originals.xhrSend;
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  if (!isOpen) {
    return null;
  }

  const startDrag = (clientX: number, clientY: number) => {
    const startX = clientX;
    const startY = clientY;
    const initialX = panelPosition.x;
    const initialY = panelPosition.y;

    const move = (nextClientX: number, nextClientY: number) => {
      const maxX = Math.max(0, window.innerWidth - Math.min(panelWidth, window.innerWidth * 0.96) - 12);
      const maxY = Math.max(0, window.innerHeight - 240);
      const nextX = Math.min(Math.max(12, initialX + (startX - nextClientX)), maxX);
      const nextY = Math.min(Math.max(12, initialY + (startY - nextClientY)), maxY);
      setPanelPosition({ x: nextX, y: nextY });
    };

    const onMouseMove = (event: MouseEvent) => move(event.clientX, event.clientY);
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      move(touch.clientX, touch.clientY);
    };
    const endDrag = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", endDrag);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", endDrag);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", endDrag);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", endDrag);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        pointerEvents: "none",
      }}
    >
      <div style={{ width: `min(${panelWidth}px, 96vw)`, maxHeight: "92vh", backgroundColor: "rgba(10,10,10,0.94)", color: "#e0e0e0", border: "1px solid #333", borderRadius: "12px", overflow: "hidden", boxShadow: "0 12px 30px rgba(0,0,0,0.45)", pointerEvents: "auto", display: "flex", flexDirection: "column", position: "absolute", right: panelPosition.x, bottom: panelPosition.y }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid #333", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
          <div style={{ fontWeight: 700, fontSize: "14px" }}>Developer Debug Panel</div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => {
                setDebugLogs([]);
                setNetworkLogs([]);
              }}
              style={{ border: "1px solid #555", background: "#1f1f1f", color: "#ddd", borderRadius: "8px", padding: "8px 10px", fontSize: "12px", cursor: "pointer" }}
            >
              Очистить логи
            </button>
            <button
              onClick={onClose}
              style={{ border: "1px solid #777", background: "#2a2a2a", color: "white", borderRadius: "8px", padding: "8px 10px", fontSize: "12px", cursor: "pointer" }}
            >
              Закрыть
            </button>
          </div>
        </div>

        <div style={{ padding: "10px 14px", borderBottom: "1px solid #333", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <button
            onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              if (!touch) return;
              startDrag(touch.clientX, touch.clientY);
            }}
            style={{ border: "1px solid #666", background: "#2a2a2a", color: "#ddd", borderRadius: "8px", padding: "6px 10px", cursor: "grab" }}
          >
            Переместить
          </button>
          <span style={{ color: "#9e9e9e" }}>Размер</span>
          <input type="range" min={340} max={900} value={panelWidth} onChange={(e) => setPanelWidth(Number(e.target.value))} />
          <span>{panelWidth}px</span>
        </div>

        <div style={{ padding: "12px 14px", borderBottom: "1px solid #333", fontSize: "12px", lineHeight: 1.6 }}>
          <div>Версия приложения: <strong>v{APP_VERSION}</strong></div>
          <div>Build time: <strong>{BUILD_TIME}</strong></div>
          <div>Environment: <strong>{ENVIRONMENT}</strong></div>
          <div>URL: <strong>{window.location.href}</strong></div>
          <div>Viewport: <strong>{window.innerWidth}x{window.innerHeight}</strong></div>
          <div>User agent: <strong>{navigator.userAgent}</strong></div>
        </div>

        <div style={{ padding: "10px 14px", fontSize: "12px", borderBottom: "1px solid #333", display: "flex", gap: "8px" }}>
          <button
            onClick={() => setActiveTab("console")}
            style={{ border: "1px solid #555", background: activeTab === "console" ? "#263238" : "#1f1f1f", color: "#ddd", borderRadius: "8px", padding: "6px 10px", cursor: "pointer" }}
          >
            Console ({debugLogs.length})
          </button>
          <button
            onClick={() => setActiveTab("network")}
            style={{ border: "1px solid #555", background: activeTab === "network" ? "#263238" : "#1f1f1f", color: "#ddd", borderRadius: "8px", padding: "6px 10px", cursor: "pointer" }}
          >
            Network ({networkLogs.length})
          </button>
        </div>
        <div style={{ overflow: "auto", flex: 1, padding: "10px 14px", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace", fontSize: "12px", height: 540 }}>
          {activeTab === "console" ? (
            debugLogs.length === 0 ? (
              <div style={{ color: "#9e9e9e" }}>Логов пока нет. Выполните действие в приложении.</div>
            ) : (
              debugLogs.map((entry) => (
                <div key={entry.id} style={{ padding: "6px 0", borderBottom: "1px dashed #2f2f2f", color: entry.level === "error" ? "#ef9a9a" : entry.level === "warn" ? "#ffe082" : entry.level === "info" ? "#90caf9" : "#cfd8dc" }}>
                  [{entry.timestamp}] [{entry.level.toUpperCase()}] {entry.message}
                </div>
              ))
            )
          ) : networkLogs.length === 0 ? (
            <div style={{ color: "#9e9e9e" }}>Сетевых запросов пока нет.</div>
          ) : (
            networkLogs.map((entry) => (
              <div key={entry.id} style={{ padding: "6px 0", borderBottom: "1px dashed #2f2f2f", color: entry.ok ? "#cfd8dc" : "#ef9a9a" }}>
                [{entry.timestamp}] [{entry.source.toUpperCase()}] {entry.method} {entry.url} {entry.status ? `→ ${entry.status}` : ""} {entry.durationMs !== undefined ? `(${entry.durationMs}ms)` : ""} {entry.error ? `| ${entry.error}` : ""}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
