    export type DeveloperRecommendation = {
  priority: "high" | "medium" | "low"

  title: string

  recommendation: string

  reason: string

  sourceLines: number[]
}

type RootCauseInput = {
  category:
    | "database-operation"
    | "external-api"
    | "request-processing"
    | "response-processing"
    | "unknown"

  confidence:
    | "high"
    | "medium"
    | "low"

  operation: string

  duration: number

  percentage: number

  evidence: {
    type:
      | "runtime"
      | "bottleneck"
      | "source"

    message: string
  }[]
}

export function generateDeveloperRecommendation(
  rootCause: RootCauseInput
): DeveloperRecommendation {
  let priority:
    DeveloperRecommendation["priority"] =
    "low"

  if (
    rootCause.percentage >= 80 ||
    rootCause.confidence === "high"
  ) {
    priority = "high"
  } else if (
    rootCause.percentage >= 50 ||
    rootCause.confidence === "medium"
  ) {
    priority = "medium"
  }

  switch (rootCause.category) {
    case "database-operation":
      return {
        priority,

        title:
          "Investigate database operation latency",

        recommendation:
          `Investigate the ${rootCause.operation} operation because it accounts for ${rootCause.percentage}% of the measured request duration. Measure the database/network operation separately and verify the database response time before optimizing other parts of the API.`,

        reason:
          `${rootCause.operation} took ${rootCause.duration}ms and represents ${rootCause.percentage}% of the measured request duration.`,

        sourceLines:
          extractSourceLines(rootCause),
      }

    case "external-api":
      return {
        priority,

        title:
          "Investigate external API latency",

        recommendation:
          `Investigate the ${rootCause.operation} call because it accounts for ${rootCause.percentage}% of the measured request duration. Measure the external API request separately and check response time, timeout configuration, and retry behavior.`,

        reason:
          `${rootCause.operation} took ${rootCause.duration}ms and represents ${rootCause.percentage}% of the measured request duration.`,

        sourceLines:
          extractSourceLines(rootCause),
      }

    case "request-processing":
      return {
        priority,

        title:
          "Investigate request processing",

        recommendation:
          `Investigate ${rootCause.operation} because request processing accounts for ${rootCause.percentage}% of the measured request duration. Check request payload size, parsing cost, and validation work.`,

        reason:
          `${rootCause.operation} took ${rootCause.duration}ms and represents ${rootCause.percentage}% of the measured request duration.`,

        sourceLines:
          extractSourceLines(rootCause),
      }

    case "response-processing":
      return {
        priority,

        title:
          "Investigate response processing",

        recommendation:
          `Investigate ${rootCause.operation} because response processing accounts for ${rootCause.percentage}% of the measured request duration. Check response serialization and the amount of data being returned.`,

        reason:
          `${rootCause.operation} took ${rootCause.duration}ms and represents ${rootCause.percentage}% of the measured request duration.`,

        sourceLines:
          extractSourceLines(rootCause),
      }

    default:
      return {
        priority,

        title:
          "Investigate the detected bottleneck",

        recommendation:
          `Investigate ${rootCause.operation} because it accounts for ${rootCause.percentage}% of the measured request duration. Add more detailed instrumentation around this operation before making optimization changes.`,

        reason:
          `${rootCause.operation} took ${rootCause.duration}ms and represents ${rootCause.percentage}% of the measured request duration.`,

        sourceLines:
          extractSourceLines(rootCause),
      }
  }
}

function extractSourceLines(
  rootCause: RootCauseInput
): number[] {
  const sourceEvidence =
    rootCause.evidence.find(
      (evidence) =>
        evidence.type === "source"
    )

  if (!sourceEvidence) {
    return []
  }

  const match =
    sourceEvidence.message.match(
      /lines?\s+([\d,\s]+)/
    )

  if (!match) {
    return []
  }

  return match[1]
    .split(",")
    .map((line) =>
      Number(line.trim())
    )
    .filter(
      (line) =>
        Number.isFinite(line)
    )
}