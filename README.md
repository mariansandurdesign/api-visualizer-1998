# JSONLENS API Response Visualizer

A Windows XP-style developer tool for inspecting API JSON responses. Paste a response and JSONLENS shows a raw response editor, collapsible tree view, inferred schema details, generated TypeScript, and sample fetch code.

Live demo: [api-visualizer-1998.vercel.app](https://api-visualizer-1998.vercel.app)

GitHub: [mariansandurdesign/api-visualizer-1998](https://github.com/mariansandurdesign/api-visualizer-1998)

## Features

- Live JSON parsing with friendly errors
- Collapsible JSON tree viewer
- Recursive schema inference
- Optional field inference for mixed object arrays
- Union and nullable type handling
- Generated TypeScript response types
- Generated sample fetch helper
- Copy-to-clipboard actions
- LocalStorage persistence
- Reusable library exports for parsing, schema inference, and code generation

## Install From GitHub

```bash
npm install github:mariansandurdesign/api-visualizer-1998
```

## Library Usage

```ts
import {
  generateFetchCode,
  generateTypeScript,
  inferSchema,
  parseJson,
} from "jsonlens-api-response-visualizer";

const input = `{
  "members": [
    { "id": "usr_8f21", "role": "admin" },
    { "id": "usr_31ac", "role": "member" }
  ]
}`;

const parsed = parseJson(input);

if (parsed.ok) {
  const schema = inferSchema(parsed.value);
  const types = generateTypeScript(schema, "ApiResponse");
  const fetchCode = generateFetchCode("ApiResponse");

  console.log(types);
  console.log(fetchCode);
}
```

## Exported API

```ts
parseJson(input: string): JsonParseResult
getLineColumn(input: string, position: number): { line: number; column: number }
inferSchema(value: unknown): Schema
mergeSchemas(left: Schema, right: Schema): Schema
describeSchema(schema: Schema): string
generateTypeScript(schema: Schema, rootName?: string): string
schemaToType(schema: Schema): string
toPropertyName(key: string): string
generateFetchCode(typeName?: string): string
SAMPLE_JSON: string
```

## Local Development

```bash
npm install
npm run dev
```

The dev server runs at [http://127.0.0.1:5173](http://127.0.0.1:5173).

## Scripts

```bash
npm run dev        # Start the Vite app
npm run build      # Build the app and library bundle
npm run build:app  # Build only the web app
npm run build:lib  # Build only the reusable library bundle
npm run typecheck  # Run TypeScript checks
npm run test       # Run Vitest tests
npm run format     # Format the repository
```

## Project Structure

```txt
src/
  App.tsx                    Web app shell
  components/JsonTree.tsx    Tree viewer
  utils/jsonParser.ts        JSON parsing helpers
  utils/schema.ts            Schema inference
  utils/typeScriptGenerator.ts
  utils/fetchCodeGenerator.ts
  index.ts                   Library entry point
```

## License

MIT. See [LICENSE](./LICENSE).
