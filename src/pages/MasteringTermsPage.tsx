import React from 'react';
import { Sliders, AlertTriangle } from 'lucide-react';
import { MASTERING_PRICE, SUPPORT_EMAIL } from '../lib/licenseConstants';

export const MasteringTermsPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-14 space-y-8 text-zinc-300 text-xs sm:text-sm leading-relaxed">
      <div className="border-b border-zinc-800 pb-6 space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
          Engineering Terms
        </span>
        <h1 className="font-['Syne'] text-3xl sm:text-4xl font-extrabold text-white">
          Stereo Audio Mastering Service Terms
        </h1>
        <p className="text-xs text-zinc-400">Professional Stereo Mastering Engineering</p>
      </div>

      <div className="rounded-xl border-2 border-amber-500/50 bg-amber-500/10 p-6 flex items-start gap-4 text-xs text-amber-200">
        <AlertTriangle className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <strong className="block text-sm sm:text-base text-amber-300 font-bold uppercase tracking-wider">
            Important Notice: Mastering Only — Mixing Is Not Offered
          </strong>
          <p className="leading-relaxed text-amber-100/95">
            CELLY provides stereo mastering engineering exclusively. <strong>Mixing is not offered</strong>. Clients must provide a completed, finalized stereo mix. <strong>CELLY is not responsible for the mix quality</strong>, balance of individual tracks, vocal levels, or raw stem phase issues. We work solely with your final stereo bounce to provide the final commercial master polish, tonal balance, and streaming loudness.
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="font-['Syne'] text-lg font-bold text-white">1. Mix Submission Specifications</h2>
        <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
          <li><strong>Format:</strong> 24-bit or 32-bit float stereo WAV or AIFF file at native sample rate (44.1kHz, 48kHz, 88.2kHz, or 96kHz). MP3 submissions are strongly discouraged.</li>
          <li><strong>Headroom:</strong> Peaks must not exceed <strong>-6.0 dBFS to -3.0 dBFS</strong>. Files that clip above 0 dBFS or arrive pre-limited will be rejected for re-export.</li>
          <li><strong>Master Bus Processing:</strong> Turn off all brickwall limiters, clippers, and aggressive dynamic compressors on the stereo master output channel before bouncing.</li>
          <li><strong>Fades:</strong> Ensure song starts and ends do not cut off reverb tails or drum decays abruptly.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-['Syne'] text-lg font-bold text-white">2. Deliverables &amp; Turnaround</h2>
        <p>
          Mastering projects are typically delivered within <strong>24 to 48 hours</strong> from receipt of a compliant audio file. Final deliverables include:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-zinc-400">
          <li>24-bit 44.1kHz Lossless Master WAV (optimized for Apple Digital Masters, Spotify, Tidal).</li>
          <li>320kbps MP3 file with embedded ID3 metadata.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-['Syne'] text-lg font-bold text-white">3. Revisions &amp; Support</h2>
        <p>
          Each order includes <strong>1 complimentary revision cycle</strong>. Revisions must be requested within 14 days of initial delivery.
        </p>
        <p>
          Direct inquiries to <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-400 underline font-mono">{SUPPORT_EMAIL}</a>.
        </p>
      </section>
    </div>
  );
};
