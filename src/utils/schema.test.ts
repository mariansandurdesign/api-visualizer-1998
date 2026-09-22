import { describe, expect, it } from "vitest";
import { inferSchema } from "./schema";
import { generateTypeScript } from "./typeScriptGenerator";

describe("schema inference and TypeScript generation", () => {
  it("marks missing object properties in arrays as optional", () => {
    const schema = inferSchema([
      { id: 1, name: "Ada" },
      { id: 2, email: "grace@example.com" },
    ]);

    const typeScript = generateTypeScript(schema);

    expect(typeScript).toContain("id: number;");
    expect(typeScript).toContain("name?: string;");
    expect(typeScript).toContain("email?: string;");
  });

  it("creates union types for mixed arrays and nullable fields", () => {
    const schema = inferSchema({
      ids: [1, "2", null],
      owner: { email: "ada@example.com" },
      status: null,
    });

    const typeScript = generateTypeScript(schema);

    expect(typeScript).toContain("ids: Array<null | number | string>;");
    expect(typeScript).toContain("status: null;");
  });

  it("sanitizes invalid TypeScript property identifiers", () => {
    const schema = inferSchema({
      "user-id": 123,
      class: "standard",
    });

    const typeScript = generateTypeScript(schema);

    expect(typeScript).toContain('"user-id": number;');
    expect(typeScript).toContain('"class": string;');
  });
});
