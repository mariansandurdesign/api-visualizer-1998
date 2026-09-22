import type { Schema } from "./schema";

const RESERVED_WORDS = new Set([
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "export",
  "extends",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "new",
  "return",
  "super",
  "switch",
  "this",
  "throw",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield",
]);

export function generateTypeScript(schema: Schema, rootName = "ApiResponse") {
  if (schema.kind === "object") {
    return `export interface ${rootName} ${schemaToType(schema, 0)}\n`;
  }

  return `export type ${rootName} = ${schemaToType(schema, 0)};\n`;
}

export function schemaToType(schema: Schema, depth = 0): string {
  switch (schema.kind) {
    case "unknown":
      return "unknown";
    case "null":
    case "string":
    case "number":
    case "boolean":
      return schema.kind;
    case "array": {
      const itemType = schemaToType(schema.items, depth);
      return needsArrayGeneric(schema.items)
        ? `Array<${itemType}>`
        : `${itemType}[]`;
    }
    case "union":
      return schema.variants
        .map((variant) => schemaToType(variant, depth))
        .join(" | ");
    case "object":
      return objectToType(schema.properties, depth);
  }
}

export function toPropertyName(key: string) {
  if (/^[$A-Z_a-z][$\w]*$/.test(key) && !RESERVED_WORDS.has(key)) {
    return key;
  }

  return JSON.stringify(key);
}

function objectToType(
  properties: Extract<Schema, { kind: "object" }>["properties"],
  depth: number,
) {
  const entries = Object.entries(properties);
  if (!entries.length) return "{}";

  const pad = "  ".repeat(depth);
  const nextPad = "  ".repeat(depth + 1);
  const lines = entries.map(([key, property]) => {
    const optional = property.optional ? "?" : "";
    return `${nextPad}${toPropertyName(key)}${optional}: ${schemaToType(property.schema, depth + 1)};`;
  });

  return `{\n${lines.join("\n")}\n${pad}}`;
}

function needsArrayGeneric(schema: Schema) {
  return (
    schema.kind === "object" ||
    schema.kind === "union" ||
    schema.kind === "array"
  );
}
