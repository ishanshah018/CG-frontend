import "./globals.css"
import { Alegreya_Sans, Inter, Source_Sans_3 } from "next/font/google"
import { ConditionalLayout } from "@/components/conditional-layout"

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
      <body className={`${inter.className} ${alegreyaSans.variable} ${sourceSansPro.variable} antialiased`}>
        <ConditionalLayout>{children}</ConditionalLayout>
      </body>
    </html>
  )
}