import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/citizen-dashboard(.*)",
  "/mp-dashboard(.*)",
  "/admin-dashboard(.*)",
]);

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
const isClerkConfigured = clerkKey.startsWith("pk_") && !clerkKey.includes("placeholder");

const authMiddleware = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
});

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  if (!isClerkConfigured) {
    const url = new URL(req.url);
    if (isProtectedRoute(req)) {
      url.pathname = "/login";
      url.searchParams.set("setup", "clerk");
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  return authMiddleware(req, event);
}

export const config = {
  matcher: [
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
    // Skip static assets and internals, run middleware on everything else
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
