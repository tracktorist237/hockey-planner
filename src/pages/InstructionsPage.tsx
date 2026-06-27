import { ReactNode, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getInstruction, getInstructions, InstructionArticleDto, InstructionListItemDto } from "src/api/instructions";
import { InternalPageHeader } from "src/components/InternalPageHeader";

const pageStyle = {
  minHeight: "100vh",
  background: "var(--hp-bg-gradient)",
  color: "var(--hp-text)",
  boxSizing: "border-box",
} as const;

const shellStyle = {
  width: "100%",
  maxWidth: 920,
  margin: "0 auto",
  padding: "14px 16px 28px",
  boxSizing: "border-box",
  display: "grid",
  gap: 14,
} as const;

const cardStyle = {
  background: "var(--hp-surface)",
  border: "1px solid var(--hp-border)",
  borderRadius: 16,
  boxShadow: "var(--hp-shadow-sm)",
  padding: 16,
  boxSizing: "border-box",
} as const;

type InstructionsLocationState = {
  from?: string;
};

const getReturnPath = (state: unknown): string => {
  const from = (state as InstructionsLocationState | null)?.from;
  return from && from.startsWith("/") && !from.startsWith("/instructions") ? from : "/login";
};

export function InstructionsListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = getReturnPath(location.state);
  const [items, setItems] = useState<InstructionListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    void getInstructions()
      .then((data) => {
        setItems(data);
        setError(null);
      })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Не удалось загрузить инструкции."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={pageStyle}>
      <InternalPageHeader
        title="Инструкции"
        subtitle="Установка, уведомления и работа с командой"
        onBack={() => navigate(returnTo, { replace: true })}
        maxWidth={920}
      />
      <div style={shellStyle}>
        {loading && <div style={cardStyle}>Загрузка...</div>}
        {error && <div style={{ ...cardStyle, color: "var(--hp-danger)", background: "var(--hp-danger-soft)", fontWeight: 800 }}>{error}</div>}

        {!loading && !error && items.length === 0 && (
          <div style={cardStyle}>Инструкции пока не опубликованы.</div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(`/instructions/${item.slug}`, { state: { from: returnTo } })}
              style={{
                ...cardStyle,
                padding: 0,
                overflow: "hidden",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt=""
                  style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover", display: "block", background: "var(--hp-surface-soft)" }}
                />
              )}
              <div style={{ padding: 16, display: "grid", gap: 8 }}>
                <strong style={{ color: "var(--hp-heading)", fontSize: 17, overflowWrap: "anywhere" }}>{item.title}</strong>
                {item.summary && <span style={{ color: "var(--hp-muted)", lineHeight: 1.4 }}>{item.summary}</span>}
                <span style={{ color: "var(--hp-primary)", fontWeight: 900 }}>Открыть</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function InstructionArticlePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams<{ slug: string }>();
  const returnTo = getReturnPath(location.state);
  const [article, setArticle] = useState<InstructionArticleDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError("Инструкция не найдена.");
      setLoading(false);
      return;
    }

    setLoading(true);
    void getInstruction(slug)
      .then((data) => {
        setArticle(data);
        setError(null);
      })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Инструкция не найдена."))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div style={pageStyle}>
      <InternalPageHeader
        title={article?.title ?? "Инструкция"}
        subtitle={article?.summary ?? "Пошаговая помощь"}
        onBack={() => navigate("/instructions", { replace: true, state: { from: returnTo } })}
        maxWidth={920}
      />
      <article style={shellStyle}>
        {loading && <div style={cardStyle}>Загрузка...</div>}
        {error && <div style={{ ...cardStyle, color: "var(--hp-danger)", background: "var(--hp-danger-soft)", fontWeight: 800 }}>{error}</div>}

        {article && (
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
            {article.imageUrl && (
              <button
                type="button"
                onClick={() => setPreviewImageUrl(article.imageUrl ?? null)}
                style={{ border: 0, padding: 0, background: "transparent", cursor: "zoom-in", width: "100%", textAlign: "left" }}
              >
                <img
                  src={article.imageUrl}
                  alt=""
                  style={{ width: "100%", maxHeight: 360, objectFit: "cover", display: "block", background: "var(--hp-surface-soft)" }}
                />
              </button>
            )}
            <div style={{ padding: 18, display: "grid", gap: 14 }}>
              <SafeInstructionContent content={article.content} />
            </div>
          </div>
        )}
      </article>

      {previewImageUrl && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewImageUrl(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(15, 23, 42, 0.86)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            boxSizing: "border-box",
          }}
        >
          <button
            type="button"
            aria-label="Закрыть"
            onClick={() => setPreviewImageUrl(null)}
            style={{
              position: "fixed",
              top: 14,
              right: 14,
              width: 42,
              height: 42,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.35)",
              background: "rgba(15, 23, 42, 0.68)",
              color: "white",
              fontSize: 24,
              lineHeight: 1,
              cursor: "pointer",
            }}
          >
            ×
          </button>
          <img
            src={previewImageUrl}
            alt=""
            onClick={(event) => event.stopPropagation()}
            style={{ maxWidth: "100%", maxHeight: "92vh", objectFit: "contain", borderRadius: 12, boxShadow: "0 24px 80px rgba(0,0,0,0.45)" }}
          />
        </div>
      )}
    </div>
  );
}

function SafeInstructionContent({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

  return (
    <div style={{ display: "grid", gap: 12, lineHeight: 1.58, color: "var(--hp-text)" }}>
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}

function renderBlock(block: string, index: number): ReactNode {
  if (block.startsWith("### ")) {
    return <h3 key={index} style={{ margin: "4px 0 0", color: "var(--hp-heading)", fontSize: 18 }}>{block.slice(4)}</h3>;
  }

  if (block.startsWith("## ")) {
    return <h2 key={index} style={{ margin: "6px 0 0", color: "var(--hp-heading)", fontSize: 21 }}>{block.slice(3)}</h2>;
  }

  if (block.startsWith("# ")) {
    return <h2 key={index} style={{ margin: "6px 0 0", color: "var(--hp-heading)", fontSize: 23 }}>{block.slice(2)}</h2>;
  }

  const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.every((line) => line.startsWith("- ") || line.startsWith("* "))) {
    return (
      <ul key={index} style={{ margin: 0, paddingLeft: 22 }}>
        {lines.map((line, lineIndex) => <li key={lineIndex}>{line.slice(2)}</li>)}
      </ul>
    );
  }

  return (
    <p key={index} style={{ margin: 0, whiteSpace: "pre-line", overflowWrap: "anywhere" }}>
      {block}
    </p>
  );
}
