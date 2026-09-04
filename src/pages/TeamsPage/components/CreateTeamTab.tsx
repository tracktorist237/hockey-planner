import { FormEvent, useState } from "react";
import {
  ExternalLeagueProvider,
  ExternalTeamSearchItem,
  searchExternalLeagueTeams,
} from "src/api/externalLeagueTeams";
import { CheckboxControl } from "src/components/CheckboxControl";
import { ExternalLeagueBadge } from "src/components/ExternalLeagueBadge";
import { RadioControl } from "src/components/RadioControl";
import type { SelectedExternalTeam } from "src/pages/TeamsPage/types";
import { buttonStyle, inputStyle } from "./styles";

interface CreateTeamTabProps {
  name: string;
  isPublic: boolean;
  loading: boolean;
  onNameChange: (value: string) => void;
  onPublicChange: (value: boolean) => void;
  onCreate: (externalTeams: SelectedExternalTeam[]) => void;
}

export function CreateTeamTab({ name, isPublic, loading, onNameChange, onPublicChange, onCreate }: CreateTeamTabProps) {
  const [provider, setProvider] = useState(ExternalLeagueProvider.Spbhl);
  const [searchTitle, setSearchTitle] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [results, setResults] = useState<ExternalTeamSearchItem[]>([]);
  const [selected, setSelected] = useState<SelectedExternalTeam[]>([]);

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    const normalized = searchTitle.trim();
    if (normalized.length < 2 || normalized.length > 100) {
      setSearchError("Введите от 2 до 100 символов.");
      return;
    }

    setSearching(true);
    setSearchError(null);
    try {
      setResults(await searchExternalLeagueTeams(provider, normalized));
    } catch (requestError) {
      setSearchError(requestError instanceof Error ? requestError.message : "Не удалось найти команду.");
    } finally {
      setSearching(false);
    }
  };

  const toggleSelected = (item: ExternalTeamSearchItem) => {
    setSelected((current) => {
      const exists = current.some((value) => value.provider === item.provider && value.externalTeamId === item.externalTeamId);
      if (exists) {
        const next = current.filter((value) => value.provider !== item.provider || value.externalTeamId !== item.externalTeamId);
        if (next.length > 0 && !next.some((value) => value.isPrimary)) next[0] = { ...next[0], isPrimary: true };
        return next;
      }
      return [...current, {
        provider: item.provider,
        externalTeamId: item.externalTeamId,
        name: item.name,
        isPrimary: current.length === 0,
      }];
    });
  };

  const setPrimary = (providerValue: ExternalLeagueProvider, externalTeamId: string) => {
    setSelected((current) => current.map((value) => ({
      ...value,
      isPrimary: value.provider === providerValue && value.externalTeamId === externalTeamId,
    })));
  };

  return (
    <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
      <h2 style={{ margin: 0, fontSize: 20, color: "var(--hp-text-strong)" }}>Создать команду</h2>
      <p style={{ margin: 0, color: "var(--hp-muted)", lineHeight: 1.4 }}>
        Создавайте команду, если её ещё нет. Создатель становится владельцем.
      </p>
      <input value={name} onChange={(event) => onNameChange(event.target.value)} placeholder="Название команды" style={inputStyle} />
      <CheckboxControl checked={isPublic} onChange={onPublicChange} label="Публичная команда" />

      <section style={{ borderTop: "1px solid var(--hp-border)", paddingTop: 12, display: "grid", gap: 10 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 17, color: "var(--hp-heading)" }}>Официальная лига — необязательно</h3>
          <div style={{ color: "var(--hp-muted)", fontSize: 13, marginTop: 3 }}>Можно добавить несколько команд с сайта лиги.</div>
        </div>
        <label style={{ display: "grid", gap: 5, color: "var(--hp-muted)", fontSize: 13, fontWeight: 800 }}>
          Лига
          <select aria-label="Лига" value={provider} onChange={(event) => setProvider(Number(event.target.value) as ExternalLeagueProvider)} disabled={loading || searching} style={inputStyle}>
            <option value={ExternalLeagueProvider.Spbhl}>СПбХЛ</option>
          </select>
        </label>
        <form onSubmit={(event) => void handleSearch(event)} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <input value={searchTitle} onChange={(event) => setSearchTitle(event.target.value)} placeholder="Название команды в лиге" maxLength={100} style={{ ...inputStyle, minWidth: 0, flex: "1 1 180px" }} />
          <button type="submit" disabled={loading || searching} style={{ ...buttonStyle, width: "auto", flex: "1 1 100px" }}>{searching ? "Ищем..." : "Найти"}</button>
        </form>
        {searchError && <div role="alert" style={{ color: "var(--hp-danger)", fontSize: 14 }}>{searchError}</div>}
        <div style={{ display: "grid", gap: 8 }}>
          {results.map((item) => {
            const choice = selected.find((value) => value.provider === item.provider && value.externalTeamId === item.externalTeamId);
            return (
              <article key={`${item.provider}:${item.externalTeamId}`} style={{ border: "1px solid var(--hp-border)", borderRadius: 8, padding: 10, display: "grid", gap: 8 }}>
                <CheckboxControl
                  checked={Boolean(choice)}
                  onChange={() => toggleSelected(item)}
                  disabled={loading}
                  label={<span style={{ minWidth: 0 }}>
                    <strong style={{ display: "block", color: "var(--hp-heading)", overflowWrap: "anywhere" }}>{item.name}</strong>
                    <span style={{ display: "inline-flex", marginTop: 4, maxWidth: "100%" }}><ExternalLeagueBadge provider={item.provider} division={item.divisionName} /></span>
                  </span>}
                />
                {choice && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                    <RadioControl name="primary-external-team" checked={choice.isPrimary} onChange={() => setPrimary(choice.provider, choice.externalTeamId)} disabled={loading} label="Основная команда" />
                    <button type="button" onClick={() => onNameChange(item.name)} disabled={loading} style={{ border: 0, background: "transparent", color: "var(--hp-primary)", cursor: "pointer", fontWeight: 800 }}>Использовать название</button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <button type="button" onClick={() => onCreate(selected)} disabled={loading} style={{ ...buttonStyle, background: "#0f766e", color: "white", opacity: loading ? 0.72 : 1 }}>
        {loading ? "Создаём..." : "Создать команду"}
      </button>
    </div>
  );
}
