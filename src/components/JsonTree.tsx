import { useState } from "react";

export function JsonTree({ value }: { value: unknown }) {
  const totalRecords =
    isRecord(value) &&
    isRecord(value.meta) &&
    typeof value.meta.total === "number"
      ? value.meta.total
      : undefined;

  return (
    <div className="json-tree">
      <TreeNode
        name="root"
        value={value}
        depth={0}
        path="root"
        rootTotal={totalRecords}
        defaultOpen
      />
    </div>
  );
}

function TreeNode({
  name,
  value,
  depth,
  path,
  rootTotal,
  defaultOpen = false,
}: {
  name: string;
  value: unknown;
  depth: number;
  path: string;
  rootTotal?: number;
  defaultOpen?: boolean;
}) {
  if (Array.isArray(value)) {
    const shouldSelect = name === "members";
    const totalSuffix = shouldSelect && rootTotal ? ` of ${rootTotal}` : "";

    return (
      <Branch
        name={name}
        depth={depth}
        summary={`array · ${value.length}${totalSuffix}`}
        defaultOpen={defaultOpen || shouldSelect}
        selected={shouldSelect}
      >
        {value.map((item, index) => (
          <TreeNode
            key={index}
            name={`[${index}]`}
            value={item}
            depth={depth + 1}
            path={`${path}.${index}`}
            rootTotal={rootTotal}
            defaultOpen={index === 0 && shouldSelect}
          />
        ))}
      </Branch>
    );
  }

  if (isRecord(value)) {
    const entries = Object.entries(value);
    const summary =
      depth === 0
        ? `object · ${entries.length} keys`
        : `object · ${entries.length}`;

    return (
      <Branch
        name={name}
        depth={depth}
        summary={summary}
        defaultOpen={defaultOpen}
      >
        {entries.map(([key, item]) => (
          <TreeNode
            key={key}
            name={key}
            value={item}
            depth={depth + 1}
            path={`${path}.${key}`}
            rootTotal={rootTotal}
          />
        ))}
      </Branch>
    );
  }

  return <Leaf name={name} value={value} depth={depth} />;
}

function Branch({
  name,
  summary,
  children,
  depth,
  defaultOpen,
  selected,
}: {
  name: string;
  summary: string;
  children: React.ReactNode;
  depth: number;
  defaultOpen?: boolean;
  selected?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className="tree-row"
      style={{ "--depth": depth } as React.CSSProperties}
    >
      <button
        className={selected ? "tree-toggle selected" : "tree-toggle"}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <span className="tree-box">{open ? "-" : "+"}</span>
        <span className="tree-key">{name}</span>
        <span className="tree-meta">{summary}</span>
      </button>
      {open && <div className="tree-children">{children}</div>}
    </div>
  );
}

function Leaf({
  name,
  value,
  depth,
}: {
  name: string;
  value: unknown;
  depth: number;
}) {
  return (
    <div
      className="tree-leaf"
      style={{ "--depth": depth } as React.CSSProperties}
    >
      <span className="tree-key">{name}</span>
      <PrimitiveValue value={value} name={name} />
    </div>
  );
}

function PrimitiveValue({ value, name }: { value: unknown; name: string }) {
  if (typeof value === "string") {
    return (
      <>
        <span className="json-string">{JSON.stringify(value)}</span>
        {name === "role" && <span className="tree-badge">2 VARIANTS</span>}
        {looksIso(value) && <span className="tree-badge">ISO</span>}
      </>
    );
  }

  if (typeof value === "number") {
    return <span className="json-number">{String(value)}</span>;
  }

  if (typeof value === "boolean") {
    return <span className="json-boolean">{String(value)}</span>;
  }

  if (value === null) {
    return (
      <>
        <span className="json-null">null</span>
        <span className="tree-badge">NULLABLE</span>
      </>
    );
  }

  return <span className="json-null">undefined</span>;
}

function looksIso(value: string) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
