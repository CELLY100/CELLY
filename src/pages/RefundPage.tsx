import React from 'react';
import { AlertCircle } from 'lucide-react';
import { SUPPORT_EMAIL } from '../lib/licenseConstants';

export const RefundPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-14 space-y-8 text-zinc-300 text-xs sm:text-sm leading-relaxed">
      <div className="border-b border-zinc-800 pb-6 space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
          Purchasing Policies
        </span>
        <h1 className="font-['Syne'] text-3xl sm:text-4xl font-extrabold text-white">
          Refund &amp; Revocation Policy
        </h1>
        <p className="text-xs text-zinc-400">Last updated: September 2026</p>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 flex items-start gap-3.5 text-xs text-amber-200">
        <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <p>
          Due to the instant, digital nature of downloadable audio assets (lossless WAVs, trackout stems, untagged MP3s) and the immediate issuance of signed legal PDF contracts, all digital beat sales are final.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-['Syne'] text-lg font-bold text-white">1. Digital Beat Licenses</h2>
        <p>
          Once a transaction has been confirmed and the digital files or license tokens have been generated, no refunds, returns, or chargebacks will be granted under any circumstances, including but not limited to buyer's remorse, failure to review licensing tier limits, or accidental tier selection.
        </p>
        <p>
          If you experience technical issues downloading your audio files or license agreements, contact our support team immediately at <strong>{SUPPORT_EMAIL}</strong> and we will promptly supply new direct download links.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-['Syne'] text-lg font-bold text-white">2. Stereo Mastering Service Revisions &amp; Refunds</h2>
        <p>
          Mastering orders include 1 complimentary revision cycle to fine-tune EQ balances, overall loudness targets, or high-frequency response. Because mastering represents customized technical labor performed on your specific stereo bounce, mastering orders are non-refundable once audio processing has commenced.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-['Syne'] text-lg font-bold text-white">3. License Revocation for Breach</h2>
        <p>
          CELLY reserves the absolute right to revoke any granted license immediately without refund in the event of:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-zinc-400">
          <li>Unauthorized registration of the instrumental in YouTube Content ID or Shazam.</li>
          <li>Intentional omission of mandatory production credit ("Prod. by Celly").</li>
          <li>Exceeding allowable streaming or distribution caps without acquiring an upgrade.</li>
          <li>Initiating an unauthorized credit card or PayPal payment dispute/chargeback.</li>
        </ul>
      </section>
    </div>
  );
};
