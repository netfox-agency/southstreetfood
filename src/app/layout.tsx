import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "SOUTH STREET FOOD | Commandez en ligne",
    template: "%s | SOUTH STREET FOOD",
  },
  description:
    "Burgers, tacos et wraps artisanaux a Bayonne. Commandez en click & collect ou livraison sur Bayonne-Anglet-Biarritz. Ouvert jusqu'a 4h du matin.",
  keywords: [
    "restaurant",
    "bayonne",
    "burger",
    "tacos",
    "wraps",
    "livraison",
    "click and collect",
    "street food",
  ],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "SOUTH STREET FOOD",
    title: "SOUTH STREET FOOD | Le street food de Bayonne",
    description:
      "Commandez vos burgers, tacos et wraps en ligne. Livraison sur BAB jusqu'a 4h.",
    images: [
      {
        url: "/brand/og-image.png",
        width: 1200,
        height: 630,
        alt: "South Street Food",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SOUTH STREET FOOD | Le street food de Bayonne",
    description:
      "Commandez vos burgers, tacos et wraps en ligne. Livraison sur BAB jusqu'a 4h.",
    images: ["/brand/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans min-h-dvh flex flex-col antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              className: "!rounded-xl !border-border",
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
