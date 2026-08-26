import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aegis Procure — ZK Sealed-Bid Auctions",
  description:
    "Trustless procurement on the Midnight blockchain. Zero bid leakage. Mathematical certainty.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen`}>
        <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold tracking-tight text-white">
            🔒 Aegis Procure
          </a>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="/create" className="hover:text-white transition-colors">
              Create Auction
            </a>
            <a
              href="https://midnight.network"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Midnight Network ↗
            </a>
          </div>
        </nav>
        <main>{children}</main>
        <footer className="border-t border-gray-800 px-6 py-6 text-center text-xs text-gray-600 mt-20">
          Built on{" "}
          <span className="text-purple-400">Midnight Blockchain</span> · ZK
          Proofs by Compact · Wallet: Lace DApp Connector
        </footer>
      </body>
    </html>
  );
}
