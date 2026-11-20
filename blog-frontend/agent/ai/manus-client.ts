
const MANUS_BASE_URL = "https://api.manus.ai/v2";

const DEFAULT_TIMEOUT_MS = 30_000;

export type ManusApiResponse = {
  ok: boolean;
  [key: string]: unknown;
};

export class ManusRequestError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "CONFIGURATION_ERROR"
      | "TIMEOUT"
      | "NETWORK_ERROR"
      | "HTTP_ERROR"
      | "INVALID_RESPONSE",
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ManusRequestError";
  }
}

export async function manusRequest(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<ManusApiResponse> {
  const apiKey = process.env.MANUS_API_KEY;

  if (!apiKey) {
    throw new ManusRequestError(
      "Manus API configuration is missing.",
      "CONFIGURATION_ERROR",
    );
  }

  if (
    !Number.isInteger(timeoutMs) ||
    timeoutMs <= 0
  ) {
    throw new ManusRequestError(
      "Invalid Manus request timeout.",
      "CONFIGURATION_ERROR",
    );
  }

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    let response: Response;

    try {
      response = await fetch(
        `${MANUS_BASE_URL}/${endpoint}`,
        {
          ...options,
          headers: {
            "Content-Type": "application/json",
            "x-manus-api-key": apiKey,
            ...options.headers,
          },
          signal: controller.signal,
        },
      );
    } catch (error) {
      if (controller.signal.aborted) {
        throw new ManusRequestError(
          "Manus request timed out.",
          "TIMEOUT",
        );
      }

      throw new ManusRequestError(
        "Unable to connect to Manus API.",
        "NETWORK_ERROR",
      );
    }

    let data: unknown;

    try {
      data = await response.json();
    } catch {
      throw new ManusRequestError(
        "Manus returned an invalid response.",
        "INVALID_RESPONSE",
        response.status,
      );
    }

    if (!response.ok) {
      throw new ManusRequestError(
        "Manus API request failed.",
        "HTTP_ERROR",
        response.status,
      );
    }

    if (
      typeof data !== "object" ||
      data === null ||
      !("ok" in data) ||
      data.ok !== true
    ) {
      throw new ManusRequestError(
        "Manus returned an unsuccessful response.",
        "INVALID_RESPONSE",
        response.status,
      );
    }

    return data as ManusApiResponse;
  } finally {
    clearTimeout(timeout);
  }
}
