import React, { useState } from 'react';
import { X, Check, FileText, ShoppingBag, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { Beat, LicenseTierKey } from '../types';
import { LICENSE_TIERS, PRODUCER_CREDIT } from '../lib/licenseConstants';
import { useCart } from '../context/CartContext';

interface LicenseModalProps {
  beat: Beat | null;
  isOpen: boolean;
  onClose: () => void;
  onViewAgreement: (tier: LicenseTierKey, beatTitle: string) => void;
  onGoToCheckout?: () => void;
}

export const LicenseModal: React.FC<LicenseModalProps> = ({
  beat,
  isOpen,
  onClose,
  onViewAgreement,
  onGoToCheckout,
}) => {
  const { addBeatLicense } = useCart();
  const [selectedTier, setSelectedTier] = useState<LicenseTierKey>('mp3');
  const [addedToast, setAddedToast] = useState(false);

  if (!isOpen || !beat) return null;

  const tiers: LicenseTierKey[] = ['mp3', 'wav', 'premium', 'unlimited', 'exclusive'];
  const activeInfo = LICENSE_TIERS[selectedTier];

  const handleAddToCart = () => {
    addBeatLicense(beat.id, beat.title, beat.slug, beat.artworkUrl, selectedTier);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  const handleBuyNow = () => {
    addBeatLicense(beat.id, beat.title, beat.slug, beat.artworkUrl, selectedTier);
    onClose();
    if (onGoToCheckout) onGoToCheckout();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-xl border border-zinc-800 bg-[#0d0f17] shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4 bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <img
              src={beat.artworkUrl}
              alt={beat.title}
              className="h-12 w-12 rounded object-cover border border-zinc-700"
            />
            <div>
              <h3 className="font-['Syne'] text-lg font-bold text-white leading-tight">
                {beat.title}
              </h3>
              <p className="text-xs text-amber-400 font-medium">
                {PRODUCER_CREDIT} • {beat.bpm} BPM • {beat.key}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {beat.status === 'exclusive_sold' ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-red-950/40 border border-red-800 text-red-300">
              <AlertCircle className="h-6 w-6 shrink-0 text-red-400" />
              <div>
                <p className="font-bold text-sm">EXCLUSIVE LICENSE SOLD</p>
                <p className="text-xs text-red-200/80">
                  This beat was purchased with an Exclusive License and has been permanently retired from the store. No further licenses can be issued.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Tiers Selector Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {tiers.map((t) => {
                  const info = LICENSE_TIERS[t];
                  const isSelected = selectedTier === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setSelectedTier(t)}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 text-white shadow-md'
                          : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <span className="text-xs font-bold leading-tight line-clamp-1">{info.name.replace(' License', '')}</span>
                      <span className={`text-base font-extrabold mt-1 font-mono ${isSelected ? 'text-amber-400' : 'text-zinc-200'}`}>
                        ${info.price.toFixed(2)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Tier Details Box */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                  <div>
                    <h4 className="font-['Syne'] text-base font-bold text-white">
                      {activeInfo.name} — <span className="font-mono text-amber-400">${activeInfo.price.toFixed(2)}</span>
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">{activeInfo.filesDescription}</p>
                  </div>
                  <button
                    onClick={() => onViewAgreement(selectedTier, beat.title)}
                    className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 underline underline-offset-4"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>View Official Agreement Contract</span>
                  </button>
                </div>

                {/* Rights Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Check className="h-4 w-4 text-amber-400 shrink-0" />
                    <span><strong>Distribution:</strong> {activeInfo.distributionLimit}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Check className="h-4 w-4 text-amber-400 shrink-0" />
                    <span><strong>Streaming:</strong> {activeInfo.streamingLimit}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Check className="h-4 w-4 text-amber-400 shrink-0" />
                    <span><strong>Music Videos:</strong> {activeInfo.videoLimit}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Check className="h-4 w-4 text-amber-400 shrink-0" />
                    <span><strong>Radio Broadcast:</strong> {activeInfo.radioLimit}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Check className="h-4 w-4 text-amber-400 shrink-0" />
                    <span><strong>Live Shows:</strong> {activeInfo.livePerformance}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Check className="h-4 w-4 text-amber-400 shrink-0" />
                    <span><strong>Monetized YouTube:</strong> {activeInfo.youtubeChannels}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-300 col-span-1 sm:col-span-2">
                    <Check className="h-4 w-4 text-amber-400 shrink-0" />
                    <span><strong>Publishing &amp; Royalties:</strong> {activeInfo.publishing}</span>
                  </div>
                </div>

                {selectedTier === 'exclusive' && (
                  <div className="rounded border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                    <p className="font-semibold">Exclusive License Guarantee:</p>
                    <p className="mt-0.5 text-amber-300/80">
                      Upon verified payment, "{beat.title}" is immediately and permanently removed from the CELLY store. No new licenses will ever be sold. Prior valid non-exclusive licenses remain valid.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Action Buttons */}
          {beat.status !== 'exclusive_sold' && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Instant untagged files + Signed legal PDF agreement</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-700 bg-zinc-800 text-xs font-semibold text-white hover:bg-zinc-700 transition-colors"
                >
                  <ShoppingBag className="h-4 w-4 text-amber-400" />
                  <span>{addedToast ? '✓ Added to Cart' : 'Add to Cart'}</span>
                </button>

                <button
                  onClick={handleBuyNow}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 text-xs font-bold text-black hover:bg-amber-400 transition-colors shadow-md"
                >
                  <span>Checkout (${activeInfo.price.toFixed(2)})</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
