import { Geist, Geist_Mono, Abhaya_Libre } from "next/font/google";
import "./globals.css";
import "@relayprotocol/relay-kit-ui/styles.css";
import Navigation from "./components/Navigation";
import AppProviders from "./providers/AppProviders";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const abhayaLibre = Abhaya_Libre({
  variable: "--font-abhaya-libre",
  subsets: ["latin"],
  weight: ["800"],
});

export const metadata = {
  title: "OakSoft DeFi",
  description: "Decentralized Finance Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${abhayaLibre.variable} antialiased bg-gray-50 dark:bg-gray-900`}
      >
        <AppProviders>
          <Navigation />
          <main className="min-h-screen">{children}</main>
        </AppProviders>
      </body>
    </html>
  );
}
