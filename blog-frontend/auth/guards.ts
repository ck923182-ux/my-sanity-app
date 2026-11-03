
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Get the currently authenticated session.
export async function getCurrentSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

// Check whether a user has the admin role.
function hasAdminRole(role: string | undefined | null) {
  if (!role) return false;

  return role.split(",").includes("admin");
}

// Protect server-rendered pages and Server Actions.
export async function requireAdmin() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (!hasAdminRole(session.user.role)) {
    redirect("/unauthorized");
  }

  return session;
}

// Protect API routes using their incoming request headers.
export async function getAdminSession(requestHeaders: Headers) {
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session || !hasAdminRole(session.user.role)) {
    return null;
  }

  return session;
}

// Protect API routes with administrator authentication.
export async function authorizeAdminApi(): Promise<NextResponse | null> {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json(
      {
        success: false,
        message: "Authentication required.",
      },
      { status: 401 }
    );
  }

  if (!hasAdminRole(session.user.role)) {
    return NextResponse.json(
      {
        success: false,
        message: "Administrator access required.",
      },
      { status: 403 }
    );
  }

  return null;
}