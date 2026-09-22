export function generateFetchCode(typeName = "ApiResponse") {
  return `import type { ${typeName} } from "./types";

export async function fetchApiResponse(
  url = "https://api.example.com/resource",
): Promise<${typeName}> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(\`API request failed: \${response.status} \${response.statusText}\`);
  }

  return (await response.json()) as ${typeName};
}
`;
}
