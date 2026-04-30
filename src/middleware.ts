import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
    const token = request.cookies.get("crm_token")?.value;
    const adminToken = process.env.ADMIN_TOKEN;

  // If no ADMIN_TOKEN is set, skip auth
  if (!adminToken) {
        return NextResponse.next();
  }

  // Check if token matches
  if (token === adminToken) {
        return NextResponse.next();
  }

  // API routes: return 401 JSON
  if (request.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Page routes: redirect to login
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
    matcher: [
          "/((?!form|privacy|login|api/webhooks|api/cron|api/auth|_next/static|_next/image|favicon.ico).*)",
        ],
};
