import type { Metadata } from "next";
import "./globals.css";
import WalletProviderComponent from './walletProviderComponent';

export const metadata: Metadata = {
  title: "SolPunks on Solana",
  description: "SolPunks on Solana",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <WalletProviderComponent>{children}</WalletProviderComponent>
      </body>
    </html>
  );
}
