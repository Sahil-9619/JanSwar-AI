import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "JanSwar AI | Constituency Intelligence Platform",
  description: "Turning Every Citizen's Voice into Smarter Development Decisions.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className="min-h-screen flex flex-col custom-scrollbar overflow-x-hidden">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
