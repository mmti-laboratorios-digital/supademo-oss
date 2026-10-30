import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_BASE_URL ?? "http://localhost:3000"),
  title: {
    default: "EasyDemo — Demos interativas em PT-BR com PIX e LGPD",
    template: "%s · EasyDemo",
  },
  description:
    "Crie demos interativas do seu produto SaaS em minutos. Player PT-BR, pagamento PIX/boleto via Asaas, conformidade LGPD ponta a ponta.",
  applicationName: "EasyDemo",
  authors: [{ name: "EasyDemo" }],
  keywords: ["demo interativa", "tour interativo", "saas", "pixel brasileiro", "lgpd"],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    alternateLocale: ["en_US"],
    siteName: "EasyDemo",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ClerkProvider fica DENTRO do <body>, não envolvendo o <html>.
  // A Clerk exige isso no App Router (ver guia Next.js): com o provider fora,
  // o runtime Pages Router — que Next usa para exportar `/_error` e `/404` —
  // acaba renderizando o <Html> do next/document fora de contexto e o build
  // aborta com "<Html> should not be imported outside of pages/_document".
  return (
    <html lang="pt-BR" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-dvh font-sans antialiased">
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "#2563eb",
              borderRadius: "0.5rem",
              fontFamily: "Inter, system-ui, sans-serif",
            },
          }}
          localization={{
            locale: "pt-BR",
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
