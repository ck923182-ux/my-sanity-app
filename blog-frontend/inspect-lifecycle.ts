
import { getIssues } from "@/agent/issue-store";
import { getInvestigationById } from "@/agent/investigation-store";

const issueId = "5bdc3ef2-9e6d-40e9-9714-6d9c34b26a02";

const issue = getIssues().find((item) => item.id === issueId);

if (!issue) {
  console.log("Issue record not found.");
  process.exitCode = 1;
} else {
  const latestId = issue.latestInvestigationId;
  const investigation = latestId
    ? getInvestigationById(latestId)
    : undefined;

  console.log({
    issueId: issue.id,
    issueStatus: issue.status,
    latestInvestigationId: latestId,
    latestIdIncludedInHistory:
      latestId !== undefined &&
      issue.investigationIds.includes(latestId),
    investigationRecordExists: Boolean(investigation),
    investigationStatus: investigation?.status ?? "not found",
    investigationCreatedAt: investigation?.createdAt ?? null,
  });
}
