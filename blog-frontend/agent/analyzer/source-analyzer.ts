export type SourceOperation = {
  name: string;

  type:
    | "database"
    | "external-api"
    | "request"
    | "response"
    | "validation"
    | "unknown";

  line: number;

  code: string;
};

export type SourceAnalysis = {
  filePath: string;
  operations: SourceOperation[];
};

function getLineNumber(
  source: string,
  index: number
): number {
  return source
    .slice(0, index)
    .split("\n").length;
}

export function analyzeSource(
  source: string,
  filePath: string
): SourceAnalysis {
  const operations: SourceOperation[] = [];

  const patterns: {
    regex: RegExp;
    name: string;
    type: SourceOperation["type"];
  }[] = [
    // Request
    {
      regex: /request\.json\s*\(/g,
      name: "request.json()",
      type: "request",
    },

    {
      regex: /request\.formData\s*\(/g,
      name: "request.formData()",
      type: "request",
    },

    // External API
    {
      regex: /fetch\s*\(/g,
      name: "fetch()",
      type: "external-api",
    },

    // Database / Sanity
    {
      regex: /\.patch\s*\(/g,
      name: ".patch()",
      type: "database",
    },

    {
      regex: /\.create\s*\(/g,
      name: ".create()",
      type: "database",
    },

    {
      regex: /\.createIfNotExists\s*\(/g,
      name: ".createIfNotExists()",
      type: "database",
    },

    {
      regex: /\.delete\s*\(/g,
      name: ".delete()",
      type: "database",
    },

    {
      regex: /\.commit\s*\(/g,
      name: ".commit()",
      type: "database",
    },

    // Next.js response
    {
      regex: /NextResponse\.json\s*\(/g,
      name: "NextResponse.json()",
      type: "response",
    },

    // Standard Response
    {
      regex: /(?<!NextResponse)\bResponse\.json\s*\(/g,
      name: "Response.json()",
      type: "response",
    },
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;

    while (
      (match = pattern.regex.exec(source)) !== null
    ) {
      const line = getLineNumber(
        source,
        match.index
      );

      const lineStart =
        source.lastIndexOf(
          "\n",
          match.index
        ) + 1;

      const lineEnd =
        source.indexOf(
          "\n",
          match.index
        );

      const code = source
        .slice(
          lineStart,
          lineEnd === -1
            ? source.length
            : lineEnd
        )
        .trim();

      operations.push({
        name: pattern.name,
        type: pattern.type,
        line,
        code,
      });
    }
  }

  operations.sort(
    (a, b) => a.line - b.line
  );

  return {
    filePath,
    operations,
  };
}

export type SourceContext = {
  startLine: number
  endLine: number
  code: string
}

export function extractSourceContext(
  source: string,
  lines: number[],
  radius: number = 3
): SourceContext | null {
  if (lines.length === 0) {
    return null
  }

  const sourceLines = source.split("\n")

  const minLine = Math.min(...lines)
  const maxLine = Math.max(...lines)

  const startLine = Math.max(
    1,
    minLine - radius
  )

  const endLine = Math.min(
    sourceLines.length,
    maxLine + radius
  )

  const code = sourceLines
    .slice(startLine - 1, endLine)
    .map(
      (line, index) =>
        `${startLine + index}: ${line}`
    )
    .join("\n")

  return {
    startLine,
    endLine,
    code,
  }
}