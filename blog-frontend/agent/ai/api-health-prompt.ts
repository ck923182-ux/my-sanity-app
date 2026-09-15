import type { ApiStats } from "@/agent/types"

export function buildApiHealthPrompt(stats: ApiStats): string {
  return `
You are an API reliability and performance diagnostic agent.

Analyze the following summarized API health report from a Next.js application.

Do NOT invent information that is not present in the report.

Your responsibilities:

1. Identify why the API was marked unhealthy or warning.
2. Explain the likely technical problem.
3. Give a practical recommendation for the developer.
4. Identify what part of the application should be investigated.
5. Keep the response concise and actionable.

API HEALTH REPORT

Path: ${stats.path}
Method: ${stats.method}

Total calls: ${stats.totalCalls}
Successful calls: ${stats.successCalls}
Error calls: ${stats.errorCalls}

Average duration: ${stats.averageDuration} ms
Maximum duration: ${stats.maxDuration} ms

Duplicate calls: ${stats.duplicateCalls}
Error rate: ${stats.errorRate}%

Health: ${stats.health}

Detected issues:
${stats.issues.length > 0 ? stats.issues.join(", ") : "None"}

IMPORTANT:
Only analyze the information provided above.
Do not assume access to the application's source code.
Do not recommend unrelated changes.
`
}