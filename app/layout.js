import { Geist, Geist_Mono, Abhaya_Libre } from "next/font/google";
import "./globals.css";
import "@relayprotocol/relay-kit-ui/styles.css";
import Navigation from "../components/Navigation";
import ClientOnly from "../components/ClientOnly";
import AppProviders from "../providers/AppProviders";

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
        suppressHydrationWarning={true}
      >
        <AppProviders>
          <ClientOnly
            fallback={
              <nav className="bg-white dark:bg-gray-900 shadow-sm relative">
                <div className="w-full">
                  <div className="flex justify-between h-16">
                    <div className="flex items-center">
                      {/* Skeleton Logo */}
                      <div className="flex-shrink-0 flex items-center">
                        <div className="hidden md:block w-64 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-11 mt-8"></div>
                        <div className="md:hidden w-44 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-6 mt-6"></div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {/* Skeleton Menu Button */}
                      <div className="w-6 h-4 bg-gray-200 dark:bg-gray-700 rounded mr-11 mt-8 hidden md:block"></div>
                      <div className="w-5 h-4 bg-gray-200 dark:bg-gray-700 rounded mr-6 mt-6 md:hidden"></div>
                    </div>
                  </div>
                </div>
              </nav>
            }
          >
            <Navigation />
          </ClientOnly>
          <main className="min-h-screen">{children}</main>
        </AppProviders>
      </body>
    </html>
  );
}
