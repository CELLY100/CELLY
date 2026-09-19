import React, { useState } from 'react';
import { ShoppingBag, Trash2, ShieldCheck, Download, ArrowRight, CheckCircle2, AlertCircle, FileText, Lock, Sliders, ExternalLink } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { LicenseTierKey } from '../types';
import { SUPPORT_EMAIL, PRODUCER_CREDIT } from '../lib/licenseConstants';

interface CheckoutPageProps {
  setCurrentTab: (tab: string) => void;
  onViewAgreement: (tier: LicenseTierKey, beatTitle: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ setCurrentTab, onViewAgreement }) => {
  const {
    items,
    itemCount,
    subtotal,
    discountAmount,
    total,
    discountCode,
    discountError,
    removeItem,
    clearCart,
    applyDiscount,
    removeDiscount,
  } = useCart();

  const { user } = useAuth();

  const hasBeats = items.some((i) => i.itemType === 'beat_license');
  const hasMastering = items.some((i) => i.itemType === 'mastering');
  const isMasteringOnly = hasMastering && !hasBeats;

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [inputCoupon, setInputCoupon] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    await applyDiscount(inputCoupon.trim());
    setInputCoupon('');
  };

  const handleCompleteCheckout = async () => {
    setOrderError(null);

    if (!customerName.trim()) {
      setOrderError(
        isMasteringOnly
          ? 'Please provide your name or artist name for the mastering project.'
          : 'Please provide your full legal name for the license contract.'
      );
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      setOrderError(
        isMasteringOnly
          ? 'Please provide a valid email address to receive your mastering project updates.'
          : 'Please provide a valid email address to receive your files and license PDF.'
      );
      return;
    }
    if (!termsAccepted) {
      setOrderError(
        isMasteringOnly
          ? 'You must review and accept the Mastering Service Terms.'
          : 'You must review and accept the official License Agreement and Terms of Service.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          discountCode: discountCode || undefined,
          termsAccepted: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      setOrderSuccess(data);
      clearCart();
    } catch (err: any) {
      setOrderError(err.message || 'An error occurred during checkout processing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSuccess) {
    const isSuccessMasteringOnly =
      (!orderSuccess.licenses || orderSuccess.licenses.length === 0) &&
      orderSuccess.mastering &&
      orderSuccess.mastering.length > 0;

    return (
      <div className="mx-auto max-w-3xl px-4 py-16 space-y-8">
        <div className="rounded-2xl border border-emerald-500/40 bg-zinc-900/80 p-8 shadow-2xl text-center space-y-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto">
            <CheckCircle2 className="h-9 w-9" />
          </div>

          <div className="space-y-2">
            <h2 className="font-['Syne'] text-3xl font-extrabold text-white">
              {isSuccessMasteringOnly ? 'Mastering Order Confirmed & Queued!' : 'Order Confirmed & Licensed!'}
            </h2>
            <p className="text-xs text-zinc-300">
              Order Reference: <span className="font-mono text-amber-400 font-bold">{orderSuccess.orderId}</span>
            </p>
            <p className="text-xs text-zinc-400">
              {isSuccessMasteringOnly ? (
                <>
                  A project confirmation receipt has been dispatched to <strong>{orderSuccess.customerEmail}</strong>. (Legal licensing agreements apply only to beat purchases).
                </>
              ) : (
                <>
                  A receipt, download links, and legal PDF license agreements have been prepared for <strong>{orderSuccess.customerEmail}</strong>.
                </>
              )}
            </p>
          </div>

          {/* Generated Licenses & Downloads (Only if beat licenses exist) */}
          {orderSuccess.licenses && orderSuccess.licenses.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 text-left space-y-4">
              <h4 className="font-['Syne'] text-sm font-bold text-white uppercase tracking-wider">
                Issued Beat Licenses &amp; Legal Agreements
              </h4>

              <div className="space-y-3">
                {orderSuccess.licenses.map((lic: any) => (
                  <div
                    key={lic.licenseId}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/60 gap-3"
                  >
                    <div>
                      <span className="font-bold text-sm text-white">{lic.beatTitle}</span>
                      <div className="text-xs text-amber-400/90 font-mono">
                        License ID: {lic.licenseId} ({lic.licenseTier.toUpperCase()})
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`/api/customer/licenses/${lic.licenseId}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download Signed PDF</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mastering Details */}
          {orderSuccess.mastering && orderSuccess.mastering.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-zinc-950 p-5 text-left space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Sliders className="h-4 w-4" />
                  <span>Mastering Project Queue ({orderSuccess.mastering.length} Track{orderSuccess.mastering.length > 1 ? 's' : ''})</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30">
                  Awaiting Mix Files
                </span>
              </div>

              <div className="space-y-2">
                {orderSuccess.mastering.map((m: any) => (
                  <div key={m.masteringId} className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs">
                    <div className="font-bold text-white text-sm">{m.songTitle}</div>
                    <div className="text-zinc-400 text-[11px] mt-0.5">
                      Project ID: <span className="font-mono text-zinc-300">{m.masteringId}</span>
                    </div>
                    {m.notes && (
                      <p className="text-zinc-400 text-[11px] mt-1 bg-zinc-950/60 p-2 rounded">
                        Notes: {m.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 leading-relaxed">
                <strong>Important Service Notice:</strong> Mixing is strictly not offered. Please upload your final, unmastered stereo bounce (WAV 24-bit / 44.1kHz or higher) with -6dB headroom from your Account Dashboard to commence mastering.
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => setCurrentTab('account')}
              className="rounded-lg bg-amber-500 px-6 py-2.5 text-xs font-bold text-black hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
            >
              Go to Account &amp; Upload Mix Files
            </button>
            <button
              onClick={() => setCurrentTab('store')}
              className="rounded-lg bg-zinc-800 px-6 py-2.5 text-xs font-bold text-white hover:bg-zinc-700 transition-colors"
            >
              Continue Browsing Beats
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (itemCount === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-600 mx-auto">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h2 className="font-['Syne'] text-2xl font-bold text-white">Your Cart is Empty</h2>
        <p className="text-xs text-zinc-400 max-w-md mx-auto">
          You have not added any beat licenses or mastering orders yet. Explore our beat catalog or book audio mastering.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setCurrentTab('store')}
            className="rounded-lg bg-amber-500 px-5 py-2.5 text-xs font-bold text-black hover:bg-amber-400"
          >
            Browse Beats
          </button>
          <button
            onClick={() => setCurrentTab('mastering')}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
          >
            Book Stereo Mastering
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
          Order Summary
        </span>
        <h1 className="font-['Syne'] text-3xl sm:text-4xl font-extrabold text-white mt-1">
          Review &amp; Checkout
        </h1>
      </div>

      {orderError && (
        <div className="rounded-lg border border-red-800 bg-red-950/40 p-4 flex items-center gap-3 text-red-200 text-xs">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <span>{orderError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-[#0d0f17] overflow-hidden">
            <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/40 flex justify-between items-center text-xs font-bold text-zinc-400 uppercase tracking-wider">
              <span>Selected Items ({itemCount})</span>
              <button
                onClick={clearCart}
                className="text-zinc-500 hover:text-red-400 transition-colors"
              >
                Clear Cart
              </button>
            </div>

            <div className="divide-y divide-zinc-800/60">
              {items.map((item, idx) => {
                if (item.itemType === 'beat_license') {
                  return (
                    <div key={idx} className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.artworkUrl}
                          alt={item.beatTitle}
                          className="h-14 w-14 rounded object-cover border border-zinc-700 shrink-0"
                        />
                        <div>
                          <h4 className="font-['Syne'] text-sm font-bold text-white">
                            {item.beatTitle}
                          </h4>
                          <span className="text-xs text-amber-400 font-semibold block">
                            {item.licenseName}
                          </span>
                          <button
                            onClick={() => onViewAgreement(item.licenseTier, item.beatTitle)}
                            className="text-[11px] text-zinc-400 hover:text-amber-300 underline mt-0.5 inline-block"
                          >
                            Preview Legal Contract
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-mono text-sm font-extrabold text-white">
                          ${item.price.toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeItem(idx)}
                          className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                          title="Remove Item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div key={idx} className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-14 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                          <Sliders className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-['Syne'] text-sm font-bold text-white">
                            Professional Stereo Mastering
                          </h4>
                          <span className="text-xs text-zinc-400 block">
                            Project: "{item.songTitle}"
                          </span>
                          <span className="text-[10px] text-amber-400">
                            Mastering Only (No Mixing)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-mono text-sm font-extrabold text-white">
                          ${item.price.toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeItem(idx)}
                          className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                          title="Remove Item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          </div>

          {/* Coupon Code Input */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                value={inputCoupon}
                onChange={(e) => setInputCoupon(e.target.value.toUpperCase())}
                placeholder="Discount Code (Try: CELLY10)"
                className="flex-1 rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 uppercase font-mono"
              />
              <button
                type="submit"
                className="rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 text-xs font-semibold"
              >
                Apply
              </button>
            </form>

            {discountCode && (
              <div className="mt-2 flex items-center justify-between text-xs text-emerald-400 font-mono">
                <span>Code applied: {discountCode} (-${discountAmount.toFixed(2)})</span>
                <button onClick={removeDiscount} className="text-red-400 hover:underline text-[11px]">
                  Remove
                </button>
              </div>
            )}

            {discountError && (
              <p className="mt-2 text-xs text-red-400">{discountError}</p>
            )}
          </div>
        </div>

        {/* Right Column: Customer Info & Payment */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-xl border border-zinc-800 bg-[#0d0f17] p-6 shadow-2xl space-y-5">
            <h3 className="font-['Syne'] text-lg font-bold text-white border-b border-zinc-800 pb-3">
              {isMasteringOnly ? 'Customer & Project Details' : 'Licensee & Billing Details'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  {isMasteringOnly ? 'Full Name / Artist Name' : 'Full Legal Name / Artist Name'} <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Marcus Vance"
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {isMasteringOnly
                    ? 'Your artist or project name for mastering communications and audio delivery.'
                    : 'This legal name will be permanently written into your PDF license agreement.'}
                </p>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Email Address <span className="text-amber-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="artist@label.com"
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {isMasteringOnly
                    ? 'Your project updates, receipts, and completed masters will be delivered here.'
                    : 'Your lossless audio files and signed PDF contract will be delivered here.'}
                </p>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2 border-t border-zinc-800 pt-4 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span className="font-mono text-zinc-200">${subtotal.toFixed(2)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount ({discountCode})</span>
                  <span className="font-mono">-${discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-base font-bold text-white border-t border-zinc-800/80 pt-2">
                <span>Total Due</span>
                <span className="font-mono text-amber-400 text-lg">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Affirmative Agreement Checkbox: Differentiated by Cart Type */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-amber-500 bg-zinc-900 border-zinc-700 cursor-pointer"
                />
                {isMasteringOnly ? (
                  <span className="text-xs text-zinc-300 leading-relaxed">
                    I agree to the <span className="text-amber-400 font-semibold">Mastering Service Terms</span>: mixing is strictly not offered, stems are not accepted, and I must provide a completed unmastered stereo bounce. <span className="text-zinc-400">(Legal licensing agreements apply only to beat purchases).</span>
                  </span>
                ) : hasBeats && !hasMastering ? (
                  <span className="text-xs text-zinc-300 leading-relaxed">
                    I agree to the{' '}
                    <button type="button" onClick={() => onViewAgreement('mp3', 'License Contract')} className="text-amber-400 underline font-semibold">
                      Official License Terms
                    </button>
                    , acknowledge mandatory production credit <strong>"{PRODUCER_CREDIT}"</strong>, and accept the immediate execution of this legal PDF license agreement.
                  </span>
                ) : (
                  <span className="text-xs text-zinc-300 leading-relaxed">
                    I agree to the{' '}
                    <button type="button" onClick={() => onViewAgreement('mp3', 'License Contract')} className="text-amber-400 underline font-semibold">
                      Official License Terms
                    </button>{' '}
                    for beat purchases (acknowledging mandatory production credit <strong>"{PRODUCER_CREDIT}"</strong>), and agree to the Mastering Service Terms (completed stereo bounce required, mixing not offered).
                  </span>
                )}
              </label>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCompleteCheckout}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-500 py-3.5 text-xs font-extrabold text-black hover:bg-amber-400 transition-all shadow-lg hover:shadow-amber-500/20 active:scale-98 disabled:opacity-50"
            >
              <Lock className="h-4 w-4" />
              <span>
                {isSubmitting
                  ? isMasteringOnly
                    ? 'Processing Mastering Order...'
                    : 'Processing Order & Generating PDF...'
                  : isMasteringOnly
                    ? `Confirm & Book Mastering ($${total.toFixed(2)})`
                    : `Confirm & Pay $${total.toFixed(2)}`}
              </span>
            </button>

            <div className="text-[11px] text-center text-zinc-500 space-y-1">
              <p>
                {isMasteringOnly
                  ? 'Direct project queueing & confirmation receipt upon order completion.'
                  : 'Instant file access & legal contract generation upon confirmation.'}
              </p>
              <p>Encrypted 256-bit checkout • Support: {SUPPORT_EMAIL}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
