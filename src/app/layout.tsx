import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed, Azeret_Mono } from "next/font/google";
import "./globals.css";
import { Ocean } from "@/components/Ocean";

const barlow = Barlow({
  subsets: ["latin"], weight: ["400", "500", "600"],
  variable: "--font-barlow", display: "swap",
});
const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"], weight: ["400", "500", "600"],
  variable: "--font-barlow-condensed", display: "swap",
});
const azeret = Azeret_Mono({
  subsets: ["latin"], weight: ["400", "500"],
  variable: "--font-azeret", display: "swap",
});

export const metadata: Metadata = {
  title: "Voxmorph · Speak Once, Send Everywhere",
  description:
    "Say it once and read it back on six channels: the verbatim floor feed plus five audiences, every one of them a separate llm_instruction on the AssemblyAI Dictation API.",
  applicationName: "Voxmorph",
  openGraph: {
    title: "Voxmorph · Speak Once, Send Everywhere",
    description: "One utterance, six channels. Built on the AssemblyAI Dictation API.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0C1A1D",
  width: "device-width",
  initialScale: 1,
  // No maximumScale: pinch-zoom stays available. The talk key suppresses
  // double-tap zoom locally via touch-action, which is the narrower tool.
};

/**
 * The direction contract. Audit it in the built HTML, not just in source.
 */
const DIRECTION_CONTRACT = `<!--
THESIS: A delegate console, where one speaker enters the room and every listener
turns to the channel they understand. Refuses the dashboard of equal tinted cards
that every AI tool ships.
OWN-WORLD: Dimmed hall ground, anodized panel with a vertical brush and a lit top
bevel, engraved condensed legends, numbered channel strips whose only colour is a
6px lamp. Barlow Condensed legends, Barlow body, Azeret Mono for the floor feed and
every numeral. One 2px machined radius; the talk key is the sole circle because it
is a physical button.
STORY: The visitor sees the floor feed carrying their own words verbatim, watches
five channels patch into the rack, and takes the one they need.
FIRST VIEWPORT: Console header with live tally at top. Below it the floor channel
full width, verbatim, filler struck by the API's own cleanup. Below that the
channel rack as rows, not a grid. Talk key fixed bottom centre.
FORM: The Interpretation Booth, rank 1 of 7 grounded directions, chosen by the user
over the dealt assignment. Seed key a1160fda.
SIGNATURE INTERACTION: Hold the talk key; its ring is a level arc driven by real
mic RMS, and channels patch into the rack one at a time as each API call lands.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish
review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
-->`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${barlow.variable} ${barlowCondensed.variable} ${azeret.variable}`}
    >
      <body className="min-h-dvh font-sans antialiased">
        {/* Direction contract. React strips JSX comments from the emitted markup,
            so it ships inside an inert hidden node to stay auditable in the built
            HTML, per the skill's "survives the production build" rule. */}
        <div hidden dangerouslySetInnerHTML={{ __html: DIRECTION_CONTRACT }} />
        <Ocean />
        {children}
      </body>
    </html>
  );
}
