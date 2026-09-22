export type PrimitiveKind = "string" | "number" | "boolean" | "null";

export type Schema =
  | { kind: "unknown" }
  | { kind: PrimitiveKind }
  | { kind: "array"; items: Schema }
  | { kind: "object"; properties: Record<string, SchemaProperty> }
  | { kind: "union"; variants: Schema[] };

export type SchemaProperty = {
  schema: Schema;
  optional: boolean;
};

export function inferSchema(value: unknown): Schema {
  if (value === null) return { kind: "null" };

  if (Array.isArray(value)) {
    return {
      kind: "array",
      items: value.length
        ? value.map(inferSchema).reduce(mergeSchemas)
        : { kind: "unknown" },
    };
  }

  const type = typeof value;
  if (type === "string" || type === "number" || type === "boolean") {
    return { kind: type };
  }

  if (type === "object") {
    return {
      kind: "object",
      properties: Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, item]) => [
          key,
          { schema: inferSchema(item), optional: false },
        ]),
      ),
    };
  }

  return { kind: "unknown" };
}

export function mergeSchemas(left: Schema, right: Schema): Schema {
  if (left.kind === "unknown") return right;
  if (right.kind === "unknown") return left;

  if (left.kind === "union" || right.kind === "union") {
    return normalizeUnion([...flattenUnion(left), ...flattenUnion(right)]);
  }

  if (left.kind !== right.kind) {
    return normalizeUnion([left, right]);
  }

  if (left.kind === "array" && right.kind === "array") {
    return { kind: "array", items: mergeSchemas(left.items, right.items) };
  }

  if (left.kind === "object" && right.kind === "object") {
    return mergeObjects(left, right);
  }

  return left;
}

export function describeSchema(schema: Schema, depth = 0): string {
  const pad = "  ".repeat(depth);

  switch (schema.kind) {
    case "unknown":
    case "string":
    case "number":
    case "boolean":
    case "null":
      return schema.kind;
    case "array":
      return `array<${describeSchema(schema.items, depth)}>`;
    case "union":
      return schema.variants
        .map((variant) => describeSchema(variant, depth))
        .join(" | ");
    case "object": {
      const entries = Object.entries(schema.properties);
      if (!entries.length) return "object {}";

      const lines = entries.map(([key, property]) => {
        const optional = property.optional ? "?" : "";
        return `${pad}  ${key}${optional}: ${describeSchema(property.schema, depth + 1)}`;
      });

      return `object {\n${lines.join("\n")}\n${pad}}`;
    }
  }
}

function mergeObjects(
  left: Extract<Schema, { kind: "object" }>,
  right: Extract<Schema, { kind: "object" }>,
): Schema {
  const properties: Record<string, SchemaProperty> = {};
  const keys = new Set([
    ...Object.keys(left.properties),
    ...Object.keys(right.properties),
  ]);

  for (const key of keys) {
    const leftProperty = left.properties[key];
    const rightProperty = right.properties[key];

    if (leftProperty && rightProperty) {
      properties[key] = {
        schema: mergeSchemas(leftProperty.schema, rightProperty.schema),
        optional: leftProperty.optional || rightProperty.optional,
      };
    } else {
      properties[key] = {
        schema: (leftProperty ?? rightProperty).schema,
        optional: true,
      };
    }
  }

  return { kind: "object", properties };
}

function flattenUnion(schema: Schema): Schema[] {
  return schema.kind === "union"
    ? schema.variants.flatMap(flattenUnion)
    : [schema];
}

function normalizeUnion(variants: Schema[]): Schema {
  const deduped: Schema[] = [];

  for (const variant of variants.flatMap(flattenUnion)) {
    const existingIndex = deduped.findIndex(
      (item) => signature(item) === signature(variant),
    );
    if (existingIndex >= 0) {
      deduped[existingIndex] = mergeSchemas(deduped[existingIndex], variant);
    } else {
      deduped.push(variant);
    }
  }

  const ordered = deduped.sort((a, b) => typeRank(a) - typeRank(b));
  return ordered.length === 1
    ? ordered[0]
    : { kind: "union", variants: ordered };
}

function signature(schema: Schema): string {
  if (schema.kind === "array") return `array:${signature(schema.items)}`;
  if (schema.kind === "object") return "object";
  if (schema.kind === "union")
    return `union:${schema.variants.map(signature).join("|")}`;
  return schema.kind;
}

function typeRank(schema: Schema) {
  const ranks: Record<Schema["kind"], number> = {
    null: 0,
    boolean: 1,
    number: 2,
    string: 3,
    array: 4,
    object: 5,
    union: 6,
    unknown: 7,
  };

  return ranks[schema.kind];
}
