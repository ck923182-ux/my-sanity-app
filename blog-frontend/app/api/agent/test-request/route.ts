import { withApiMonitoring } from "@/agent/runtime/api-monitor"

export const GET = withApiMonitoring(async () => {
  return Response.json({
    success: true,
    message: "Test request successful",
  })
})