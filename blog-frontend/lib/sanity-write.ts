
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
