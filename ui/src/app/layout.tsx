import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const lexend = Lexend({
  subsets: ["latin"],
  variable: '--font-lexend',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: "Nocostcoin | Zero-Fee Blockchain",
  description: "The world's first truly zero-fee blockchain network with Hidden Leader Election and Proof of Determinism.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script id="error-suppression" strategy="beforeInteractive">
          {`
            // Suppress MetaMask extension errors
            window.addEventListener('error', function(e) {
              if (e.message && (e.message.includes('MetaMask') || e.message.includes('ethereum'))) {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }
            });
            window.addEventListener('unhandledrejection', function(e) {
              if (e.reason && e.reason.message && (e.reason.message.includes('MetaMask') || e.reason.message.includes('ethereum'))) {
                e.preventDefault();
                return false;
              }
            });
          `}
        </Script>
      </head>
      <body className={lexend.variable}>
        {children}
      </body>
    </html>
  );
}
