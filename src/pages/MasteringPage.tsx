import React, { useState } from 'react';
import { Sliders, CheckCircle2, AlertTriangle, FileAudio, ArrowRight, ShieldCheck, Waves, Headphones, UploadCloud } from 'lucide-react';
import { MASTERING_PRICE, SUPPORT_EMAIL } from '../lib/licenseConstants';
import { useCart } from '../context/CartContext';

interface MasteringPageProps {
  onGoToCheckout: () => void;
  setCurrentTab: (tab: string) => void;
}

export const MasteringPage: React.FC<MasteringPageProps> = ({ onGoToCheckout, setCurrentTab }) => {
  const { addMasteringOrder } = useCart();
  const [songTitle, setSongTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [masteringMode, setMasteringMode] = useState<'before' | 'after'>('after');
  const [added, setAdded] = useState(false);

  const handleOrderMastering = (e: React.FormEvent) => {
    e.preventDefault();
    addMasteringOrder(songTitle || 'Untitled Stereo Mix', notes);
    setAdded(true);
    setTimeout(() => {
      onGoToCheckout();
    }, 400);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header Banner */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-3.5 py-1 text-xs font-bold text-amber-400">
          <Sliders className="h-3.5 w-3.5" />
          <span>Professional Analog &amp; Hybrid Stereo Mastering</span>
        </div>

        <h1 className="font-['Syne'] text-4xl sm:text-5xl font-extrabold text-white">
          Stereo Audio Mastering
        </h1>

        <p className="text-xs sm:text-base text-zinc-300 leading-relaxed">
          Competitive streaming volume, low-end punch, and high-frequency sparkle tailored for Spotify, Apple Music, and club systems. 24–48 hour turnaround with dedicated revisions.
        </p>
      </div>

      {/* Mandatory Prominent Notice: Mixing Not Offered */}
      <div className="rounded-xl border-2 border-amber-500/60 bg-amber-500/10 p-6 sm:p-7 flex items-start gap-4 shadow-xl max-w-4xl mx-auto">
        <AlertTriangle className="h-7 w-7 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-2">
          <h4 className="font-bold text-base text-amber-300 tracking-wide uppercase">
            Notice: Stereo Mastering Only — Mix Is NOT Offered
          </h4>
          <p className="text-xs sm:text-sm text-amber-100/95 leading-relaxed">
            Please be advised: <strong>Mixing is strictly not offered</strong>. Clients must have and provide a final, completed stereo mix. <strong>I am not responsible for the mix quality, balance, or tracking issues</strong>. My service is exclusively stereo mastering—taking your completed final mix and applying final EQ balance, analog coloration, stereo width, and streaming loudness optimization.
          </p>
          <div className="pt-1 flex items-center gap-2 text-xs font-semibold text-amber-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Submit a single 24-bit/32-bit float stereo WAV with at least -6dB to -3dB headroom.</span>
          </div>
        </div>
      </div>

      {/* Interactive Before & After Demo */}
      <div className="rounded-2xl border border-zinc-800 bg-[#0d0f17] p-8 sm:p-10 shadow-2xl max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-1">
          <h3 className="font-['Syne'] text-xl font-bold text-white">
            Audio Contrast Demo: Raw Mix vs. CELLY Master
          </h3>
          <p className="text-xs text-zinc-400">
            Toggle between the unmastered mix (-6dB peak headroom) and the finalized commercial master.
          </p>
        </div>

        <div className="flex rounded-lg bg-zinc-900 p-1 border border-zinc-800 max-w-md mx-auto">
          <button
            onClick={() => setMasteringMode('before')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-md transition-all ${
              masteringMode === 'before'
                ? 'bg-zinc-800 text-zinc-100 shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Raw Mix (-6dB FS Peak)
          </button>
          <button
            onClick={() => setMasteringMode('after')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-md transition-all ${
              masteringMode === 'after'
                ? 'bg-amber-500 text-black shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            CELLY Master (-14.0 LUFS)
          </button>
        </div>

        {/* Visual Waveform Comparison */}
        <div className="h-28 rounded-xl bg-zinc-950 border border-zinc-800/80 p-5 flex items-center justify-center relative overflow-hidden">
          <div className="flex items-end gap-1.5 h-16 w-full max-w-xl justify-center">
            {[15, 30, 45, 60, 80, 50, 70, 95, 85, 60, 40, 75, 90, 100, 65, 45, 80, 90, 75, 40, 60, 85, 90, 70, 50].map((h, i) => (
              <div
                key={i}
                className={`w-2 rounded-full transition-all duration-300 ${
                  masteringMode === 'after' ? 'bg-amber-400' : 'bg-zinc-700'
                }`}
                style={{ height: `${masteringMode === 'after' ? h : h * 0.5}%` }}
              />
            ))}
          </div>

          <div className="absolute top-3 right-4 font-mono text-[11px] text-zinc-400">
            {masteringMode === 'after' ? 'LUFS: -14.0 | Peak: -0.3 dBFS' : 'LUFS: -23.5 | Peak: -6.0 dBFS'}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-zinc-400 pt-2 text-center">
          <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/60">
            <span className="font-bold text-white block">Bass Precision</span>
            <span>Tightened sub harmonics for car and phone speakers</span>
          </div>
          <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/60">
            <span className="font-bold text-white block">Loudness Optimization</span>
            <span>Calibrated to streaming platform standards without distortion</span>
          </div>
          <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/60">
            <span className="font-bold text-white block">Stereo Imaging</span>
            <span>Expanded soundstage width with rock-solid center mono bass</span>
          </div>
        </div>
      </div>

      {/* Submission Guidelines 4-Step Grid */}
      <div className="max-w-5xl mx-auto space-y-6">
        <h3 className="font-['Syne'] text-2xl font-bold text-white text-center">
          Mix Preparation Checklist
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 font-bold font-mono">
              1
            </div>
            <h4 className="font-bold text-white text-sm">Leave Headroom</h4>
            <p className="text-zinc-400 leading-relaxed">
              Ensure your master fader is set to 0.0dB, and your loudest peak registers between <strong>-6dB to -3dB</strong>. Never let the mix clip above 0dBFS.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 font-bold font-mono">
              2
            </div>
            <h4 className="font-bold text-white text-sm">Disable Master Limiters</h4>
            <p className="text-zinc-400 leading-relaxed">
              Remove all brickwall limiters, clippers, and aggressive multiband compressors from the master bus to preserve dynamic headroom for analog processing.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 font-bold font-mono">
              3
            </div>
            <h4 className="font-bold text-white text-sm">Export Lossless WAV</h4>
            <p className="text-zinc-400 leading-relaxed">
              Export in <strong>24-bit or 32-bit float WAV/AIFF</strong> at 44.1kHz or 48kHz. Do not convert to MP3 before mastering.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 font-bold font-mono">
              4
            </div>
            <h4 className="font-bold text-white text-sm">Fast Turnaround</h4>
            <p className="text-zinc-400 leading-relaxed">
              Receive your final 24-bit WAV &amp; 320kbps MP3 within <strong>24 to 48 hours</strong>. Free revisions are included to dial in your target sound.
            </p>
          </div>
        </div>
      </div>

      {/* Order Booking Form Card */}
      <div className="max-w-xl mx-auto rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
            Book Service
          </span>
          <h3 className="font-['Syne'] text-2xl font-bold text-white">
            Order Stereo Mastering
          </h3>
          <p className="text-xs text-zinc-400">
            Only <strong className="text-amber-400 font-mono text-sm">${MASTERING_PRICE}</strong> per song. Upload files now or via your account after checkout.
          </p>
        </div>

        <form onSubmit={handleOrderMastering} className="space-y-4 text-xs">
          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              Song / Project Title <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              placeholder="e.g. Midnight Waves (Radio Mix)"
              className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              Engineer Notes / Reference Tracks (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Specify reference tracks, desired brightness, heavy bass emphasis, or specific platform targets..."
              className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3.5 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="p-3.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80 space-y-1">
            <div className="flex items-center justify-between font-bold text-sm">
              <span className="text-white">Service Fee</span>
              <span className="font-mono text-amber-400">${MASTERING_PRICE}.00</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Includes 24-bit WAV master, streaming MP3, metadata tagging, and 1 free revision.
            </p>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-500 py-3 text-xs font-bold text-black hover:bg-amber-400 transition-colors shadow-md"
          >
            <span>Proceed to Checkout (${MASTERING_PRICE})</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="text-[11px] text-center text-zinc-400">
          Questions or stem inquiries? Contact <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-400 underline">{SUPPORT_EMAIL}</a>
        </p>
      </div>
    </div>
  );
};
