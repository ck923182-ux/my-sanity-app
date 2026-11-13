import { addRequestLog, reserveRequest } from "../store";
import { triggerAutomaticInvestigation } from "../automatic-investigator";
import { measureOperation, type OperationTiming } from "./operation-monitor";
import { checkApiRecovery } from "../recovery-service";
import { createHmac } from "node:crypto";
import { resolveApiRoute } from "./route-matcher";

function getSafeErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      errorName: error.name.slice(0, 100),
      message: "An internal operation failed.",
    };
  }

  return {
    errorName: "UnknownError",
    message: "An internal operation failed.",
  };
}

function getSafeApiPath(request: Request): string {
  const pathname = new URL(request.url).pathname;

  try {
    return resolveApiRoute(pathname) ?? pathname;
  } catch (error) {
    console.error("API ROUTE NORMALIZATION FAILED:", {
      ...getSafeErrorDetails(error),
    });

    return pathname;
  }
}

type ApiRouteHandler = (
  request: Request,
  context?: unknown,
  operations?: OperationRecorder,
) => Response | Promise<Response>;

export type OperationRecorder = {
  measure: <T>(name: string, operation: () => Promise<T>) => Promise<T>;
};

async function getRequestBody(request: Request): Promise<string> {
  if (request.method === "GET" || request.method === "HEAD") {
    return "";
  }

  const MAX_FINGERPRINT_BODY_SIZE = 64 * 1024;

  const uniqueUnfingerprintableMarker = () =>
    `__UNFINGERPRINTABLE__:${crypto.randomUUID()}`;

  const contentLength = Number(request.headers.get("content-length"));

  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_FINGERPRINT_BODY_SIZE
  ) {
    return uniqueUnfingerprintableMarker();
  }

  try {
    const body = request.clone().body;

    if (!body) {
      return "";
    }

    const reader = body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      totalBytes += value.byteLength;

      if (totalBytes > MAX_FINGERPRINT_BODY_SIZE) {
        await reader.cancel();
        return uniqueUnfingerprintableMarker();
      }

      chunks.push(value);
    }

    const combined = new Uint8Array(totalBytes);
    let offset = 0;

    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.byteLength;
    }

    return new TextDecoder().decode(combined);
  } catch {
    return uniqueUnfingerprintableMarker();
  }
}

function createRequestFingerprint(request: Request, body: string): string {
  const url = new URL(request.url);

  const ignoredParams = new Set([
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "gclid",
    "fbclid",
  ]);

  const normalizedParams = [...url.searchParams.entries()]
    .filter(([key]) => !ignoredParams.has(key.toLowerCase()))
    .sort(([keyA, valueA], [keyB, valueB]) => {
      const keyComparison = keyA.localeCompare(keyB);

      return keyComparison !== 0 ? keyComparison : valueA.localeCompare(valueB);
    });

  const normalizedSearch = new URLSearchParams(normalizedParams).toString();

  const fingerprintData = [
    request.method.toUpperCase(),
    url.pathname,
    normalizedSearch,
    body,
  ].join(":");

  const secret = process.env.BETTER_AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("Monitoring fingerprint secret is not configured.");
  }

  return createHmac("sha256", secret).update(fingerprintData).digest("hex");
}

function processMonitoringLog(
  log: {
    id: string;
    method: string;
    path: string;
    status: number;
    duration: number;
    timestamp: number;
    userAgent?: string;
    requestFingerprint: string;
    isDuplicate: boolean;
    duplicateOf?: string;
    duplicateCount: number;
    operations: OperationTiming[];
  },
  requestUrl: string,
): void {
  // Logging failures must not change the API response.
  try {
    addRequestLog(log);
  } catch (error) {
    console.error("API MONITOR PERSISTENCE FAILED:", {
      requestId: log.id,
      path: log.path,
      ...getSafeErrorDetails(error),
    });
  }

  // Recovery verification is independent of log persistence.
  try {
    checkApiRecovery(log.path);
  } catch (error) {
    console.error("API RECOVERY CHECK FAILED:", {
      requestId: log.id,
      path: log.path,
      ...getSafeErrorDetails(error),
    });
  }

  // Handle both asynchronous rejection and synchronous failures.
  try {
    const safeRequestUrl = new URL(requestUrl);
    safeRequestUrl.search = "";
    safeRequestUrl.hash = "";

    void triggerAutomaticInvestigation(
      log.path,
      safeRequestUrl.toString(),
    ).catch((error) => {
      console.error("AUTOMATIC INVESTIGATION FAILED:", {
        requestId: log.id,
        path: log.path,
        ...getSafeErrorDetails(error),
      });
    });
  } catch (error) {
    console.error("AUTOMATIC INVESTIGATION COULD NOT START:", {
      requestId: log.id,
      path: log.path,
      ...getSafeErrorDetails(error),
    });
  }
}

function safelyProcessMonitoringLog(
  createLog: () => Parameters<typeof processMonitoringLog>[0],
  requestUrl: string,
  requestId: string,
): void {
  try {
    const log = createLog();

    processMonitoringLog(log, requestUrl);
  } catch (error) {
    console.error("API MONITORING LOG CREATION FAILED:", {
      requestId,
      ...getSafeErrorDetails(error),
    });
  }
}

export async function monitorApi<T extends Response>(
  request: Request,
  handler: (operations: OperationRecorder) => Promise<T>,
): Promise<T> {
  const start = performance.now();
  const timestamp = Date.now();
  const requestId = crypto.randomUUID();

  let requestFingerprint = `MONITORING_BYPASS:${requestId}`;

  let duplicateInfo: {
    isDuplicate: boolean;
    duplicateOf?: string;
    duplicateCount: number;
  } = {
    isDuplicate: false,
    duplicateCount: 0,
  };
  try {
    const requestBody = await getRequestBody(request);

    requestFingerprint = createRequestFingerprint(request, requestBody);

    // Reserve the request only when fingerprint generation succeeds.
    duplicateInfo = reserveRequest(requestId, requestFingerprint, timestamp);
  } catch (error) {
    console.error("API MONITORING SETUP FAILED:", {
      requestId,
      ...getSafeErrorDetails(error),
    });
  }

  const operationTimings: OperationTiming[] = [];

  const operations: OperationRecorder = {
    measure: async <T>(
      name: string,
      operation: () => Promise<T>,
    ): Promise<T> => {
      const { result, timing } = await measureOperation(name, operation);

      operationTimings.push(timing);

      return result;
    },
  };

  const createLog = (status: number, duration: number) => ({
    id: requestId,
    method: request.method,
    path: getSafeApiPath(request),
    status,
    duration,
    timestamp,
    userAgent:
      request.headers
        .get("user-agent")
        ?.replace(/[\r\n\t]/g, " ")
        .slice(0, 200) || undefined,
    requestFingerprint,
    isDuplicate: duplicateInfo.isDuplicate,
    duplicateOf: duplicateInfo.duplicateOf,
    duplicateCount: duplicateInfo.duplicateCount,
    operations: [...operationTimings],
  });

  let response: T;

  // Only the actual API handler belongs in this try/catch.
  try {
    response = await handler(operations);
  } catch (error) {
    const duration = Math.round(performance.now() - start);

    const log = createLog(500, duration);

    console.error("API MONITOR HANDLER ERROR:", {
      requestId,
      method: request.method,
      status: 500,
      duration,
      ...getSafeErrorDetails(error),
    });

    safelyProcessMonitoringLog(
      () => createLog(500, duration),
      request.url,
      requestId,
    );

    processMonitoringLog(log, request.url);

    // Preserve the original handler error.
    throw error;
  }

  // A successful handler stays successful even if monitoring fails.
  const duration = Math.round(performance.now() - start);

  safelyProcessMonitoringLog(
    () => createLog(response.status, duration),
    request.url,
    requestId,
  );

  return response;
}

export function withApiMonitoring<T extends ApiRouteHandler>(handler: T): T {
  const wrappedHandler = async (request: Request, context?: unknown) => {
    return monitorApi(request, (operations) =>
      Promise.resolve(handler(request, context, operations)),
    );
  };

  return wrappedHandler as T;
}
