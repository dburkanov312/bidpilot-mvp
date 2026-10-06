import "./globals.css";

export const metadata = {
  title: "BidPilot",
  description: "AI-powered vehicle underwriting for auto dealers",
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
