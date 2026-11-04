import { withApiMonitoring } from "@/agent/runtime/api-monitor";
import { authorizeAdminApi } from "@/auth/guards";

export const GET = withApiMonitoring(async () => {
  const authError = await authorizeAdminApi();

  if (authError) return authError;

  return Response.json({
    success: true,
    message: "Test request successful",
  });
});