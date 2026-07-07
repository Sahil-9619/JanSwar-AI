import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

// Force dynamic rendering so Clerk is never evaluated during `next build`
// (it requires NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY which is not available at build time)
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "JanSwar AI | Constituency Intelligence Platform",
  description: "Turning Every Citizen's Voice into Smarter Development Decisions.",
  icons: {
    icon: "/favicon.ico",
  },
};

function isClerkConfigured() {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
  return key.startsWith("pk_") && !key.includes("placeholder");
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!isClerkConfigured()) {
    return (
      <html lang="en" className="dark">
        <body className="min-h-screen flex flex-col custom-scrollbar overflow-x-hidden">
          {children}
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col custom-scrollbar overflow-x-hidden">
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
