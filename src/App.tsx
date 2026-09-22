import { useEffect, useMemo, useState } from "react";
import type { AnimationEvent, ReactNode } from "react";
import { JsonTree } from "./components/JsonTree";
import { CopyButton } from "./components/CopyButton";
import { parseJson } from "./utils/jsonParser";
import { inferSchema, type Schema } from "./utils/schema";
import { generateFetchCode } from "./utils/fetchCodeGenerator";
import { SAMPLE_JSON } from "./utils/sampleJson";
import { generateTypeScript } from "./utils/typeScriptGenerator";

const STORAGE_KEY = "api-response-visualizer:jsonlens:last-json";
const OUTPUT_TABS = ["TYPESCRIPT", "ZOD", "FETCH()"] as const;

type OutputTab = (typeof OUTPUT_TABS)[number];
type WindowState = "open" | "closing" | "closed";

function App() {
  const [jsonInput, setJsonInput] = useState(() => {
    if (typeof localStorage === "undefined") return SAMPLE_JSON;
    return localStorage.getItem(STORAGE_KEY) ?? SAMPLE_JSON;
  });
  const [outputTab, setOutputTab] = useState<OutputTab>("TYPESCRIPT");
  const [windowState, setWindowState] = useState<WindowState>("open");

  const parsed = useMemo(() => {
    const startedAt = performance.now();
    const result = parseJson(jsonInput);

    return {
      ...result,
      elapsedMs: Math.max(1, Math.round(performance.now() - startedAt + 5)),
    };
  }, [jsonInput]);

  const schema = useMemo(
    () => (parsed.ok ? inferSchema(parsed.value) : undefined),
    [parsed],
  );
  const stats = useMemo(
    () => (parsed.ok ? getJsonStats(parsed.value) : emptyStats()),
    [parsed],
  );
  const rootTypeName = getRootTypeName(parsed);
  const typeScript = useMemo(
    () =>
      parsed.ok && schema
        ? generateMembersTypeScript(parsed.value, schema)
        : "// Paste valid JSON to generate TypeScript.",
    [parsed, schema],
  );
  const fetchCode = useMemo(
    () => generateFetchCode(rootTypeName),
    [rootTypeName],
  );
  const zodCode = useMemo(
    () => generateZodPreview(rootTypeName),
    [rootTypeName],
  );
  const displayedCode =
    outputTab === "TYPESCRIPT"
      ? typeScript
      : outputTab === "FETCH()"
        ? fetchCode
        : zodCode;
  const inferenceNotes = useMemo(
    () =>
      parsed.ok
        ? getInferenceNotes(parsed.value, stats)
        : ["Fix JSON before inference can run."],
    [parsed, stats],
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, jsonInput);
  }, [jsonInput]);

  function formatJson() {
    if (!parsed.ok) return;
    setJsonInput(JSON.stringify(parsed.value, null, 2));
  }

  function copyTypesLabel() {
    if (outputTab === "FETCH()") return "COPY FETCH";
    if (outputTab === "ZOD") return "COPY ZOD";
    return "COPY TYPES";
  }

  function closeWindow() {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setWindowState(prefersReducedMotion ? "closed" : "closing");
  }

  function handleWindowAnimationEnd(event: AnimationEvent<HTMLElement>) {
    if (event.animationName === "windowClose") {
      setWindowState("closed");
    }
  }

  const isWindowVisible = windowState !== "closed";

  return (
    <main className="app-shell">
      <LandingPage
        isActive={!isWindowVisible}
        onOpen={() => setWindowState("open")}
      />
      {isWindowVisible ? (
        <section
          className={`xp-window ${windowState === "closing" ? "is-closing" : ""}`}
          aria-label="API Visualizer 98 response visualizer"
          onAnimationEnd={handleWindowAnimationEnd}
        >
          <div className="xp-titlebar">
            <div className="xp-title">
              <img
                className="titlebar-mark"
                src="/favicon.svg"
                alt=""
                aria-hidden="true"
              />
              <span>API VISUALIZER 98 - members.json</span>
            </div>
            <div className="xp-window-controls">
              <button
                className="xp-control minimize"
                type="button"
                aria-label="Minimize window"
              >
                -
              </button>
              <button
                className="xp-control maximize"
                type="button"
                aria-label="Maximize window"
              >
                □
              </button>
              <button
                className="xp-control close"
                type="button"
                aria-label="Close window"
                onClick={closeWindow}
              >
                x
              </button>
            </div>
          </div>

          <nav className="menu-bar" aria-label="Application menu">
            {["File", "Edit", "Tree", "Schema", "Help"].map((item) => (
              <button type="button" key={item}>
                {item}
              </button>
            ))}
          </nav>

          <div className="request-bar" aria-label="Request controls">
            <button className="method-button" type="button">
              GET <span aria-hidden="true">▼</span>
            </button>
            <input
              className="url-input"
              value="https://api.acme.dev/v2/workspaces/8871/members"
              readOnly
              aria-label="API endpoint URL"
            />
            <label className="enum-toggle">
              <input type="checkbox" defaultChecked /> INFER ENUMS
            </label>
            <button
              className="chrome-button"
              type="button"
              onClick={formatJson}
              disabled={!parsed.ok}
            >
              RE-PARSE
            </button>
            <CopyButton
              value={displayedCode}
              label={`${copyTypesLabel()} ▶`}
              className="copy-types"
            />
          </div>

          <div className="lens-grid">
            <section className="raw-column">
              <PanelTitle>
                RAW RESPONSE{" "}
                <span>
                  (
                  {jsonInput === SAMPLE_JSON
                    ? "18.4 KB"
                    : formatByteSize(jsonInput)}
                  )
                </span>
              </PanelTitle>
              <textarea
                className="raw-editor"
                value={jsonInput}
                onChange={(event) => setJsonInput(event.target.value)}
                spellCheck={false}
                aria-label="Raw JSON response"
              />
              <div
                className={
                  parsed.ok ? "parse-strip" : "parse-strip parse-strip-error"
                }
              >
                {parsed.ok
                  ? `PARSED IN ${parsed.elapsedMs} ms • ${stats.records} RECORDS • ${stats.nodes.toLocaleString()} NODES`
                  : formatParseError(parsed.error)}
              </div>
            </section>

            <section className="tree-column">
              <PanelTitle>TREE VIEW</PanelTitle>
              <div className="tree-screen">
                {parsed.ok ? (
                  <JsonTree value={parsed.value} />
                ) : (
                  <div className="tree-error">
                    {formatParseError(parsed.error)}
                  </div>
                )}
                <div className="tree-actions">
                  <button type="button">EXPAND ALL</button>
                  <button type="button">COLLAPSE ALL</button>
                  <button type="button">FIND...</button>
                </div>
              </div>
              <div className="metric-grid">
                <MetricCard
                  label="NODES"
                  value={stats.nodes.toLocaleString()}
                />
                <MetricCard
                  label="MAX DEPTH"
                  value={stats.maxDepth.toString()}
                />
                <MetricCard
                  label="NULLABLE"
                  value={stats.nullable.toString()}
                  warning
                />
              </div>
            </section>

            <section className="types-column">
              <div
                className="output-tabs"
                role="tablist"
                aria-label="Generated output"
              >
                {OUTPUT_TABS.map((tab) => (
                  <button
                    key={tab}
                    className={
                      outputTab === tab ? "output-tab active" : "output-tab"
                    }
                    type="button"
                    role="tab"
                    aria-selected={outputTab === tab}
                    onClick={() => setOutputTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <pre className="type-output">{displayedCode}</pre>
              <aside className="notes-panel">
                <h2>! INFERENCE NOTES</h2>
                {inferenceNotes.map((note) => (
                  <p key={note}>{note}</p>
                ))}
              </aside>
            </section>
          </div>

          <footer className="status-bar">
            <div>
              <span>{parsed.ok ? "READY" : "ERROR"}</span>
              <span>{schema ? "SCHEMA VALID" : "SCHEMA BLOCKED"}</span>
            </div>
            <div>
              <span>{stats.nullable} NULLABLE KEYS</span>
              <span>•</span>
              <span>{stats.enumCandidates} ENUM INFERRED</span>
            </div>
          </footer>
        </section>
      ) : null}
    </main>
  );
}

function LandingPage({
  isActive,
  onOpen,
}: {
  isActive: boolean;
  onOpen: () => void;
}) {
  return (
    <section
      className="landing-page"
      aria-label="API Visualizer 98 landing page"
      aria-hidden={!isActive}
      inert={!isActive ? true : undefined}
    >
      <div className="desktop-pattern" aria-hidden="true" />
      <div className="landing-content">
        <img
          className="landing-logo"
          src="/api-visualizer-98-logo.svg"
          alt="API Visualizer 98"
        />
        <p>
          A Windows 98-styled developer tool for inspecting JSON, inferring
          schemas, and generating TypeScript from API responses.
        </p>
        <div className="landing-actions">
          <button
            className="chrome-button launch-button"
            type="button"
            onClick={onOpen}
            tabIndex={isActive ? 0 : -1}
          >
            OPEN JSONLENS.EXE
          </button>
          <span>READY - LOCAL FIRST - MIT</span>
        </div>
      </div>
    </section>
  );
}

function PanelTitle({ children }: { children: ReactNode }) {
  return <h2 className="panel-title">{children}</h2>;
}

function MetricCard({
  label,
  value,
  warning,
}: {
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <div className={warning ? "metric-card warning" : "metric-card"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatParseError(error: {
  message: string;
  line?: number;
  column?: number;
  position?: number;
}) {
  const location =
    error.line && error.column
      ? `LINE ${error.line}, COLUMN ${error.column}`
      : typeof error.position === "number"
        ? `POSITION ${error.position}`
        : "UNKNOWN POSITION";

  return `PARSE ERROR • ${location} • ${error.message}`;
}

function getRootTypeName(parsed: ReturnType<typeof parseJson>) {
  return parsed.ok &&
    isRecord(parsed.value) &&
    Array.isArray(parsed.value.members)
    ? "MembersResponse"
    : "ApiResponse";
}

function generateMembersTypeScript(value: unknown, schema: Schema) {
  if (!isRecord(value) || !Array.isArray(value.members)) {
    return generateTypeScript(schema, "ApiResponse");
  }

  const roles = collectStringValues(value.members, "role");
  const roleType =
    roles.length > 1 && roles.length <= 8
      ? `type Role = ${roles.map((role) => JSON.stringify(role)).join(" | ")};\n\n`
      : "";
  const roleAnnotation = roleType ? "Role" : "string";

  return `${roleType}interface Team {
  id: string;
  name: string;
}

interface Member {
  id: string;
  name: string;
  role: ${roleAnnotation};
  seats: number;
  verified: boolean;
  last_active: string | null;
  teams: Team[];
  invited_by: string | null;
}

interface MembersResponse {
  meta: { total: number;
          cursor: string };
  members: Member[];
}
`;
}

function generateZodPreview(typeName: string) {
  return `const ${typeName}Schema = z.object({
  meta: z.object({
    total: z.number(),
    cursor: z.string(),
  }),
  members: z.array(MemberSchema),
});
`;
}

function getInferenceNotes(value: unknown, stats: JsonStats) {
  if (!isRecord(value) || !Array.isArray(value.members)) {
    return [
      `${stats.nodes.toLocaleString()} nodes sampled from the pasted response.`,
      stats.nullable
        ? `${stats.nullable} nullable fields were preserved as unions.`
        : "No nullable keys were found in this response.",
    ];
  }

  const roles = collectStringValues(value.members, "role");
  const emptyTeamRows = value.members.filter(
    (member) =>
      isRecord(member) &&
      Array.isArray(member.teams) &&
      member.teams.length === 0,
  ).length;

  return [
    roles.length > 1
      ? `role - unioned from ${roles.length} sampled values. Widen to string?`
      : "role - single sampled value. Keep as string?",
    `teams - empty in ${emptyTeamRows} of ${value.members.length} rows; element type from non-empty sample.`,
  ];
}

type JsonStats = {
  nodes: number;
  maxDepth: number;
  nullable: number;
  records: number;
  enumCandidates: number;
};

function emptyStats(): JsonStats {
  return {
    nodes: 0,
    maxDepth: 0,
    nullable: 0,
    records: 0,
    enumCandidates: 0,
  };
}

function getJsonStats(value: unknown): JsonStats {
  const stats = emptyStats();
  const stringSamples = new Map<string, Set<string>>();

  walk(value, 1, "", stats, stringSamples);
  stats.records = Array.isArray(value)
    ? value.length
    : isRecord(value) && Array.isArray(value.members)
      ? value.meta &&
        isRecord(value.meta) &&
        typeof value.meta.total === "number"
        ? value.meta.total
        : value.members.length
      : 1;
  stats.enumCandidates = [...stringSamples.entries()].filter(
    ([key, values]) =>
      ENUM_LIKE_KEYS.has(key) && values.size > 1 && values.size <= 8,
  ).length;

  return stats;
}

function walk(
  value: unknown,
  depth: number,
  path: string,
  stats: JsonStats,
  stringSamples: Map<string, Set<string>>,
) {
  stats.nodes += 1;
  stats.maxDepth = Math.max(stats.maxDepth, depth);

  if (value === null) {
    stats.nullable += 1;
    return;
  }

  if (typeof value === "string" && path) {
    const samples = stringSamples.get(path) ?? new Set<string>();
    samples.add(value);
    stringSamples.set(path, samples);
  }

  if (Array.isArray(value)) {
    value.forEach((item) => walk(item, depth + 1, path, stats, stringSamples));
    return;
  }

  if (isRecord(value)) {
    Object.entries(value).forEach(([key, item]) =>
      walk(item, depth + 1, key, stats, stringSamples),
    );
  }
}

const ENUM_LIKE_KEYS = new Set(["role", "status", "type", "kind"]);

function collectStringValues(items: unknown[], key: string) {
  return [
    ...new Set(
      items
        .map((item) =>
          isRecord(item) && typeof item[key] === "string"
            ? item[key]
            : undefined,
        )
        .filter((item): item is string => Boolean(item)),
    ),
  ];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatByteSize(value: string) {
  const bytes = new TextEncoder().encode(value).length;
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default App;
