
import { betterAuth } from "better-auth";
import { admin as adminPlugin } from "better-auth/plugins";

import { db } from "@/agent/runtime/database";
import { ac, admin, user } from "@/auth/permissions";

const secret = process.env.BETTER_AUTH_SECRET;

if (!secret || secret.length < 32) {
  throw new Error(
    "BETTER_AUTH_SECRET must contain at least 32 characters."
  );
}

export const auth = betterAuth({
  database: db,

  secret,

  baseURL:
    process.env.BETTER_AUTH_URL || "http://localhost:3000",

  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
  ],

  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 12,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },

  plugins: [
    adminPlugin({
      ac,
      roles: {
        admin,
        user,
      },
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
  ],
});
