import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Sistem Manajemen KPPM — Telkom University",
  description: "Sistem informasi manajemen Kerja Praktik dan Magang (KPPM) Telkom University untuk mahasiswa, dosen pembimbing, dan mentor perusahaan.",
  keywords: "KPPM, Telkom University, Kerja Praktik, Magang, Sistem Manajemen",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full" suppressHydrationWarning>
      <body className="h-full antialiased dark:bg-slate-900 transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

