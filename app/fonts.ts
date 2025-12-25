/**
 * Centralized font loading for certificate templates
 * All Google Fonts used in certificate mappings must be loaded here
 * to ensure consistent rendering across mapping preview and certificate generation.
 */

import {
  Great_Vibes,
  Playfair_Display,
  Open_Sans,
  Roboto,
  Lato,
  Libre_Baskerville,
  Merriweather,
  Cormorant_Garamond,
  Allura,
  Pinyon_Script,
} from "next/font/google"

// Decorative/Script fonts for names and signatures
export const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
})

export const allura = Allura({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
})

export const pinyonScript = Pinyon_Script({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
})

// Serif fonts for headings and elegant text
export const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
})

export const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
})

export const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
})

export const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
})

// Sans-serif fonts for body text
export const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
})

export const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
})

export const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
})

/**
 * Combine all certificate font classes for global loading
 * Apply this to the <body> tag to ensure all fonts are available
 */
export const certificateFonts = [
  greatVibes.className,
  allura.className,
  pinyonScript.className,
  playfairDisplay.className,
  libreBaskerville.className,
  cormorantGaramond.className,
  merriweather.className,
  openSans.className,
  roboto.className,
  lato.className,
].join(" ")
