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
  return source.slice(0, index).split("\n").length;
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
    {
      regex: /fetch\s*\(/g,
      name: "fetch()",
      type: "external-api",
    },
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
        regex: /(?<!Next)Response\.json\s*\(/g,
        name: "Response.json()",
        type: "response",
    },
    {
      regex: /Response\.json\s*\(/g,
      name: "Response.json()",
      type: "response",
    },
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;

    while ((match = pattern.regex.exec(source)) !== null) {
      const line = getLineNumber(
        source,
        match.index
      );

      const lineStart =
        source.lastIndexOf("\n", match.index) + 1;

      const lineEnd = source.indexOf(
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