import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Regul Arena, apprenez la régulation bancaire UEMOA et CEMAC",
    template: "%s | Regul Arena",
  },
  description:
    "Plateforme de quiz, duels et tournois sur la régulation bancaire en zone UEMOA et CEMAC. Formation continue pour banquiers, régulateurs et étudiants en finance.",
  keywords: [
    "UEMOA",
    "CEMAC",
    "BCEAO",
    "BEAC",
    "Bâle",
    "prudentiel",
    "quiz régulation",
    "formation bancaire",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning className={inter.variable}>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
