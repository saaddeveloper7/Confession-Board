import { Inter, Sora } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

export const metadata = {
  title: "Confession Board",
  description: "Anonymous confessions, posted by silent foxes.",
};

// Runs before first paint to apply the saved theme, preventing a flash of the
// wrong theme. Static, developer-authored string (no user input) — not an XSS
// vector. Falls back to "light" if nothing is stored or storage is blocked.
const themeInitScript = `
(function () {
  try {
    var t = localStorage.getItem('theme');
    var allowed = ['light', 'dark', 'midnight', 'warm'];
    document.documentElement.setAttribute(
      'data-theme',
      allowed.indexOf(t) !== -1 ? t : 'light'
    );
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${inter.variable} ${sora.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full bg-bg text-text">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
