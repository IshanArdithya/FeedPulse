import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FeedPulse",
  description: "AI-powered product feedback platform",
};

import { CircleCheck, TriangleAlert } from "lucide-react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} text-foreground bg-background font-sans antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full">
        {children}
        <Toaster
          closeButton
          position="bottom-right"
          richColors
          icons={{
            success: <CircleCheck className="text-emerald-500" />,
            error: <TriangleAlert className="text-red-500" />,
          }}
          toastOptions={{
            classNames: {
              toast:
                "group toast group-[.toaster]:bg-white/40! group-[.toaster]:backdrop-blur-xl! group-[.toaster]:border-white/20! group-[.toaster]:shadow-2xl! group-[.toaster]:rounded-2xl! group-[.toaster]:p-4! group-[.toaster]:text-(--ink)!",
              description: "group-[.toast]:text-(--muted-strong)!",
              actionButton:
                "group-[.toast]:bg-(--ink)! group-[.toast]:text-white! group-[.toast]:rounded-xl!",
              cancelButton:
                "group-[.toast]:bg-(--line)! group-[.toast]:text-(--ink)!",
              icon: "group-[.toast]:bg-white/50! group-[.toast]:rounded-full! group-[.toast]:p-1! group-[.toast]:mr-3!",
            },
          }}
        />
      </body>
    </html>
  );
}
