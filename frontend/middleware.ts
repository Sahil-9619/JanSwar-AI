import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    // We match nothing or basic match to keep it a no-op
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
