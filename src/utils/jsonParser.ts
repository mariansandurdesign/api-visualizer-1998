export type JsonParseSuccess = {
  ok: true;
  value: unknown;
};

export type JsonParseFailure = {
  ok: false;
  error: {
    message: string;
    line?: number;
    column?: number;
    position?: number;
  };
};

export type JsonParseResult = JsonParseSuccess | JsonParseFailure;

export function parseJson(input: string): JsonParseResult {
  try {
    return { ok: true, value: JSON.parse(input) };
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Invalid JSON";
    const position =
      extractPosition(rawMessage) ??
      extractUnexpectedTokenPosition(input, rawMessage);
    const explicitLocation = extractLineColumn(rawMessage);
    const calculatedLocation =
      typeof position === "number" ? getLineColumn(input, position) : undefined;

    return {
      ok: false,
      error: {
        message: simplifyJsonError(rawMessage),
        position,
        line: explicitLocation?.line ?? calculatedLocation?.line,
        column: explicitLocation?.column ?? calculatedLocation?.column,
      },
    };
  }
}

export function getLineColumn(input: string, position: number) {
  const safePosition = Math.max(0, Math.min(position, input.length));
  const before = input.slice(0, safePosition);
  const lines = before.split(/\n/);

  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

function extractPosition(message: string) {
  const match = message.match(/position\s+(\d+)/i);
  return match ? Number(match[1]) : undefined;
}

function extractUnexpectedTokenPosition(input: string, message: string) {
  if (/end of JSON input/i.test(message)) {
    return input.length;
  }

  const match = message.match(/Unexpected token '(.+?)'/i);
  if (!match) return undefined;

  const position = input.indexOf(match[1]);
  return position >= 0 ? position : undefined;
}

function extractLineColumn(message: string) {
  const match = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);
  if (!match) return undefined;

  return {
    line: Number(match[1]),
    column: Number(match[2]),
  };
}

function simplifyJsonError(message: string) {
  return message.replace(/^JSON\.parse:\s*/i, "").trim() || "Invalid JSON";
}
