
import type { ApiHealthResult } from "@/agent/analyzer/health-analyzer";
import type { AutomaticInvestigationDecision } from "@/agent/automatic-investigation-policy";

type InvestigationRunnerDependencies<T> = {
  getHealth: () =>
    | ApiHealthResult
    | null
    | Promise<ApiHealthResult | null>;

  decide: (
    health: ApiHealthResult,
  ) => AutomaticInvestigationDecision;

  startInvestigation: (apiPath: string) => Promise<T>;
};

export type InvestigationRunnerResult<T> =
  | {
      status: "skipped";
      reason: string;
    }
  | {
      status: "started";
      investigation: T;
    };

export async function runAutomaticInvestigation<T>(
  apiPath: string,
  dependencies: InvestigationRunnerDependencies<T>,
): Promise<InvestigationRunnerResult<T>> {
  const health = await dependencies.getHealth();

  if (!health) {
    return {
      status: "skipped",
      reason: "No health data available.",
    };
  }

  const decision = dependencies.decide(health);

  if (!decision.shouldInvestigate) {
    return {
      status: "skipped",
      reason: decision.reason,
    };
  }

  const investigation =
    await dependencies.startInvestigation(apiPath);

  return {
    status: "started",
    investigation,
  };
}
