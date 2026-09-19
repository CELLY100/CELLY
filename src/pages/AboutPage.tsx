import React from 'react';
import { Disc3, Headphones, Award, Radio, Sliders, CheckCircle2 } from 'lucide-react';
import { PRODUCER_CREDIT, SUPPORT_EMAIL, MASTERING_PRICE } from '../lib/licenseConstants';

interface AboutPageProps {
  setCurrentTab: (tab: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ setCurrentTab }) => {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-14 space-y-16">
      {/* Intro */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-3.5 py-1 text-xs font-bold text-amber-400">
          <Disc3 className="h-3.5 w-3.5" />
          <span>About The Producer &amp; Studio</span>
        </div>

        <h1 className="font-['Syne'] text-4xl sm:text-5xl font-extrabold text-white">
          Sonic Architecture by CELLY
        </h1>

        <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
          Crafting punchy, dynamic, and emotionally evocative soundscapes for hip-hop, trap, R&amp;B, and cinematic scoring worldwide.
        </p>
      </div>

      {/* Story & Philosophy Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4 text-xs sm:text-sm text-zinc-300 leading-relaxed">
          <h2 className="font-['Syne'] text-2xl font-bold text-white">
            The Philosophy of Loudness &amp; Clarity
          </h2>
          <p>
            In modern streaming ecosystems, loudness without dynamic fidelity results in tired, flat productions. CELLY was built on the commitment to preserve transient punch, bass clarity, and vocal pocket separation.
          </p>
          <p>
            Every beat in the catalog is engineered from the ground up with dedicated room for artists to deliver lead vocals and layered harmonies. All beats are delivered untagged with commercial licensing terms and instant PDF agreements.
          </p>
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 text-xs text-amber-300">
            Mandatory production credit for all commercial works: <strong>"{PRODUCER_CREDIT}"</strong>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-4 shadow-xl">
          <h3 className="font-['Syne'] text-base font-bold text-white uppercase tracking-wider">
            Studio Hardware &amp; Monitoring
          </h3>
          <ul className="space-y-3 text-xs text-zinc-400">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Hardware Converters:</strong> High-resolution Burr-Brown / ESS Sabre mastering AD/DA converters.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Analog Processing:</strong> Solid State Logic G-Master Bus Compressor, Pultec EQP-1A tube equalization.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Monitoring:</strong> Focal Solo6 Be monitors paired with calibrated subwoofers and cross-checked on consumer AirPods and car systems.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Loudness Calibration:</strong> ITU-R BS.1770-4 certified true peak and integrated LUFS metering.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* CTA Box */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-950 p-8 sm:p-10 text-center space-y-4">
        <h3 className="font-['Syne'] text-2xl font-bold text-white">
          Ready to Work With CELLY?
        </h3>
        <p className="text-xs sm:text-sm text-zinc-300 max-w-xl mx-auto">
          Explore the beat store or send your completed stereo mix for professional mastering.
        </p>
        <div className="flex justify-center gap-4 pt-2">
          <button
            onClick={() => setCurrentTab('store')}
            className="rounded-lg bg-amber-500 px-6 py-2.5 text-xs font-bold text-black hover:bg-amber-400 transition-colors"
          >
            Browse Beats
          </button>
          <button
            onClick={() => setCurrentTab('mastering')}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-6 py-2.5 text-xs font-semibold text-white hover:bg-zinc-700"
          >
            Mastering Service
          </button>
        </div>
      </div>
    </div>
  );
};
