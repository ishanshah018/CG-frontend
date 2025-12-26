import "./globals.css"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"

import { Alegreya_Sans, Inter, Source_Sans_3 } from "next/font/google"
import { Toaster } from "sonner"
import { certificateFonts } from "./fonts"

const alegreyaSans = Alegreya_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "700", "800"],
})

const sourceSansPro = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sidebar",
  weight: ["400", "600", "700"],
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${alegreyaSans.variable} ${sourceSansPro.variable} ${certificateFonts} antialiased`}>
        {children}
        <Toaster position="top-center" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}