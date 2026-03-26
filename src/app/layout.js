import "./globals.css";

export const metadata = {
  title: "DIGANTA — College Event Management System",
  description: "From idea to execution to legacy — the complete college event lifecycle platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
