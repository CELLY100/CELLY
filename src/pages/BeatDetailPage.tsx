import React, { useState, useEffect } from 'react';
import { Play, Pause, ShoppingBag, Share2, Check, ArrowLeft, ShieldCheck, FileText, Heart, Disc3 } from 'lucide-react';
import { Beat, LicenseTierKey } from '../types';
import { LICENSE_TIERS, PRODUCER_CREDIT } from '../lib/licenseConstants';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useCart } from '../context/CartContext';

interface BeatDetailPageProps {
  slug: string;
  onBackToStore: () => void;
  onViewAgreement: (tier: LicenseTierKey, beatTitle: string) => void;
  onGoToCheckout: () => void;
  onSelectBeatDetail: (slug: string) => void;
}

export const BeatDetailPage: React.FC<BeatDetailPageProps> = ({
  slug,
  onBackToStore,
  onViewAgreement,
  onGoToCheckout,
  onSelectBeatDetail,
}) => {
  const [beat, setBeat] = useState<Beat | null>(null);
  const [relatedBeats, setRelatedBeats] = useState<Beat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<LicenseTierKey>('mp3');
  const [copied, setCopied] = useState(false);
  const [addedToast, setAddedToast] = useState(false);

  const { currentBeat, isPlaying, playBeat } = useAudioPlayer();
  const { addBeatLicense } = useCart();

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/beats/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setBeat(data.beat || null);
        setRelatedBeats(data.relatedBeats || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, [slug]);

  if (isLoading) {
    return <div className="py-32 text-center text-zinc-500">Loading beat details...</div>;
  }

  if (!beat) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center space-y-4">
        <Disc3 className="h-12 w-12 text-zinc-600 mx-auto" />
        <h2 className="font-['Syne'] text-2xl font-bold text-white">Beat Not Found</h2>
        <p className="text-xs text-zinc-400">The requested beat could not be found or has been removed.</p>
        <button
          onClick={onBackToStore}
          className="rounded-lg bg-amber-500 px-5 py-2 text-xs font-bold text-black hover:bg-amber-400"
        >
          Return to Beat Store
        </button>
      </div>
    );
  }

  const isCurrentPlaying = currentBeat?.id === beat.id && isPlaying;
  const activeTierInfo = LICENSE_TIERS[selectedTier];

  const handleAddToCart = () => {
    addBeatLicense(beat.id, beat.title, beat.slug, beat.artworkUrl, selectedTier);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  const handleBuyNow = () => {
    addBeatLicense(beat.id, beat.title, beat.slug, beat.artworkUrl, selectedTier);
    onGoToCheckout();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Back Button */}
      <button
        onClick={onBackToStore}
        className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to All Beats</span>
      </button>

      {/* Main Beat Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Artwork & Player */}
        <div className="lg:col-span-5 space-y-6">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl group">
            <img
              src={beat.artworkUrl}
              alt={beat.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

            <button
              onClick={() => playBeat(beat)}
              className="absolute bottom-6 right-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500 text-black shadow-2xl hover:scale-105 transition-all active:scale-95"
            >
              {isCurrentPlaying ? (
                <Pause className="h-7 w-7 fill-black" />
              ) : (
                <Play className="h-7 w-7 fill-black ml-1" />
              )}
            </button>

            {beat.status === 'exclusive_sold' && (
              <div className="absolute top-4 left-4 rounded bg-red-950/90 border border-red-800 px-3 py-1 text-xs font-bold text-red-200">
                EXCLUSIVE LICENSE SOLD
              </div>
            )}
          </div>

          {/* Quick Details List */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-zinc-800/60">
              <span className="text-zinc-400">Tempo / BPM</span>
              <span className="font-mono text-white font-bold">{beat.bpm} BPM</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-800/60">
              <span className="text-zinc-400">Musical Key</span>
              <span className="font-mono text-white font-bold">{beat.key}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-800/60">
              <span className="text-zinc-400">Genre</span>
              <span className="text-white font-semibold">{beat.genre}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-800/60">
              <span className="text-zinc-400">Mood</span>
              <span className="text-zinc-300">{beat.mood}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-zinc-400">Mandatory Producer Credit</span>
              <span className="text-amber-400 font-semibold">{PRODUCER_CREDIT}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Title, Licensing Options, Cart */}
        <div className="lg:col-span-7 space-y-8">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                {beat.genre} Instrumental
              </span>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>{copied ? 'Link Copied!' : 'Share'}</span>
              </button>
            </div>

            <h1 className="font-['Syne'] text-3xl sm:text-4xl font-extrabold text-white mt-1">
              {beat.title}
            </h1>
            <p className="text-sm text-amber-400/90 font-medium mt-1">
              {PRODUCER_CREDIT}
            </p>

            {beat.description && (
              <p className="text-xs sm:text-sm text-zinc-300 mt-4 leading-relaxed">
                {beat.description}
              </p>
            )}
          </div>

          {/* License Selection Deck */}
          <div className="space-y-4">
            <h3 className="font-['Syne'] text-base font-bold text-white uppercase tracking-wider">
              Select Commercial License Tier
            </h3>

            {beat.status === 'exclusive_sold' ? (
              <div className="p-5 rounded-xl border border-red-800 bg-red-950/30 text-red-200 text-xs">
                <strong>Sold Out:</strong> This beat was purchased exclusively and has been permanently archived. No further licenses can be issued for this instrumental.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(['mp3', 'wav', 'premium', 'unlimited', 'exclusive'] as LicenseTierKey[]).map((tierKey) => {
                    const info = LICENSE_TIERS[tierKey];
                    const isSelected = selectedTier === tierKey;
                    return (
                      <button
                        key={tierKey}
                        onClick={() => setSelectedTier(tierKey)}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/10 text-white shadow-md'
                            : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <span className="text-xs font-bold block truncate">{info.name.replace(' License', '')}</span>
                        <span className={`text-base font-mono font-extrabold mt-1 block ${isSelected ? 'text-amber-400' : 'text-zinc-200'}`}>
                          ${info.price.toFixed(2)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Tier Features Box */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                    <div>
                      <h4 className="font-['Syne'] text-lg font-bold text-white">
                        {activeTierInfo.name} — <span className="font-mono text-amber-400">${activeTierInfo.price.toFixed(2)}</span>
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">{activeTierInfo.filesDescription}</p>
                    </div>

                    <button
                      onClick={() => onViewAgreement(selectedTier, beat.title)}
                      className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 underline"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Preview Legal Agreement Contract</span>
                    </button>
                  </div>

                  {/* Checklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-zinc-300">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-amber-400 shrink-0" />
                      <span><strong>Distribution:</strong> {activeTierInfo.distributionLimit}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-amber-400 shrink-0" />
                      <span><strong>Audio Streams:</strong> {activeTierInfo.streamingLimit}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-amber-400 shrink-0" />
                      <span><strong>Music Videos:</strong> {activeTierInfo.videoLimit}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-amber-400 shrink-0" />
                      <span><strong>Broadcasting:</strong> {activeTierInfo.radioLimit}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-amber-400 shrink-0" />
                      <span><strong>Live Shows:</strong> {activeTierInfo.livePerformance}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-amber-400 shrink-0" />
                      <span><strong>Monetized YouTube:</strong> {activeTierInfo.youtubeChannels}</span>
                    </div>
                  </div>

                  {/* CTAs */}
                  <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      onClick={handleAddToCart}
                      className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-6 py-3 text-xs font-semibold text-white hover:bg-zinc-700 transition-colors"
                    >
                      <ShoppingBag className="h-4 w-4 text-amber-400" />
                      <span>{addedToast ? '✓ Added to Cart' : 'Add License to Cart'}</span>
                    </button>

                    <button
                      onClick={handleBuyNow}
                      className="w-full sm:w-auto flex-1 rounded-lg bg-amber-500 px-6 py-3 text-xs font-bold text-black hover:bg-amber-400 transition-colors shadow-md"
                    >
                      Instant Checkout (${activeTierInfo.price.toFixed(2)})
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Related Beats */}
      {relatedBeats.length > 0 && (
        <div className="pt-12 border-t border-zinc-800 space-y-6">
          <h3 className="font-['Syne'] text-xl font-bold text-white">
            Similar Instrumentals
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedBeats.map((rel) => (
              <div
                key={rel.id}
                onClick={() => onSelectBeatDetail(rel.slug)}
                className="group cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 hover:border-zinc-700 transition-all space-y-3"
              >
                <div className="aspect-square overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
                  <img
                    src={rel.artworkUrl}
                    alt={rel.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div>
                  <h4 className="font-['Syne'] text-sm font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                    {rel.title}
                  </h4>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    {rel.bpm} BPM • {rel.key}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
