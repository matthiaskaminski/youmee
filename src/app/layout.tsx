import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "Youmee Hub - Social Media Planner",
  description: "System zarządzania postami social media dla marki Youmee",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
