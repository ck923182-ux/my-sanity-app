// lib/sanity-write.ts
//
// A SEPARATE client from lib/sanity.ts. That one is read-only and public
// (NEXT_PUBLIC_* env vars, safe to ship to the browser). This one holds a
// write token and must only ever be imported from server-side code
// (API routes, Route Handlers) — never from a client component.

import { createClient } from "@sanity/client";

if (!process.env.SANITY_WRITE_TOKEN) {
  throw new Error(
    "SANITY_WRITE_TOKEN is not set. Create one in manage.sanity.io with " +
      "'Editor' or 'Create' permissions — do NOT reuse a public read token."
  );
}

export const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});
