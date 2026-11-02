
import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  adminAc,
} from "better-auth/plugins/admin/access";

const statement = {
  ...defaultStatements,

  // Blog permissions
  posts: ["update", "generate"],

  // AI agent permissions
  agent: [
    "dashboard-read",
    "logs-read",
    "issues-manage",
  ],
} as const;

export const ac = createAccessControl(statement);

// Administrator: full administrative and application permissions.
export const admin = ac.newRole({
  ...adminAc.statements,
  posts: ["update", "generate"],
  agent: [
    "dashboard-read",
    "logs-read",
    "issues-manage",
  ],
});

// Ordinary user: no permissions initially.
export const user = ac.newRole({});
