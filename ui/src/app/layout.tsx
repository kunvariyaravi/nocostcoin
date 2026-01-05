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
  metadataBase: new URL('https://nocostcoin.com'),
  title: {
    default: "Nocostcoin | Zero-Fee Blockchain",
    template: "%s | Nocostcoin"
  },
  description: "The world's first truly zero-fee blockchain network. Experience instant, cost-free transactions with our revolutionary Proof of Determinism consensus.",
  keywords: ["Blockchain", "Zero-fee", "Crypto", "Decentralized", "Nocostcoin", "NCC", "Proof of Determinism", "Web3"],
  authors: [{ name: "Nocostcoin Team" }],
  creator: "Nocostcoin Team",
  publisher: "Nocostcoin Foundation",
  openGraph: {
    title: "Nocostcoin | Zero-Fee Blockchain",
    description: "The world's first truly zero-fee blockchain network. Experience instant, cost-free transactions.",
    url: 'https://nocostcoin.com',
    siteName: 'Nocostcoin',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Nocostcoin - Zero Fee Blockchain',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Nocostcoin | Zero-Fee Blockchain",
    description: "The world's first truly zero-fee blockchain network.",
    images: ['/opengraph-image.png'],
    creator: '@nocostcoin',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
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
