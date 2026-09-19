import React, { useState, useEffect } from 'react';
import { Play, Pause, Disc3, ShieldCheck, Sparkles, Sliders, ArrowRight, Check, Waves, Volume2, Headphones } from 'lucide-react';
import { Beat, LicenseTierKey } from '../types';
import { LICENSE_TIERS, PRODUCER_CREDIT, MASTERING_PRICE, SUPPORT_EMAIL } from '../lib/licenseConstants';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useCart } from '../context/CartContext';

interface HomePageProps {
  setCurrentTab: (tab: string) => void;
  onOpenLicenseModal: (beat: Beat) => void;
  onSelectBeatDetail: (slug: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  setCurrentTab,
  onOpenLicenseModal,
  onSelectBeatDetail,
}) => {
  const [featuredBeats, setFeaturedBeats] = useState<Beat[]>([]);
  const [masteringMode, setMasteringMode] = useState<'before' | 'after'>('after');
  const [isLoading, setIsLoading] = useState(true);

  const { currentBeat, isPlaying, playBeat } = useAudioPlayer();
  const { addMasteringOrder } = useCart();

  useEffect(() => {
    fetch('/api/beats')
      .then((r) => r.json())
      .then((data) => {
        setFeaturedBeats(data.beats || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const topBeat = featuredBeats[0];

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Glow ambient effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-[600px] rounded-full bg-amber-500/10 blur-[130px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 h-64 w-64 rounded-full bg-amber-600/5 blur-[100px] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold text-amber-400">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Commercial Beat Store &amp; Professional Mastering</span>
              </div>

              <h1 className="font-['Syne'] text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08]">
                INDUSTRY SOUNDS.<br />
                <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
                  PROD. BY CELLY.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-zinc-300 max-w-2xl leading-relaxed">
                Premium multi-track beats with instant legal PDF licensing agreements, and analog-calibrated stereo audio mastering for only <strong>${MASTERING_PRICE}</strong>.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => setCurrentTab('store')}
                  className="flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-3.5 text-sm font-bold text-black hover:bg-amber-400 transition-all shadow-lg hover:shadow-amber-500/20 active:scale-95"
                >
                  <Disc3 className="h-4 w-4" />
                  <span>Explore Beat Catalog</span>
                </button>

                <button
                  onClick={() => setCurrentTab('mastering')}
                  className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/80 px-6 py-3.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white hover:border-zinc-600 transition-all"
                >
                  <Sliders className="h-4 w-4 text-amber-400" />
                  <span>Stereo Mastering (${MASTERING_PRICE})</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-4 text-xs text-zinc-400 border-t border-zinc-800/80">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Instant Legal PDF Agreement</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Waves className="h-4 w-4 text-amber-400" />
                  <span>24-bit 44.1kHz Lossless Audio</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Headphones className="h-4 w-4 text-blue-400" />
                  <span>Commercial Streaming Ready</span>
                </div>
              </div>
            </div>

            {/* Right Hero Spotlight Card */}
            {topBeat ? (
              <div className="lg:col-span-5">
                <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-xl shadow-2xl space-y-5">
                  <div className="relative aspect-square overflow-hidden rounded-xl border border-zinc-800 group">
                    <img
                      src={topBeat.artworkUrl}
                      alt={topBeat.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    {/* Floating Play Button */}
                    <button
                      onClick={() => playBeat(topBeat)}
                      className="absolute bottom-4 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-black shadow-xl hover:scale-105 transition-all active:scale-95"
                    >
                      {currentBeat?.id === topBeat.id && isPlaying ? (
                        <Pause className="h-6 w-6 fill-black" />
                      ) : (
                        <Play className="h-6 w-6 fill-black ml-1" />
                      )}
                    </button>

                    <div className="absolute bottom-4 left-4 text-left">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
                        Featured Release
                      </span>
                      <h3 className="font-['Syne'] text-xl font-bold text-white">
                        {topBeat.title}
                      </h3>
                      <p className="text-xs text-zinc-300">
                        {topBeat.genre} • {topBeat.bpm} BPM • {topBeat.key}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">
                        Licenses Starting From
                      </span>
                      <span className="text-2xl font-mono font-extrabold text-amber-400">
                        ${topBeat.basePrice.toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => onOpenLicenseModal(topBeat)}
                      className="rounded-lg bg-amber-500/20 border border-amber-500/40 px-5 py-2.5 text-xs font-bold text-amber-300 hover:bg-amber-500 hover:text-black transition-colors"
                    >
                      Get License
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="lg:col-span-5">
                <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 backdrop-blur-xl shadow-2xl space-y-6 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <Disc3 className="h-8 w-8 animate-[spin_8s_linear_infinite]" />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[11px] uppercase font-bold tracking-widest text-amber-400">
                      CELLY Audio Lab
                    </span>
                    <h3 className="font-['Syne'] text-xl font-bold text-white">
                      Original Beat Catalog
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
                      Catalog is primed for producer uploads. Use the private Admin Studio to upload custom instrumentals, WAV stems, and artwork.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-center gap-3">
                    <button
                      onClick={() => setCurrentTab('mastering')}
                      className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors"
                    >
                      Book Stereo Mastering
                    </button>
                    <button
                      onClick={() => setCurrentTab('licensing')}
                      className="px-4 py-2.5 rounded-lg border border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold transition-colors"
                    >
                      View License Terms
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Beats Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Handcrafted Instrumentals
            </span>
            <h2 className="font-['Syne'] text-3xl font-bold text-white mt-1">
              Trending Beats
            </h2>
          </div>
          <button
            onClick={() => setCurrentTab('store')}
            className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 group"
          >
            <span>View Full Catalog</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Beats Grid */}
        {featuredBeats.length === 0 ? (
          <div className="py-16 text-center space-y-3 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 max-w-xl mx-auto p-8">
            <Disc3 className="h-10 w-10 text-amber-500/60 mx-auto animate-[spin_8s_linear_infinite]" />
            <h3 className="font-['Syne'] text-lg font-bold text-white">Store Ready For New Beats</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Existing catalog beats have been cleared. As soon as you upload your new beats in the Admin Studio, they will appear here and in the Beat Store automatically.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setCurrentTab('store')}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
              >
                Go to Beat Store
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredBeats.slice(0, 6).map((beat) => {
            const isCurrentlyPlaying = currentBeat?.id === beat.id && isPlaying;
            return (
              <div
                key={beat.id}
                className="group relative rounded-xl border border-zinc-800/90 bg-zinc-900/40 p-4 hover:border-zinc-700 transition-all hover:shadow-lg flex flex-col justify-between"
              >
                <div>
                  {/* Artwork + Play Overlay */}
                  <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
                    <img
                      src={beat.artworkUrl}
                      alt={beat.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => playBeat(beat)}
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-black shadow-lg hover:scale-105 transition-transform"
                      >
                        {isCurrentlyPlaying ? (
                          <Pause className="h-5 w-5 fill-black" />
                        ) : (
                          <Play className="h-5 w-5 fill-black ml-0.5" />
                        )}
                      </button>
                    </div>

                    {beat.status === 'exclusive_sold' ? (
                      <div className="absolute top-2.5 right-2.5 rounded bg-red-900/90 border border-red-700 px-2 py-0.5 text-[10px] font-bold text-red-100 uppercase tracking-wider">
                        Exclusive Sold
                      </div>
                    ) : (
                      beat.isNewRelease && (
                        <div className="absolute top-2.5 right-2.5 rounded bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-black uppercase tracking-wider">
                          New
                        </div>
                      )
                    )}
                  </div>

                  {/* Info */}
                  <div className="mt-3.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => onSelectBeatDetail(beat.slug)}
                        className="text-left font-['Syne'] text-base font-bold text-white hover:text-amber-400 transition-colors truncate"
                      >
                        {beat.title}
                      </button>
                    </div>

                    <p className="text-xs text-amber-400/90 font-medium">
                      {PRODUCER_CREDIT}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 pt-1">
                      <span>{beat.genre}</span>
                      <span>•</span>
                      <span>{beat.bpm} BPM</span>
                      <span>•</span>
                      <span>{beat.key}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Bar */}
                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <div className="font-mono text-sm font-bold text-zinc-200">
                    {beat.status === 'exclusive_sold' ? (
                      <span className="text-xs text-zinc-400">Unavailable</span>
                    ) : (
                      <span>From ${beat.basePrice.toFixed(2)}</span>
                    )}
                  </div>

                  {beat.status === 'exclusive_sold' ? (
                    <span className="text-[11px] font-semibold text-zinc-400">
                      Sold Out
                    </span>
                  ) : (
                    <button
                      onClick={() => onOpenLicenseModal(beat)}
                      className="rounded-md bg-zinc-800 hover:bg-amber-500 hover:text-black text-zinc-200 px-3 py-1.5 text-xs font-semibold transition-colors"
                    >
                      License
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        )}
      </section>

      {/* Mastering Service Feature Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/90 via-[#0e1017] to-zinc-950 p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-5 text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-400">
                <Sliders className="h-3.5 w-3.5" />
                <span>Professional Stereo Mastering • Only ${MASTERING_PRICE}</span>
              </div>

              <h2 className="font-['Syne'] text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                Stream-Ready Loudness.<br />
                Uncompromised Dynamic Punch.
              </h2>

              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                Take your completed stereo mix to competitive commercial release standards. Delivered within 24–48 hours in pristine 24-bit WAV &amp; 320kbps MP3 formats.
              </p>

              {/* Crucial Notice */}
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-200">
                <strong>Important:</strong> CELLY provides professional <em>Mastering Services only</em>. We do not provide mixing services. You submit a balanced, unclipped stereo mix with -6dB headroom.
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => setCurrentTab('mastering')}
                  className="rounded-lg bg-amber-500 px-6 py-3 text-sm font-bold text-black hover:bg-amber-400 transition-colors shadow-md"
                >
                  Order Mastering (${MASTERING_PRICE})
                </button>
                <button
                  onClick={() => setCurrentTab('mastering-terms')}
                  className="text-xs text-zinc-400 hover:text-white underline underline-offset-4"
                >
                  View Mix Submission Guidelines
                </button>
              </div>
            </div>

            {/* Interactive Before / After Demo Box */}
            <div className="lg:col-span-5 rounded-xl border border-zinc-800 bg-zinc-950/80 p-6 space-y-6">
              <div className="text-center space-y-1">
                <h4 className="font-['Syne'] text-base font-bold text-white">
                  Audio Comparison Demo
                </h4>
                <p className="text-xs text-zinc-400">
                  Listen to the difference in analog stereo imaging and loudness
                </p>
              </div>

              {/* Toggle Switch */}
              <div className="flex rounded-lg bg-zinc-900 p-1 border border-zinc-800">
                <button
                  onClick={() => setMasteringMode('before')}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
                    masteringMode === 'before'
                      ? 'bg-zinc-800 text-zinc-200 shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Raw Mix (-6dB Peak)
                </button>
                <button
                  onClick={() => setMasteringMode('after')}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
                    masteringMode === 'after'
                      ? 'bg-amber-500 text-black shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  CELLY Master (-14 LUFS)
                </button>
              </div>

              {/* Audio Visualizer Mock */}
              <div className="h-24 rounded-lg bg-zinc-900 border border-zinc-800 p-4 flex items-center justify-center relative overflow-hidden">
                <div className="flex items-end gap-1 h-12">
                  {[20, 35, 45, 60, 80, 50, 65, 90, 75, 55, 40, 70, 85, 95, 60, 45, 80, 90, 75, 40].map((h, i) => (
                    <div
                      key={i}
                      className={`w-1.5 rounded-full transition-all duration-300 ${
                        masteringMode === 'after'
                          ? 'bg-amber-400'
                          : 'bg-zinc-600'
                      }`}
                      style={{ height: `${masteringMode === 'after' ? h : h * 0.55}%` }}
                    />
                  ))}
                </div>
                <div className="absolute top-2 right-3 text-[10px] font-mono text-zinc-400">
                  {masteringMode === 'after' ? 'LUFS: -13.8 (Streaming Optimal)' : 'LUFS: -22.4 (Unmastered)'}
                </div>
              </div>

              <div className="text-center">
                <p className="text-xs text-zinc-400">
                  {masteringMode === 'after'
                    ? '✨ Enhanced low-end tightness, harmonic saturation, and stereo spread.'
                    : '🔈 Quieter pre-master stereo file without bus limiter or final EQ.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5 License Tiers Overview */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
            Transparent Pricing
          </span>
          <h2 className="font-['Syne'] text-3xl font-bold text-white">
            Choose Your Commercial License
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Every purchase includes instant untagged files and an immutable, legally binding PDF agreement signed by CELLY.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {(['mp3', 'wav', 'premium', 'unlimited', 'exclusive'] as LicenseTierKey[]).map((tierKey) => {
            const tier = LICENSE_TIERS[tierKey];
            const isHighlight = tierKey === 'premium' || tierKey === 'unlimited';
            return (
              <div
                key={tierKey}
                className={`rounded-xl border p-5 flex flex-col justify-between space-y-4 transition-all ${
                  isHighlight
                    ? 'border-amber-500/60 bg-zinc-900/80 shadow-lg'
                    : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      {tierKey}
                    </span>
                    {isHighlight && (
                      <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                        Popular
                      </span>
                    )}
                  </div>

                  <h3 className="font-['Syne'] text-lg font-bold text-white mt-1">
                    {tier.name.replace(' License', '')}
                  </h3>

                  <div className="mt-2 font-mono text-2xl font-extrabold text-white">
                    ${tier.price.toFixed(2)}
                  </div>

                  <p className="text-[11px] text-zinc-400 mt-1 pb-3 border-b border-zinc-800">
                    {tier.filesDescription}
                  </p>

                  <ul className="space-y-2 text-xs text-zinc-300 pt-3">
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span>{tier.streamingLimit}</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span>{tier.distributionLimit}</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span>{tier.videoLimit}</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span>{tier.youtubeChannels}</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => setCurrentTab('store')}
                  className="w-full rounded-md bg-zinc-800 hover:bg-amber-500 hover:text-black text-white py-2 text-xs font-bold transition-colors"
                >
                  Browse Beats
                </button>
              </div>
            );
          })}
        </div>

        <div className="text-center pt-2">
          <button
            onClick={() => setCurrentTab('licensing')}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-4"
          >
            Compare Full Licensing Terms &amp; Royalty Rights Matrix →
          </button>
        </div>
      </section>
    </div>
  );
};
