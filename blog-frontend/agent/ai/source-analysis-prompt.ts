export type SourceAnalysisAiInput = {
  apiPath: string

  runtime: {
    duration: number
    status: number
  } | null

  bottleneck: {
    name: string
    duration: number
    percentage: number
  } | null

  rootCause: {
    likelyCause: string
    explanation: string
    duration: number
    bottleneckDuration: number
    sourceLines: number[]
  } | null

  developerRecommendation: {
    priority: "high" | "medium" | "low"
    title: string
    recommendation: string
    reason: string
    sourceLines: number[]
  } | null

  sourceContext: {
    startLine: number
    endLine: number
    code: string
  } | null
}

export function buildSourceAnalysisPrompt(
  input: SourceAnalysisAiInput
): string {
  return `
You are an AI software debugging assistant.

Analyze the API performance issue using ONLY the evidence provided below.

Do not invent information that is not present in the evidence.

Your job is to:
1. Explain the likely root cause.
2. Explain why the operation is considered the bottleneck.
3. Identify the relevant source lines.
4. Suggest a practical developer fix or investigation step.
5. Clearly distinguish evidence from assumptions.

API:
${input.apiPath}

Runtime:
${
  input.runtime
    ? `- Total duration: ${input.runtime.duration}ms
- HTTP status: ${input.runtime.status}`
    : "No runtime data available."
}

Bottleneck:
${
  input.bottleneck
    ? `- Operation: ${input.bottleneck.name}
- Duration: ${input.bottleneck.duration}ms
- Request duration percentage: ${input.bottleneck.percentage}%`
    : "No bottleneck detected."
}

Root Cause Analysis:
${
  input.rootCause
    ? `- Likely cause: ${input.rootCause.likelyCause}
- Explanation: ${input.rootCause.explanation}
- Bottleneck duration: ${input.rootCause.bottleneckDuration}ms
- Source lines: ${input.rootCause.sourceLines.join(", ")}`
    : "No root cause analysis available."
}

Developer Recommendation:
${
  input.developerRecommendation
    ? `- Priority: ${input.developerRecommendation.priority}
- Title: ${input.developerRecommendation.title}
- Recommendation: ${input.developerRecommendation.recommendation}
- Reason: ${input.developerRecommendation.reason}
- Source lines: ${input.developerRecommendation.sourceLines.join(", ")}`
    : "No developer recommendation available."
}

Source Context:
${
  input.sourceContext
    ? `Lines ${input.sourceContext.startLine}-${input.sourceContext.endLine}:

${input.sourceContext.code}`
    : "No source context available."
}

Return your analysis using this structure:

ROOT CAUSE:
Explain the most likely cause based only on the evidence.

EVIDENCE:
List the concrete evidence supporting the analysis.

SOURCE:
Identify the relevant source lines and explain their role.

RECOMMENDATION:
Give practical next steps for the developer.

ASSUMPTIONS:
Clearly mention anything that cannot be confirmed from the available evidence.

Keep the response concise and technical.
`
}